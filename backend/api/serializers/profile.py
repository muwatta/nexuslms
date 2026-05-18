# backend/api/serializers/profile.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from backend.api.core.models import Profile, Enrollment, AuditLog
from backend.api.core.models.subjectassignment import SubjectAssignment

User = get_user_model()


# ── Nested user serializer 

class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id", "username"]


# ── Main read serializer 

class ProfileSerializer(serializers.ModelSerializer):
    user = NestedUserSerializer(read_only=True)

    # Flat convenience aliases
    user_username = serializers.CharField(source="user.username", read_only=True)
    user_email    = serializers.CharField(source="user.email",    read_only=True)

    department_display   = serializers.CharField(source="get_department_display",   read_only=True)
    role_display         = serializers.CharField(source="get_role_display",         read_only=True)
    teacher_type_display = serializers.SerializerMethodField()
    # Backwards compat alias
    instructor_type_display = serializers.SerializerMethodField()

    valid_class_choices = serializers.SerializerMethodField()

    class Meta:
        model  = Profile
        fields = [
            "user",
            "user_username", "user_email",
            "id", "department", "department_display",
            "student_class", "class_section", "display_class", "stream", "role", "role_display",
            "teacher_type", "teacher_type_display",
            # backwards compat — same value as teacher_type
            "instructor_type_display",
            "bio", "phone", "address", "parent_email", "student_id",
            "created_at", "updated_at",
            "valid_class_choices",
        ]
        read_only_fields = ["student_id", "created_at", "updated_at"]

    def get_teacher_type_display(self, obj):
        t = getattr(obj, "teacher_type", None) or getattr(obj, "instructor_type", None)
        if not t:
            return ""
        mapping = {"class": "Class Teacher", "subject": "Subject Teacher"}
        return mapping.get(t, t.title())

    def get_instructor_type_display(self, obj):
        return self.get_teacher_type_display(obj)

    def get_display_class(self, obj):
        return obj.display_class if hasattr(obj, 'display_class') else obj.student_class or ""

    def get_valid_class_choices(self, obj):
        return Profile.get_classes_for_department(obj.department)

    def validate(self, data):
        if data.get("student_class") and data.get("department"):
            valid = [c[0] for c in Profile.get_classes_for_department(data["department"])]
            if data["student_class"] not in valid:
                raise serializers.ValidationError({
                    "student_class": f"Invalid class for {data['department']} department"
                })
        return data

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()
        return super().update(instance, validated_data)


# ── Write serializer (self-service update_me)
class ProfileCreateUpdateSerializer(serializers.ModelSerializer):
    
    first_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    last_name  = serializers.CharField(required=False, allow_blank=True, write_only=True)
    email      = serializers.EmailField(required=False, write_only=True)

    class Meta:
        model  = Profile
        fields = [
            "first_name", "last_name", "email",
            "department", "student_class", "stream", "role",
            "teacher_type", "bio", "phone", "address", "parent_email",
        ]
        read_only_fields = ["role", "department", "teacher_type"]

    def validate(self, data):
        student_class = data.get("student_class")
        department    = data.get("department") or getattr(self.instance, "department", None)
        if student_class and department:
            valid = [c[0] for c in Profile.get_classes_for_department(department)]
            if student_class not in valid:
                raise serializers.ValidationError(
                    {"student_class": f"Invalid class for {department} department"}
                )
        return data

    def update(self, instance, validated_data):
        first_name = validated_data.pop("first_name", None)
        last_name  = validated_data.pop("last_name",  None)
        email      = validated_data.pop("email",      None)

        user    = instance.user
        changed = False
        if first_name is not None: user.first_name = first_name; changed = True
        if last_name  is not None: user.last_name  = last_name;  changed = True
        if email      is not None: user.email      = email;      changed = True
        if changed:
            user.save()
        return super().update(instance, validated_data)


# ── SubjectAssignment serializer 

class SubjectAssignmentSerializer(serializers.ModelSerializer):
    teacher_name   = serializers.CharField(source="teacher.username",       read_only=True)
    student_name   = serializers.CharField(source="student.username",       read_only=True)
    subject_display = serializers.SerializerMethodField()

    class Meta:
        model  = SubjectAssignment
        fields = [
            "id", "student", "student_name",
            "teacher", "teacher_name",
            "subject", "subject_display",
            "is_auto_assigned", "created_at", "updated_at",
        ]
        read_only_fields = ["is_auto_assigned", "created_at", "updated_at"]

    def get_subject_display(self, obj):
        return dict(SubjectAssignment._meta.get_field("subject").choices).get(
            obj.subject, obj.subject
        )

    def validate(self, data):

        teacher = data.get("teacher") or (self.instance and self.instance.teacher)
        if teacher:
            try:
                if teacher.profile.role != "teacher":
                    raise serializers.ValidationError(
                        {"teacher": "Assigned user must have the 'teacher' role."}
                    )
            except AttributeError:
                pass
        return data


# ── Enrollment serializer 

class EnrollmentSerializer(serializers.ModelSerializer):
    student_name          = serializers.CharField(source="student.user.username", read_only=True)
    course_title          = serializers.CharField(source="course.title",          read_only=True)
    promoted_from_details = serializers.SerializerMethodField()

    class Meta:
        model  = Enrollment
        fields = [
            "id", "student", "student_name", "course", "course_title",
            "academic_year", "status", "enrolled_at", "completed_at",
            "promoted_from", "promoted_from_details", "promoted_at",
            "created_at", "updated_at",
        ]
        read_only_fields = ["enrolled_at", "promoted_at", "created_at", "updated_at"]

    def get_promoted_from_details(self, obj):
        if obj.promoted_from:
            return {
                "id":            obj.promoted_from.id,
                "course":        obj.promoted_from.course.title,
                "academic_year": obj.promoted_from.academic_year,
            }
        return None


# ── AuditLog serializer 

class AuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model  = AuditLog
        fields = [
            "id", "user", "user_username", "action", "model_name",
            "object_id", "old_values", "new_values", "timestamp", "ip_address",
        ]
        read_only_fields = ["timestamp"]


class ArchiveRestoreSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


class PromoteStudentSerializer(serializers.Serializer):
    next_course_id = serializers.IntegerField(required=True)
    academic_year  = serializers.CharField(required=False, max_length=9)

    def validate_academic_year(self, value):
        if value and "/" not in value:
            raise serializers.ValidationError("Format must be YYYY/YYYY")
        return value


try:
    from backend.api.core.models import InstructorAssignment

    class InstructorAssignmentSerializer(serializers.ModelSerializer):
        instructor_name  = serializers.CharField(source="instructor.user.username", read_only=True)
        subject_title    = serializers.CharField(source="subject.title",            read_only=True)
        assigned_by_name = serializers.CharField(source="assigned_by.username",     read_only=True)

        class Meta:
            model  = InstructorAssignment
            fields = [
                "id", "instructor", "instructor_name", "subject", "subject_title",
                "student_class", "is_active", "assigned_by", "assigned_by_name",
                "assigned_at", "created_at", "updated_at",
            ]
            read_only_fields = ["assigned_by", "assigned_at", "created_at", "updated_at"]

except Exception:
    class InstructorAssignmentSerializer(serializers.Serializer):
        pass
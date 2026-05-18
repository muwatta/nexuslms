# backend/api/filters.py

from django_filters import rest_framework as filters

from .core.models import Course, Enrollment, Quiz


class CourseFilter(filters.FilterSet):
    instructor    = filters.NumberFilter(field_name="instructor__id")
    title         = filters.CharFilter(field_name="title",         lookup_expr="icontains")
    department    = filters.CharFilter(field_name="department",    lookup_expr="exact")
    student_class = filters.CharFilter(field_name="student_class", lookup_expr="exact")
    is_active     = filters.BooleanFilter(field_name="is_active")

    class Meta:
        model  = Course
        fields = ["instructor", "title", "department", "student_class", "is_active"]


class EnrollmentFilter(filters.FilterSet):
    student = filters.NumberFilter(field_name="student__id")
    course  = filters.NumberFilter(field_name="course__id")

    class Meta:
        model  = Enrollment
        fields = ["student", "course"]


class QuizFilter(filters.FilterSet):
    course = filters.NumberFilter(field_name="course__id")
    title  = filters.CharFilter(field_name="title", lookup_expr="icontains")

    class Meta:
        model  = Quiz
        fields = ["course", "title"]
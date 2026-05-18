from backend.api.core.models import User

def get_parent_child(parent_user):
    return User.objects.filter(
        profile__parent_email=parent_user.email
    ).select_related("profile").first()
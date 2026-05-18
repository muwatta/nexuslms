from api.models import User

def get_parent_child(parent):
    return User.objects.filter(
        profile__parent_email=parent.email
    ).select_related("profile").first()
from django.contrib import admin
from django.contrib.auth.models import Group

from . import assessment    
from . import gamification  
from . import chat        
from . import results      

from .users import CustomGroupAdmin, CustomUserAdmin
from api.core.models import User

try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass
admin.site.register(Group, CustomGroupAdmin)

try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass
admin.site.register(User, CustomUserAdmin)
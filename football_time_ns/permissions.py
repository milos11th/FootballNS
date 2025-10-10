from rest_framework.permissions import BasePermission

class IsOwnerRole(BasePermission):
   
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return hasattr(request.user, 'profile') and request.user.profile.role == 'owner'
        return False

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

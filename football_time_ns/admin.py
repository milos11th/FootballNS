from django.contrib import admin
from .models import Hall, Profile

@admin.register(Hall)
class HallAdmin(admin.ModelAdmin):
    list_display = ('id','name','owner','price')
    list_filter = ('owner',)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user','role')
    list_filter = ('role',)

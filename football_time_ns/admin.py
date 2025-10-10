from django.contrib import admin
from django.utils.html import format_html
from .models import Hall, HallImage, Profile, Availability, Appointment

class HallImageInline(admin.TabularInline):
    model = HallImage
    extra = 1
    readonly_fields = ('preview',)
    fields = ('image', 'preview')

    def preview(self, obj):
        if obj and getattr(obj, 'image', None):
            return format_html(
                '<img src="{}" style="max-height:100px; max-width:200px; object-fit:cover; border-radius:4px;" />',
                obj.image.url
            )
        return ""
    preview.short_description = "Preview"


@admin.register(Hall)
class HallAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'price', 'image_preview')
    list_filter = ('owner',)
    search_fields = ('name', 'address', 'owner__username')
    inlines = [HallImageInline]

    def image_preview(self, obj):
        
        first = None
        if hasattr(obj, 'images'):
            first = obj.images.first()
        if first and getattr(first, 'image', None):
            return format_html('<img src="{}" style="height:50px; border-radius:4px;" />', first.image.url)
        if getattr(obj, 'image', None):
            return format_html('<img src="{}" style="height:50px; border-radius:4px;" />', obj.image.url)
        return "-"
    image_preview.short_description = "Image"


@admin.register(HallImage)
class HallImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'hall', 'image', 'image_preview')
    readonly_fields = ('image_preview',)

    def image_preview(self, obj):
        if getattr(obj, 'image', None):
            return format_html('<img src="{}" style="height:50px; border-radius:4px;" />', obj.image.url)
        return ""
    image_preview.short_description = "Preview"


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ('id', 'hall', 'start', 'end')
    list_filter = ('hall',)
    date_hierarchy = 'start'
    search_fields = ('hall__name',)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'hall', 'user', 'start', 'end', 'status', 'checked_in')
    list_filter = ('status', 'hall')
    search_fields = ('user__username', 'hall__name')
    actions = ['mark_approved', 'mark_rejected']

    def mark_approved(self, request, queryset):
        updated = queryset.update(status='approved')
        self.message_user(request, f"{updated} appointment(s) marked as approved.")
    mark_approved.short_description = "Mark selected appointments as approved"

    def mark_rejected(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f"{updated} appointment(s) marked as rejected.")
    mark_rejected.short_description = "Mark selected appointments as rejected"

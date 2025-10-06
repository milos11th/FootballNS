from django.urls import path
from .views import (
    AvailabilityDelete, HallImageDelete, HallImagesCreate, HallList, HallCreate, HallDetail, OwnerAllAppointments, OwnerExportPDF, OwnerMonthlyStats, RegisterView, MeView,
    AvailabilityCreate, AvailabilityList, HallFreeSlots,
    AppointmentCreateView, AppointmentList, OwnerPendingAppointments,
    OwnerApproveAppointment, AppointmentCheckIn, AppointmentDelete,MyHallsView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('halls/', HallList.as_view(), name='hall_list'),
    path('halls/create/', HallCreate.as_view(), name='hall_create'),
    path('halls/<int:pk>/', HallDetail.as_view(), name='hall_detail'),
    path("my-halls/", MyHallsView.as_view(), name="my-halls"),
    path('halls/<int:hall_id>/images/', HallImagesCreate.as_view(), name='hall_images_create'),
    path('halls/images/<int:pk>/', HallImageDelete.as_view(), name='hall_image_delete'),

    # availability
    path('availabilities/create/', AvailabilityCreate.as_view(), name='availability_create'),
    path('availabilities/', AvailabilityList.as_view(), name='availability_list'),  # BEZ hall_id
    path('halls/<int:hall_id>/free/', HallFreeSlots.as_view(), name='hall_free_slots'),
    path('availabilities/<int:pk>/', AvailabilityDelete.as_view(), name='availability_delete'),

    # auth
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/me/', MeView.as_view(), name='me'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # appointments
    path('appointments/', AppointmentList.as_view(), name='appointment_list'),
    path('appointments/create/', AppointmentCreateView.as_view(), name='appointment_create'),
    path('appointments/<int:pk>/owner-action/', OwnerApproveAppointment.as_view(), name='owner_action'),
    path('halls/<int:hall_id>/pending/', OwnerPendingAppointments.as_view(), name='owner_pending'),
    path('appointments/<int:pk>/checkin/', AppointmentCheckIn.as_view(), name='appointment_checkin'),
    path('appointments/<int:pk>/delete/', AppointmentDelete.as_view(), name='appointment_delete'),
    path('owner/appointments/', OwnerAllAppointments.as_view(), name='owner_all_appointments'),
    path('owner/export-pdf/', OwnerExportPDF.as_view(), name='owner_export_pdf'),
    path('owner/monthly-stats/', OwnerMonthlyStats.as_view(), name='owner_monthly_stats'),
]
    
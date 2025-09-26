from django.urls import path
from .views import (
    HallList, HallCreate, HallDetail, RegisterView, MeView,
    AvailabilityCreate, AvailabilityList, HallFreeSlots,
    AppointmentCreateView, AppointmentList, OwnerPendingAppointments,
    OwnerApproveAppointment, AppointmentCheckIn, AppointmentDelete
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('halls/', HallList.as_view(), name='hall_list'),
    path('halls/create/', HallCreate.as_view(), name='hall_create'),
    path('halls/<int:pk>/', HallDetail.as_view(), name='hall_detail'),

    # availability
    path('availabilities/create/', AvailabilityCreate.as_view(), name='availability_create'),
    path('availabilities/', AvailabilityList.as_view(), name='availability_list'),
    path('halls/<int:hall_id>/free/', HallFreeSlots.as_view(), name='hall_free_slots'),

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
]
    
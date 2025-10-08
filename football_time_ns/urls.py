from django.urls import path
from .views import (
    AvailabilityDelete, ChangePasswordView, CustomTokenObtainPairView, HallImageDelete, HallImagesCreate, HallList, HallCreate, HallDetail, HallReviewsView, OwnerAllAppointments, OwnerExportPDF, OwnerMonthlyStats, OwnerReviewsView, RegisterView, MeView,
    AvailabilityCreate, AvailabilityList, HallFreeSlots,
    AppointmentCreateView, AppointmentList, OwnerPendingAppointments,
    OwnerApproveAppointment, AppointmentCheckIn, AppointmentDelete,MyHallsView, ReviewCreateView, UserReviewableAppointmentsView, UserReviewsView, VerifyEmailView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    #halls
    path('halls/', HallList.as_view(), name='hall_list'),
    path('halls/create/', HallCreate.as_view(), name='hall_create'),
    path('halls/<int:pk>/', HallDetail.as_view(), name='hall_detail'),
    path("my-halls/", MyHallsView.as_view(), name="my-halls"),
    path('halls/<int:hall_id>/images/', HallImagesCreate.as_view(), name='hall_images_create'),
    path('halls/images/<int:pk>/', HallImageDelete.as_view(), name='hall_image_delete'),

    # availability
    path('availabilities/create/', AvailabilityCreate.as_view(), name='availability_create'),
    path('availabilities/', AvailabilityList.as_view(), name='availability_list'),  
    path('halls/<int:hall_id>/free/', HallFreeSlots.as_view(), name='hall_free_slots'),
    path('availabilities/<int:pk>/', AvailabilityDelete.as_view(), name='availability_delete'),

   # auth routes
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/me/', MeView.as_view(), name='me'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),  
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),

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


    #reviews
    # Dodaj ove rute u urlpatterns: 
    path('reviews/create/', ReviewCreateView.as_view(), name='review_create'),  
    path('halls/<int:hall_id>/reviews/', HallReviewsView.as_view(), name='hall_reviews'),
    path('my-reviews/', UserReviewsView.as_view(), name='user_reviews'),
    path('reviewable-appointments/', UserReviewableAppointmentsView.as_view(), name='reviewable_appointments'),
    path('owner/reviews/', OwnerReviewsView.as_view(), name='owner_reviews'),
    
]
    
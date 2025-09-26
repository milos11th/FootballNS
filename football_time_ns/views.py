from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from django.db import transaction
from datetime import timedelta, datetime

from .models import Hall, Appointment, Availability
from .serializer import (
    HallSerializer, RegisterSerializer, UserSerializer,
    AvailabilitySerializer, AppointmentSerializer, AppointmentCreateSerializer
)
from .permissions import IsOwnerRole

# Hall list - read only
class HallList(APIView):
    def get(self, request):
        halls = Hall.objects.all()
        serializer = HallSerializer(halls, many=True)
        return Response(serializer.data)

# Hall create - only owners
class HallCreate(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerRole]

    def post(self, request):
        serializer = HallSerializer(data=request.data)
        if serializer.is_valid():
            hall = serializer.save(owner=request.user)
            return Response(HallSerializer(hall).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Hall detail same as before
class HallDetail(APIView):
    def get_hall_by_pk(self, pk):
        try:
            return Hall.objects.get(pk=pk)
        except Hall.DoesNotExist:
            return None

    def get(self, request, pk):
        hall = self.get_hall_by_pk(pk)
        if not hall:
            return Response({'error':'Hall not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = HallSerializer(hall)
        return Response(serializer.data)

    def put(self, request, pk):
        hall = self.get_hall_by_pk(pk)
        if not hall:
            return Response({'error':'Hall not found'}, status=status.HTTP_404_NOT_FOUND)
        self.check_object_permissions(request, hall)
        serializer = HallSerializer(hall, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        hall = self.get_hall_by_pk(pk)
        if not hall:
            return Response({'error':'Hall not found'}, status=status.HTTP_404_NOT_FOUND)
        self.check_object_permissions(request, hall)
        hall.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_permissions(self):
        if self.request.method in ['PUT', 'DELETE']:
            return [IsAuthenticatedOrReadOnly(), IsOwnerRole()]
        return []

# Register / Me
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = []
    serializer_class = RegisterSerializer

class MeView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({'detail':'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# Availability create/list (owners create)
class AvailabilityCreate(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]
    def post(self, request):
        serializer = AvailabilitySerializer(data=request.data)
        if serializer.is_valid():
            hall = serializer.validated_data['hall']
            if hall.owner != request.user:
                return Response({'error':'Not owner of this hall'}, status=status.HTTP_403_FORBIDDEN)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AvailabilityList(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    def get(self, request, hall_id=None):
        qs = Availability.objects.all()
        if hall_id:
            qs = qs.filter(hall__id=hall_id)
        serializer = AvailabilitySerializer(qs, many=True)
        return Response(serializer.data)

# compute helpers
def intervals_overlap(a_start, a_end, b_start, b_end):
    return a_start < b_end and b_start < a_end

def compute_free_intervals(availabilities, busy_intervals):
    free = []
    for a_start, a_end in availabilities:
        parts = [(a_start, a_end)]
        for b_start, b_end in busy_intervals:
            new_parts = []
            for p_start, p_end in parts:
                if intervals_overlap(p_start,p_end,b_start,b_end):
                    if p_start < b_start:
                        new_parts.append((p_start, min(p_end, b_start)))
                    if b_end < p_end:
                        new_parts.append((max(p_start, b_end), p_end))
                else:
                    new_parts.append((p_start,p_end))
            parts = new_parts
        free.extend(parts)
    return [(s,e) for s,e in free if s < e]

# Hall free slots for a date or range
class HallFreeSlots(APIView):
    permission_classes = []  # public
    def get(self, request, hall_id):
        hall = get_object_or_404(Hall, pk=hall_id)
        date = request.query_params.get('date', None)
        start_q = request.query_params.get('start', None)
        end_q = request.query_params.get('end', None)

        if date:
            try:
                day_start = datetime.fromisoformat(date + "T00:00:00")
                day_end = datetime.fromisoformat(date + "T23:59:59")
            except:
                return Response({'error':'date must be YYYY-MM-DD'}, status=400)
        elif start_q and end_q:
            try:
                day_start = parse_datetime(start_q)
                day_end = parse_datetime(end_q)
            except:
                return Response({'error':'invalid datetimes'}, status=400)
        else:
            return Response({'error':'Provide date=YYYY-MM-DD or start & end datetimes'}, status=400)

        avails_qs = Availability.objects.filter(hall=hall, start__lt=day_end, end__gt=day_start)
        avail_list = [(a.start, a.end) for a in avails_qs]

        busy_qs = Appointment.objects.filter(hall=hall, status__in=['approved','pending'], start__lt=day_end, end__gt=day_start)
        busy_list = [(b.start, b.end) for b in busy_qs]

        free = compute_free_intervals(avail_list, busy_list)

        # optional: split into 1h slots (change step as needed)
        slots = []
        for s,e in free:
            cur = s
            while cur + timedelta(hours=1) <= e:
                slots.append({'start': cur.isoformat(), 'end': (cur + timedelta(hours=1)).isoformat()})
                cur += timedelta(hours=1)

        return Response({'free_intervals': [(s.isoformat(), e.isoformat()) for s,e in free], 'hour_slots': slots})

# Create appointment (user) -> pending
class AppointmentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = AppointmentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        hall = serializer.validated_data['hall']
        start = serializer.validated_data['start']
        end = serializer.validated_data['end']

        # 1) must be inside availability
        avail_exists = Availability.objects.filter(hall=hall, start__lte=start, end__gte=end).exists()
        if not avail_exists:
            return Response({'error':'Requested time is outside hall availability'}, status=400)

        # 2) cannot overlap with approved appointments
        overlap = Appointment.objects.filter(
            hall=hall,
            status='approved',
            start__lt=end,
            end__gt=start
        ).exists()
        if overlap:
            return Response({'error':'Requested time conflicts with an approved appointment'}, status=400)

        # create pending
        appointment = Appointment.objects.create(
            user=request.user, hall=hall, start=start, end=end, status='pending'
        )
        return Response(AppointmentSerializer(appointment).data, status=201)

# Owner: list pending appointments for their hall
class OwnerPendingAppointments(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def get(self, request, hall_id):
        hall = get_object_or_404(Hall, pk=hall_id)
        if hall.owner != request.user:
            return Response({'error':'Not your hall'}, status=403)
        pendings = Appointment.objects.filter(hall=hall, status='pending')
        serializer = AppointmentSerializer(pendings, many=True)
        return Response(serializer.data)

# Owner approve/reject
class OwnerApproveAppointment(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    @transaction.atomic
    def post(self, request, pk):
        action = request.data.get('action')
        appointment = get_object_or_404(Appointment, pk=pk)
        if appointment.hall.owner != request.user:
            return Response({'error':'Not your hall'}, status=403)

        if action == 'approve':
            # double check no overlap with other approved
            if Appointment.objects.filter(
                hall=appointment.hall, status='approved',
                start__lt=appointment.end, end__gt=appointment.start
            ).exclude(pk=appointment.pk).exists():
                return Response({'error':'Conflicts with existing approved appointment'}, status=400)
            appointment.status = 'approved'
            appointment.save()
            return Response({'message':'Approved'})
        elif action == 'reject':
            appointment.status = 'rejected'
            appointment.save()
            return Response({'message':'Rejected'})
        else:
            return Response({'error':'action must be approve or reject'}, status=400)

# Check-in (user or owner)
class AppointmentCheckIn(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)
        if appointment.user != request.user and appointment.hall.owner != request.user:
            return Response({'error':'No permission to check-in'}, status=403)
        appointment.checked_in = True
        appointment.save()
        return Response({'message':'Checked in successfully'})

# Delete appointment (user or owner)
class AppointmentDelete(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)
        if appointment.user != request.user and appointment.hall.owner != request.user:
            return Response({'error':'No permission to delete'}, status=403)
        appointment.status = 'cancelled'
        appointment.save()
        return Response({'message':'Appointment cancelled'}, status=status.HTTP_204_NO_CONTENT)

# Admin / Public listings as needed
class AppointmentList(APIView):
    permission_classes = []  # public
    def get(self, request):
        # optionally support query params ?hall=1&date=2025-10-10
        hall_q = request.query_params.get('hall', None)
        date_q = request.query_params.get('date', None)
        qs = Appointment.objects.all()
        if hall_q:
            qs = qs.filter(hall__id=hall_q)
        if date_q:
            try:
                day_start = datetime.fromisoformat(date_q + "T00:00:00")
                day_end = datetime.fromisoformat(date_q + "T23:59:59")
                qs = qs.filter(start__lt=day_end, end__gt=day_start)
            except:
                pass
        serializer = AppointmentSerializer(qs, many=True)
        return Response(serializer.data)

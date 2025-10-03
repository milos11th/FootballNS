import pytz
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly,AllowAny
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from django.db import transaction
from datetime import timedelta, datetime,time

from .models import Hall, Appointment, Availability, HallImage
from .serializer import (
    HallImageSerializer, HallSerializer, RegisterSerializer, UserSerializer,
    AvailabilitySerializer, AppointmentSerializer, AppointmentCreateSerializer
)
from .permissions import IsOwnerRole

# Hall list - read only
class HallList(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        halls = Hall.objects.all()
        serializer = HallSerializer(halls, many=True, context={'request': request})  # <-- context dodan
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

# Hall detail =
class HallDetail(APIView):
    """
    Retrieve / update / delete a Hall.
    - GET: AllowAny (svi mogu videti detalje hale)
    - PUT, DELETE: zahteva autentifikaciju i owner role
    """

    def get_hall_by_pk(self, pk):
        try:
            return Hall.objects.get(pk=pk)
        except Hall.DoesNotExist:
            return None

    def get(self, request, pk):
        hall = self.get_hall_by_pk(pk)
        if not hall:
            return Response({'error': 'Hall not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = HallSerializer(hall, context={'request': request})  # <-- context dodan
        return Response(serializer.data)

    def put(self, request, pk):
        hall = self.get_hall_by_pk(pk)
        if not hall:
            return Response({'error': 'Hall not found'}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, hall)
        serializer = HallSerializer(hall, data=request.data, context={'request': request})  # <-- context dodan
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        hall = self.get_hall_by_pk(pk)
        if not hall:
            return Response({'error': 'Hall not found'}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, hall)
        hall.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_permissions(self):
        if self.request.method in ['PUT', 'DELETE']:
            return [IsAuthenticated(), IsOwnerRole()]
        return [AllowAny()]


class MyHallsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Vrati hale koje pripadaju samo ulogovanom korisniku (owneru)
        halls = Hall.objects.filter(owner=request.user)
        serializer = HallSerializer(halls, many=True)
        return Response(serializer.data)



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
            start = serializer.validated_data['start']
            end = serializer.validated_data['end']
            
            # Provera vlasništva
            if hall.owner != request.user:
                return Response({'error':'Not owner of this hall'}, status=status.HTTP_403_FORBIDDEN)
            
           
            
            # Konvertuj u Belgrade timezone ako je potrebno
            tz = pytz.timezone("Europe/Belgrade")
            if start.tzinfo is None:
                start = tz.localize(start)
            if end.tzinfo is None:
                end = tz.localize(end)
        
            
            # Provera preklapanja
            overlapping = Availability.objects.filter(
                hall=hall,
                start__lt=end,
                end__gt=start
            ).exists()
            
            if overlapping:
                return Response(
                    {'error': 'Već postoji availability za ovu halu u izabranom vremenskom periodu.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Sačuvaj sa ispravnim vremenom
            availability = Availability.objects.create(
                hall=hall,
                start=start,
                end=end
            )
            
            return Response(AvailabilitySerializer(availability).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AvailabilityList(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get(self, request):
        qs = Availability.objects.all()
        
       
        if request.user.is_authenticated:
            # Ako je owner, prikaži samo availability-je za njegove hale
            if hasattr(request.user, 'profile') and request.user.profile.role == 'owner':
                qs = qs.filter(hall__owner=request.user)
        
        # Postojeći filter po hali
        hall_id = request.query_params.get('hall_id')
        if hall_id and hall_id != 'all':
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
    permission_classes = []

    def get(self, request, hall_id):
        hall = get_object_or_404(Hall, pk=hall_id)
        tz = pytz.timezone("Europe/Belgrade")
        date_str = request.query_params.get('date')
        
        if not date_str:
            return Response({'error':'Provide date=YYYY-MM-DD'}, status=400)

        try:
            # Parsiraj datum (bez vremena)
            naive_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            
            # Kreiraj datetime objekte za ceo dan u Belgrade timezone
            local_start = tz.localize(datetime.combine(naive_date, time(0, 0)))
            local_end = tz.localize(datetime.combine(naive_date, time(23, 59, 59)))
            
            # Konvertuj u UTC za bazu
            day_start_utc = local_start.astimezone(pytz.UTC)
            day_end_utc = local_end.astimezone(pytz.UTC)
           
            
        except Exception as e:
            print(f"Date parsing error: {e}")
            return Response({'error':'date must be YYYY-MM-DD'}, status=400)

        # sve availabilities i busy appointments za taj datum
        avails_qs = Availability.objects.filter(
            hall=hall, start__lt=day_end_utc, end__gt=day_start_utc
        )
        avail_list = [(a.start.astimezone(tz), a.end.astimezone(tz)) for a in avails_qs]

        busy_qs = Appointment.objects.filter(
            hall=hall, status__in=['approved','pending'],
            start__lt=day_end_utc, end__gt=day_start_utc
        )
        busy_list = [(b.start.astimezone(tz), b.end.astimezone(tz)) for b in busy_qs]

        free = compute_free_intervals(avail_list, busy_list)

        # slotovi po 1h
        slots = []
        for s,e in free:
            cur = s
            while cur + timedelta(hours=1) <= e:
                slots.append({
                    'start': cur.isoformat(), 
                    'end': (cur + timedelta(hours=1)).isoformat()
                })
                cur += timedelta(hours=1)


        return Response({
            'free_intervals': [(s.isoformat(), e.isoformat()) for s,e in free],
            'hour_slots': slots
        })

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
        hall_q = request.query_params.get('hall', None)
        date_q = request.query_params.get('date', None)
        tz = pytz.timezone("Europe/Belgrade")

        qs = Appointment.objects.all()
        if hall_q:
            qs = qs.filter(hall__id=hall_q)
        if date_q:
            try:
                local_start = tz.localize(datetime.strptime(date_q, "%Y-%m-%d"))
                local_end = local_start + timedelta(hours=23, minutes=59, seconds=59)
                qs = qs.filter(start__lt=local_end.astimezone(pytz.UTC), end__gt=local_start.astimezone(pytz.UTC))
            except Exception:
                pass

        serializer = AppointmentSerializer(qs, many=True)
        return Response(serializer.data)


class HallImagesCreate(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def post(self, request, hall_id):
        hall = get_object_or_404(Hall, pk=hall_id)
        if hall.owner != request.user:
            return Response({'error': 'Not owner of this hall'}, status=status.HTTP_403_FORBIDDEN)

        files = request.FILES.getlist('images') or []
        created = []
        for f in files:
            hi = HallImage.objects.create(hall=hall, image=f)
            created.append(hi)
        # Ako si poslao samo 'image' umesto 'images'
        if not files and request.FILES.get('image'):
            hi = HallImage.objects.create(hall=hall, image=request.FILES.get('image'))
            created.append(hi)

        serializer = HallImageSerializer(created, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# NEW: delete single HallImage by pk
class HallImageDelete(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def delete(self, request, pk):
        hi = get_object_or_404(HallImage, pk=pk)
        if hi.hall.owner != request.user:
            return Response({'error':'Not owner'}, status=status.HTTP_403_FORBIDDEN)
        hi.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    


class AvailabilityDelete(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def delete(self, request, pk):
        availability = get_object_or_404(Availability, pk=pk)
        if availability.hall.owner != request.user:
            return Response({'error': 'Not owner of this hall'}, status=status.HTTP_403_FORBIDDEN)
        availability.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

# Owner: all appointments for their halls (history)
class OwnerAllAppointments(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def get(self, request):
        # Vrati sve rezervacije za sve hale ovog ownera
        halls = Hall.objects.filter(owner=request.user)
        appointments = Appointment.objects.filter(hall__in=halls).order_by('-start')
        
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)
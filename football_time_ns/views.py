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
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from datetime import datetime
import io
from .models import Hall, Appointment, Availability, HallImage,Profile
from .serializer import (
    ChangePasswordSerializer, HallImageSerializer, HallSerializer, RegisterSerializer, UserSerializer,
    AvailabilitySerializer, AppointmentSerializer, AppointmentCreateSerializer
)
from .permissions import IsOwnerRole
from django.contrib.auth import update_session_auth_hash
from django.db.models import Count 
from rest_framework.decorators import api_view
from django.shortcuts import redirect
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers

from football_time_ns import serializer





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
    


class OwnerExportPDF(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def get(self, request):
        # Get reservations for owner's halls
        halls = Hall.objects.filter(owner=request.user)
        appointments = Appointment.objects.filter(
            hall__in=halls
        ).select_related('hall', 'user').order_by('-start')
        
        # Create PDF
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # Header
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 50, "Izveštaj o rezervacijama")
        p.setFont("Helvetica", 12)
        p.drawString(50, height - 70, f"Datum izveštaja: {datetime.now().strftime('%d.%m.%Y. %H:%M')}")
        p.drawString(50, height - 85, f"Vlasnik: {request.user.username}")
        p.drawString(50, height - 100, f"Ukupno hala: {halls.count()}")
        
        y_position = height - 130
        
        # Table data
        data = [['Hala', 'Korisnik', 'Datum', 'Vreme', 'Status', 'Cena']]
        
        total_price = 0
        status_counts = {'approved': 0, 'pending': 0, 'rejected': 0, 'cancelled': 0}
        
        for appointment in appointments:
            date_str = appointment.start.strftime('%d.%m.%Y.')
            time_str = f"{appointment.start.strftime('%H:%M')} - {appointment.end.strftime('%H:%M')}"
            price = appointment.hall.price
            
            data.append([
                appointment.hall.name,
                appointment.user.username,
                date_str,
                time_str,
                appointment.status,
                f"{price} RSD"
            ])
            
            if appointment.status == 'approved':
                total_price += price
            status_counts[appointment.status] += 1
        
        # Create table
        table = Table(data, colWidths=[80, 70, 60, 80, 50, 50])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8f9fa')),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#dee2e6'))
        ]))
        
        # Draw table
        table.wrapOn(p, width - 100, height)
        table.drawOn(p, 50, y_position - len(appointments) * 15 - 50)
        
        # Statistics
        y_stats = y_position - len(appointments) * 15 - 80
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y_stats, "Statistika:")
        p.setFont("Helvetica", 9)
        
        stats = [
            f"Odobrene: {status_counts['approved']}",
            f"Na čekanju: {status_counts['pending']}",
            f"Odbijene: {status_counts['rejected']}",
            f"Otkazane: {status_counts['cancelled']}",
            f"Ukupna vrednost (odobrene): {total_price} RSD"
        ]
        
        for i, stat in enumerate(stats):
            p.drawString(50, y_stats - 20 - (i * 15), stat)
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        
        # Create response with filename
        filename = f"rezervacije_{request.user.username}_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    


class OwnerMonthlyStats(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def get(self, request):
        year = request.query_params.get('year', datetime.now().year)
        
        try:
            year = int(year)
        except ValueError:
            return Response({'error': 'Invalid year'}, status=400)

        # Get owner's halls
        halls = Hall.objects.filter(owner=request.user)
        
        # Initialize monthly data
        months = [
            'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
            'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
        ]
        
        monthly_stats = []
        
        for month in range(1, 13):
            # Date range for the month
            month_start = datetime(year, month, 1)
            if month == 12:
                month_end = datetime(year + 1, 1, 1)
            else:
                month_end = datetime(year, month + 1, 1)
            
            # Convert to timezone
            tz = pytz.timezone("Europe/Belgrade")
            month_start = tz.localize(month_start)
            month_end = tz.localize(month_end)
            
            # Get appointments for this month
            appointments = Appointment.objects.filter(
                hall__in=halls,
                start__gte=month_start,
                start__lt=month_end
            )
            
            # Calculate stats
            total_reservations = appointments.count()
            approved_reservations = appointments.filter(status='approved').count()
            
            # Calculate revenue (only approved reservations)
            revenue = sum(
                float(appointment.hall.price)
                for appointment in appointments.filter(status='approved')
            )
            
            # Find most popular hall for this month
            hall_stats = appointments.values('hall__name').annotate(
                count=Count('id')
            ).order_by('-count')
            
            most_popular_hall = hall_stats[0]['hall__name'] if hall_stats else "Nema rezervacija"
            
            monthly_stats.append({
                'month': months[month - 1],
                'month_number': month,
                'total_reservations': total_reservations,
                'approved_reservations': approved_reservations,
                'revenue': revenue,
                'most_popular_hall': most_popular_hall,
                'pending_reservations': appointments.filter(status='pending').count(),
                'completion_rate': (approved_reservations / total_reservations * 100) if total_reservations > 0 else 0
            })
        
        # Yearly totals
        yearly_totals = {
            'total_reservations': sum(stat['total_reservations'] for stat in monthly_stats),
            'approved_reservations': sum(stat['approved_reservations'] for stat in monthly_stats),
            'total_revenue': sum(stat['revenue'] for stat in monthly_stats),
            'average_completion_rate': sum(stat['completion_rate'] for stat in monthly_stats) / 12
        }
        
        return Response({
            'year': year,
            'monthly_stats': monthly_stats,
            'yearly_totals': yearly_totals
        })
    

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            # Proveri staru šifru
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'old_password': ['Pogrešna trenutna šifra.']}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Postavi novu šifru
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Update session auth hash da se ne bi logout-ovao
            update_session_auth_hash(request, user)
            
            return Response({'message': 'Šifra je uspešno promenjena.'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, token):
        try:
            profile = Profile.objects.get(verification_token=token)
            
            if profile.email_verified:
                # Redirect na login sa porukom
                frontend_url = "http://localhost:3000/login?message=email_already_verified"
                return redirect(frontend_url)
            
            profile.email_verified = True
            profile.verification_token = None
            profile.save()
            
            user = profile.user
            user.is_active = True
            user.save()
            
            # Redirect na login sa porukom o uspehu
            frontend_url = "http://localhost:3000/login?message=email_verified"
            return redirect(frontend_url)
            
        except Profile.DoesNotExist:
            return HttpResponse("Nevažeći verifikacioni link.", status=400)
        

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Proveri da li je email verifikovan
        if hasattr(self.user, 'profile') and not self.user.profile.email_verified:
            raise serializers.ValidationError({
                "error": "Molimo verifikujte svoj email pre prijave. Proverite svoj inbox."
            })
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
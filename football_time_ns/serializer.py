from datetime import datetime
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Hall, Profile, Availability, Appointment, HallImage, Review
from django.utils.timezone import make_aware
import pytz
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class HallImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = HallImage
        fields = ['id', 'image']

    def get_image(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        if request is not None:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

class HallSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    images = HallImageSerializer(many=True, read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)
    location = serializers.SerializerMethodField()  
    

    
        

    class Meta:
        model = Hall
        fields = ['id', 'name', 'address', 'price', 'description', 'owner', 'image', 'images', 'location']  

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        if instance.image:
            data['image'] = request.build_absolute_uri(instance.image.url) if request else instance.image.url
        else:
            data['image'] = None
        return data

    # DODAJ OVU METODU
    def get_location(self, obj):
        if obj.location:
            return {
                'lat': obj.location.y,  
                'lng': obj.location.x   
            }
        return None




class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)

    class Meta:
        model = User
        fields = ['id','username','email','first_name','last_name','role']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ['username','password','password2','email','first_name','last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password":"Lozinke se ne poklapaju."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email":"Korisnik sa ovim email-om već postoji."})
            
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2', None)
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.is_active = False  # Korisnik neaktivan dok ne verifikuje email
        user.save()
        
        verification_token = get_random_string(50)
        
        # Proveri da li profil već postoji (kreirao ga signal)
        try:
            profile = user.profile
            # Ako postoji, ažuriraj ga
            profile.verification_token = verification_token
            profile.save()
        except Profile.DoesNotExist:
            # Ako ne postoji, kreiraj novi
            Profile.objects.create(
                user=user, 
                role='player',
                email_verified=False,
                verification_token=verification_token
            )
        
        # Pošalji verifikacioni email
        self.send_verification_email(user, verification_token)
        
        return user

    def send_verification_email(self, user, token):
        verification_url = f"http://localhost:8000/verify-email/{token}/"

       
        
        subject = "Verifikujte svoj email - Football Time"
        message = f"""
Poštovani/poštovana {user.first_name} {user.last_name},

Hvala Vam što ste se registrovali na FootballTimeNs!

Da biste aktivirali svoj nalog, molimo Vas da kliknete na link ispod:

{verification_url}

Link će vas odvesti na stranicu gde će vaš nalog biti aktiviran.

Ako niste kreirali nalog, ignorišite ovaj email.

Srdačan pozdrav,
Football Time Team
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        
class AvailabilitySerializer(serializers.ModelSerializer):
    hall_name = serializers.ReadOnlyField(source='hall.name')  
    
    class Meta:
        model = Availability
        fields = ['id', 'hall', 'hall_name', 'start', 'end']  

    def validate(self, attrs):
        tz = pytz.timezone("Europe/Belgrade")
        start = attrs['start']
        end = attrs['end']

        print(f"Received - Start: {start} (type: {type(start)})")
        print(f"Received - End: {end} (type: {type(end)})")

        
        if isinstance(start, str):
            try:
                naive_start = datetime.fromisoformat(start.replace('Z', '+00:00'))
                attrs['start'] = make_aware(naive_start, timezone=tz)
            except ValueError:
                raise serializers.ValidationError("Invalid start date format")
                
        if isinstance(end, str):
            try:
                naive_end = datetime.fromisoformat(end.replace('Z', '+00:00'))
                attrs['end'] = make_aware(naive_end, timezone=tz)
            except ValueError:
                raise serializers.ValidationError("Invalid end date format")

    
        
        if attrs['start'] >= attrs['end']:
            raise serializers.ValidationError("Start must be before end")
        return attrs
    


class AvailabilityBulkSerializer(serializers.Serializer):
    hall = serializers.PrimaryKeyRelatedField(queryset=Hall.objects.all())
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    days_of_week = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=6),
        required=False,
        default=[0,1,2,3,4,5,6]
    )
    
    def validate(self, attrs):
        start_date = attrs['start_date']
        end_date = attrs['end_date']
        start_time = attrs['start_time']
        end_time = attrs['end_time']
        
        if start_date > end_date:
            raise serializers.ValidationError("Start date must be before end date")
        
        if start_time >= end_time:
            raise serializers.ValidationError("Start time must be before end time")
        
        # Proveri da li je period predugačak (max 30 dana)
        days_diff = (end_date - start_date).days
        if days_diff > 30:
            raise serializers.ValidationError("Period ne može biti duži od 30 dana")
            
        # Proveri da li je start_date u budućnosti
        from django.utils import timezone
        if start_date < timezone.now().date():
            raise serializers.ValidationError("Ne možete kreirati dostupnost za prošle dane")
        
        return attrs
















    
    
class AppointmentSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    hall_name = serializers.ReadOnlyField(source='hall.name')

    class Meta:
        model = Appointment
        fields = ['id','user','hall','hall_name','start','end','status','checked_in']
        read_only_fields = ['status','checked_in','user','hall_name']

class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id','hall','start','end']

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=6)
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Nove šifre se ne poklapaju."})
        return attrs

    def validate_new_password(self, value):
        
        if len(value) < 6:
            raise serializers.ValidationError("Šifra mora imati najmanje 6 karaktera.")
        return value

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    user_full_name = serializers.SerializerMethodField()
    hall_name = serializers.ReadOnlyField(source='hall.name')

    class Meta:
        model = Review
        fields = ['id', 'user', 'user_full_name', 'hall', 'hall_name', 'appointment', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']
    
    def get_user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
    
    def validate(self, attrs):
        appointment = attrs.get('appointment')
        request = self.context.get('request')
        
        if not request:
            raise serializers.ValidationError("Request context is missing")
        
        # Proveri da li appointment pripada user-u
        if appointment and appointment.user != request.user:
            raise serializers.ValidationError({"appointment": "Možete oceniti samo svoje rezervacije."})
        
        # Proveri da li je rezervacija odobrena
        if appointment and appointment.status != 'approved':
            raise serializers.ValidationError({"appointment": "Možete oceniti samo odobrene rezervacije."})
        
        #  Proveri da li je user check-in-ovao (došao na termin)
        if appointment and not appointment.checked_in:
            raise serializers.ValidationError({
                "appointment": "Možete oceniti samo termine na koje ste došli (check-in)."
            })
        
        # Proveri da li već postoji review za ovu rezervaciju
        if Review.objects.filter(user=request.user, appointment=appointment).exists():
            raise serializers.ValidationError({"appointment": "Već ste ocenili ovu rezervaciju."})
        
        return attrs
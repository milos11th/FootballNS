
from datetime import datetime
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Hall, Profile, Availability, Appointment, HallImage
from django.utils.timezone import make_aware
import pytz

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
    # make image writable so we can upload/update main image via multipart
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Hall
        fields = ['id', 'name', 'address', 'price', 'description', 'owner', 'image', 'images']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        # replace image path with absolute URL (or null)
        if instance.image:
            data['image'] = request.build_absolute_uri(instance.image.url) if request else instance.image.url
        else:
            data['image'] = None
        return data


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
            raise serializers.ValidationError({"password":"Passwords must match."})
        
        # Provera da li email već postoji
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email":"User with this email already exists."})
            
        return attrs

    def create(self, validated_data):
        # Izbaci password2 iz validated_data pre nego što kreiraš usera
        password2 = validated_data.pop('password2', None)
        password = validated_data.pop('password')
        
        # Kreiraj usera sa preostalim podacima
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        
        return user

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

        # Ako su stringovi, parsiraj ih
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

        print(f"Parsed - Start: {attrs['start']}")
        print(f"Parsed - End: {attrs['end']}")
        print("===================================")
        
        if attrs['start'] >= attrs['end']:
            raise serializers.ValidationError("Start must be before end")
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
        # Možeš dodati dodatne validacije za šifru
        if len(value) < 6:
            raise serializers.ValidationError("Šifra mora imati najmanje 6 karaktera.")
        return value
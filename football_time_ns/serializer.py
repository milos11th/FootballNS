# football_time_ns/serializer.py  (ili serializers.py ako tako zoveš)
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Hall, Profile, Availability, Appointment, HallImage

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
    image = serializers.SerializerMethodField()

    class Meta:
        model = Hall
        fields = ['id', 'name', 'address', 'price', 'description', 'owner', 'image', 'images']

    def get_image(self, obj):
        # glavna pojedinačna slika (fallback), vraća absolute URL ako postoji request
        request = self.context.get('request')
        if not obj.image:
            return None
        if request is not None:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)

    class Meta:
        model = User
        fields = ['id','username','email','first_name','last_name','role']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username','password','password2','email','first_name','last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password":"Passwords must match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2', None)
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Signal kreira profile
        return user

class AvailabilitySerializer(serializers.ModelSerializer):
    hall_name = serializers.ReadOnlyField(source='hall.name')
    class Meta:
        model = Availability
        fields = ['id','hall','hall_name','start','end']

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

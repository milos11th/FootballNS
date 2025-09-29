from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Hall, Profile, Availability, Appointment

class HallSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = Hall
        fields = ['id','name','address','price','description','owner','image']


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

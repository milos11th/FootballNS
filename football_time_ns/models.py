from django.db import models
from django.contrib.auth.models import User

class Hall(models.Model):
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    description = models.TextField(default="Nema opisa")
    owner = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='halls')
    image = models.ImageField(upload_to="halls/", null=True, blank=True) 

    def __str__(self):
        return self.name
    


class HallImage(models.Model):
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to="halls/")

    def __str__(self):
        return f"{self.hall.name} Image"




class Profile(models.Model):
    ROLE_CHOICES = (
        ('player','Player'),
        ('owner','Owner'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='player')
    email_verified = models.BooleanField(default=False)  
    verification_token = models.CharField(max_length=100, blank=True, null=True)  

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class Availability(models.Model):
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name='availabilities')
    start = models.DateTimeField()
    end = models.DateTimeField()

    class Meta:
        ordering = ['hall', 'start']

    def __str__(self):
        return f"{self.hall.name}: {self.start} - {self.end}"

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending','Pending'),
        ('approved','Approved'),
        ('rejected','Rejected'),
        ('cancelled','Cancelled'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name='appointments')
    start = models.DateTimeField()
    end = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    checked_in = models.BooleanField(default=False)

    class Meta:
        ordering = ['-start']   

    def __str__(self):
        return f"{self.hall.name} | {self.user.username} | {self.start} - {self.end} ({self.status})"


class Review(models.Model):
    RATING_CHOICES = (
        (1, '1 - Very Poor'),
        (2, '2 - Poor'),
        (3, '3 - Average'),
        (4, '4 - Good'),
        (5, '5 - Excellent'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name='reviews')
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='review')
    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    owner_seen = models.BooleanField(default=False) 
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'appointment']  
    
    def __str__(self):
        return f"{self.user.username} - {self.hall.name} - {self.rating}★"
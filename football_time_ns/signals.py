from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Profile,Appointment
from django.core.mail import send_mail
from django.conf import settings

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance, role='player')

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


@receiver(post_save, sender=Appointment)
def send_reservation_status_email(sender, instance, **kwargs):
    """
    Šalje email korisniku kada se status rezervacije promeni na 'approved' ili 'rejected'
    """
    # Proveri da li je status promenjen
    if kwargs.get('created', False):
        return  # Ne šalji email za novu rezervaciju (samo pending)
    
    try:
        # Proveri da li je status promenjen na approved ili rejected
        if instance.status in ['approved', 'rejected']:
            user = instance.user
            hall = instance.hall
            
            # Prevod statusa na srpski
            status_translation = {
                'approved': 'ODOBRENA',
                'rejected': 'ODBIJENA'
            }
            status_display = status_translation.get(instance.status, instance.status)
            
            # Email subject
            if instance.status == 'approved':
                subject = f"✅ Rezervacija odobrena - {hall.name}"
            else:
                subject = f"❌ Rezervacija odbijena - {hall.name}"
            
            # Email message na srpskom
            message = f"""
Poštovani/poštovana {user.first_name} {user.last_name},

Vaša rezervacija za halu "{hall.name}" je {status_display.lower()}.

Detalji rezervacije:
• Hala: {hall.name}
• Adresa: {hall.address}
• Datum i vreme: {instance.start.strftime('%d.%m.%Y. u %H:%M')} - {instance.end.strftime('%H:%M')}
• Status: {status_display}

{"Hvala Vam što koristite naše usluge! Srećan trening! 🎯" if instance.status == 'approved' else "Nažalost, vaša rezervacija nije mogla biti odobrena. Pokušajte sa drugim terminom."}

Srdačan pozdrav,
Football Time Team
"""
            
            # Pošalji email
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            print(f"📧 Email sent to {user.email} for reservation {instance.id} - Status: {status_display}")
            
    except Exception as e:
        print(f"❌ Error sending email for appointment {instance.id}: {e}")
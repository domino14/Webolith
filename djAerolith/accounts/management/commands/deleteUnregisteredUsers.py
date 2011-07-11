from django.core.management.base import BaseCommand, CommandError
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from registration.models import RegistrationProfile

class Command(BaseCommand):
    help = """Shows and/or deletes expired users"""

    def handle(self, *args, **options):
        if len(args) != 1:
            raise CommandError('There must be exactly one argument; show or delete')
        else:
            showOrDelete = args[0]
            if showOrDelete != "show" and showOrDelete != "delete":
                raise CommandError('Your argument must be show or delete')
            
            regPfs = RegistrationProfile.objects.exclude(activation_key = RegistrationProfile.ACTIVATED)
            regPfsExpired = []
            for i in regPfs:
                if i.activation_key_expired():
                    regPfsExpired.append(i)

            print "Number of expired profiles:", len(regPfsExpired)
            print regPfsExpired
            
            if showOrDelete == "delete":    
                for i in regPfsExpired:
                    i.user.delete()
            
                print "Deleted", len(regPfsExpired), "users"
from django.db import models


# Create your models here.
class CrosswordGameFile(models.Model):
    parsedDump = models.TextField()
    id = models.CharField(max_length=64, primary_key=True)

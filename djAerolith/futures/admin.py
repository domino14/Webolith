from django.contrib import admin
from futures.models import (FutureCategory, Future, FutureHistory, Order,
                            SuccessfulTransaction, Wallet)


admin.site.register(FutureCategory)
admin.site.register(Future)
admin.site.register(FutureHistory)
admin.site.register(Order)
admin.site.register(SuccessfulTransaction)
admin.site.register(Wallet)

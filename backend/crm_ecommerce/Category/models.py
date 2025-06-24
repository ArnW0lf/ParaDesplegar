from django.db import models
from tenants.models import Tenant

class Category(models.Model):
    name = models.CharField(max_length=100)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='categories')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('name', 'tenant')
        verbose_name_plural = 'Categories'

    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


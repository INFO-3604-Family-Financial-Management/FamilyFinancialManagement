import logging

from django.shortcuts import render
from django.contrib.auth.models import User 
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .serializers import UserSerializer, ExpenseSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

# Logger instance for this module
logger = logging.getLogger(__name__)

# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (AllowAny,)

    def create(self, request, *args, **kwargs):
        logger.info(f'Received request to create user: {request.data}')
        
        # Check if email already exists
        email = request.data.get('email')
        if email and User.objects.filter(email=email).exists():
            return Response(
                {'error': 'A user with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        response = super().create(request, *args, **kwargs)
        logger.info(f'Created user: {response.data}')
        return response

class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

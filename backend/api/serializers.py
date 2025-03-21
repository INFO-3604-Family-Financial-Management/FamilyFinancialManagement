from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Expense, Family, Budget
from .models import *

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'email')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'user', 'amount', 'description', 'date']
        read_only_fields = ['user', 'date']

class FamilySerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, required=False)

    class Meta:
        model = Family
        fields = ['id', 'name', 'members']

    def create(self, validated_data):
        members_data = validated_data.pop('members', [])
        family = Family.objects.create(**validated_data)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            family.members.add(request.user)
        for member_data in members_data:
            user = User.objects.create_user(**member_data)
            family.members.add(user)
        return family

    def update(self, instance, validated_data):
        members_data = validated_data.pop('members', None)
        instance.name = validated_data.get('name', instance.name)
        instance.save()

        if members_data is not None:
            instance.members.clear()
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                instance.members.add(request.user)
            for member_data in members_data:
                user = User.objects.create_user(**member_data)
                instance.members.add(user)

        return instance
    
class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['id', 'user', 'name', 'amount', 'category', 'created_at']
        read_only_fields = ['user', 'created_at']




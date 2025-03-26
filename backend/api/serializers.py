from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Expense, Family, Budget, Goal
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

from django.core.exceptions import ValidationError

class FamilySerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, required=False)
    existing_members = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )

    class Meta:
        model = Family
        fields = ['id', 'name', 'members', 'existing_members']

    def create(self, validated_data):
        members_data = validated_data.pop('members', [])
        existing_members_data = validated_data.pop('existing_members', [])
        family = Family.objects.create(**validated_data)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            family.members.add(request.user)
        for member_data in members_data:
            user = User.objects.create_user(**member_data)
            family.members.add(user)
        for username in existing_members_data:
            try:
                user = User.objects.get(username=username)
                family.members.add(user)
            except User.DoesNotExist:
                raise ValidationError(f"User with username '{username}' does not exist.")
        return family

    def update(self, instance, validated_data):
        members_data = validated_data.pop('members', None)
        existing_members_data = validated_data.pop('existing_members', None)
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
        if existing_members_data is not None:
            for username in existing_members_data:
                try:
                    user = User.objects.get(username=username)
                    instance.members.add(user)
                except User.DoesNotExist:
                    raise ValidationError(f"User with username '{username}' does not exist.")

        return instance
    
class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['id', 'user', 'name', 'amount', 'category', 'created_at']
        read_only_fields = ['user', 'created_at']

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ['id', 'user', 'family', 'name', 'amount', 'goal_type', 'is_personal', 'created_at']
        read_only_fields = ['user', 'created_at']

class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = ['id', 'user', 'amount', 'date', 'created_at']
        read_only_fields = ['user', 'date', 'created_at']

class StreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = Streak
        fields = ['id', 'user', 'count', 'last_updated']
        read_only_fields = ['user', 'last_updated']

class ContributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contribution
        fields = ['id', 'user', 'goal', 'amount', 'date', 'created_at']
        read_only_fields = ['user', 'date', 'created_at']
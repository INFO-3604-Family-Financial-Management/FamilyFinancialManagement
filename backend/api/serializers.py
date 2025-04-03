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
        fields = ['id', 'user', 'amount', 'description', 'date', 'goal', 'budget']
        read_only_fields = ['user', 'date']
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

from django.core.exceptions import ValidationError

class FamilyMemberSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

    def get_role(self, obj):
        # Get the role of the user in the family
        family = self.context.get('family')
        if family:
            family_member = family.members.through.objects.filter(user=obj, family=family).first()
            return family_member.role if family_member else None
        return None


class FamilySerializer(serializers.ModelSerializer):
    members = FamilyMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Family
        fields = ['id', 'name', 'members']

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['id', 'user', 'name', 'amount', 'category', 'created_at']
        read_only_fields = ['user', 'created_at']

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ['id', 'user', 'family', 'name', 'amount', 'goal_type', 'is_personal', 'pinned', 'created_at']
        read_only_fields = ['user', 'created_at']

    def validate_target_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Target amount must be greater than zero.")
        return value

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
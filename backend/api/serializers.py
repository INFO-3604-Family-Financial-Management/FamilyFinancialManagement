from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Expense, Family, UserProfile, Budget, Goal, Contribution, Streak

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

class FamilySerializer(serializers.ModelSerializer):
    class Meta:
        model = Family
        fields = ['id', 'name']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'family', 'income']
        read_only_fields = ['user']

class UserWithProfileSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'profile')

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['id', 'name', 'amount', 'category', 'user', 'created_at']
        read_only_fields = ['user', 'created_at']

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ['id', 'name', 'amount', 'goal_type', 'is_personal', 'user', 'family', 'created_at', 'pinned']
        read_only_fields = ['user', 'created_at']

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'user', 'amount', 'description', 'date', 'budget', 'goal', 'created_at']
        read_only_fields = ['user', 'date', 'created_at']

class ContributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contribution
        fields = ['id', 'amount', 'date', 'user', 'goal', 'created_at']
        read_only_fields = ['user', 'date', 'created_at']

class StreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = Streak
        fields = ['id', 'count', 'user', 'last_updated']
        read_only_fields = ['user', 'last_updated']
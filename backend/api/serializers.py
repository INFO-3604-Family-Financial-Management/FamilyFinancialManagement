from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Expense, Family, Budget, Goal, Streak, Contribution, UserProfile

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'email')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        # Create a default UserProfile
        UserProfile.objects.create(user=user)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['user', 'username', 'email', 'family', 'monthly_income', 'created_at', 'last_updated']
        read_only_fields = ['user', 'created_at', 'last_updated']

class FamilySerializer(serializers.ModelSerializer):
    members_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Family
        fields = ['id', 'name', 'members', 'members_count']
    
    def get_members_count(self, obj):
        return obj.members.count()

class BudgetSerializer(serializers.ModelSerializer):
    used_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    usage_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = ['id', 'name', 'amount', 'category', 'user', 'created_at', 
                 'used_amount', 'remaining_amount', 'usage_percentage']
        read_only_fields = ['user', 'created_at']
    
    def get_used_amount(self, obj):
        return obj.get_used_amount()
    
    def get_remaining_amount(self, obj):
        return obj.get_remaining_amount()
    
    def get_usage_percentage(self, obj):
        return obj.get_usage_percentage()

class GoalSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = Goal
        fields = ['id', 'name', 'amount', 'goal_type', 'is_personal', 'user', 'family', 
                 'created_at', 'pinned', 'progress', 'progress_percentage', 'remaining_amount']
        read_only_fields = ['user', 'created_at']
    
    def get_progress(self, obj):
        return obj.get_progress()
    
    def get_progress_percentage(self, obj):
        return obj.get_progress_percentage()
    
    def get_remaining_amount(self, obj):
        return obj.get_remaining_amount()

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
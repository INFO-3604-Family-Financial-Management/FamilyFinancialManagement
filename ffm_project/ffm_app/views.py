from django.shortcuts import render

# Create your views here.
from django.shortcuts import render, redirect

def home(request):
    return redirect('/admin')  # Redirect to admin for now
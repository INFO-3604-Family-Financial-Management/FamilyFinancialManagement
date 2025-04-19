from rest_framework.test import APITestCase
from django.urls import reverse, resolve
from django.contrib.auth.models import User
from api.views import ExpenseListCreateView

from rest_framework_simplejwt.tokens import RefreshToken

class ExpenseUrlsTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_expense_list_url_resolves(self):
        """Test expense list URL resolves to correct view"""
        url = reverse('expense-list-create')
        self.assertEqual(resolve(url).func.view_class, ExpenseListCreateView)

    def test_expense_list_url_allows_get(self):
        """Test expense list URL allows GET requests"""
        url = reverse('expense-list-create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)  # Or whatever the expected status code is

    def test_expense_list_url_allows_post(self):
        """Test expense list URL allows POST requests"""
        url = reverse('expense-list-create')
        data = {
            "amount": 100.0,
            "description": "Test expense"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 201)  # Or whatever the expected status code is

    def test_expense_list_url_disallows_put(self):
        """Test expense list URL disallows PUT requests"""
        url = reverse('expense-list-create')
        response = self.client.put(url)
        self.assertEqual(response.status_code, 405)  # Method Not Allowed

    def test_expense_list_url_disallows_delete(self):
        """Test expense list URL disallows DELETE requests"""
        url = reverse('expense-list-create')
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 405)  # Method Not Allowed

import random
import logging
import json
from datetime import datetime, timedelta
from locust import HttpUser, task, between, TaskSet

class BaseUser(HttpUser):
    abstract = True
    host = "http://localhost:8000" 
    #host = "https://familyfinancialmanagement.onrender.com"
    
    def on_start(self):
        """Authenticate user at the beginning of the test"""
        try:
            # Try with form data instead of JSON
            response = self.client.post("/api/token/", data={
                "username": "testuser",
                "password": "testpassword"
            })
            if response.status_code == 200:
                self.token = response.json()["access"]
                self.client.headers = {'Authorization': f'Bearer {self.token}'}
                logging.info("User authenticated successfully")
            else:
                logging.error(f"Authentication failed: {response.status_code} - {response.text}")
        except Exception as e:
            logging.error(f"Error during authentication: {e}")
    
    def on_stop(self):
        """Clean up after tests"""
        pass

class RegularUser(BaseUser):
    """Simulates a regular user with balanced view/create operations"""
    wait_time = between(2, 5)
    weight = 3
    
    @task(5)
    def view_expenses(self):
        with self.client.get("/api/expenses/", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get expenses: {response.status_code}")
    
    @task(3)
    def view_budgets(self):
        with self.client.get("/api/budgets/", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get budgets: {response.status_code}")
            else:
                # Store budgets for other tasks to use
                self.available_budgets = response.json()
    
    @task(2)
    def view_goals(self):
        with self.client.get("/api/goals/", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get goals: {response.status_code}")
    
    @task(1)
    def create_expense(self):
        # More realistic random expenses
        categories = ["Groceries", "Transportation", "Entertainment", "Dining", "Utilities"]
        amount = round(random.uniform(5.00, 200.00), 2)
        
        # Try to use an available budget if we have loaded them
        budget_id = 1  # Default fallback
        if hasattr(self, 'available_budgets') and self.available_budgets:
            budget = random.choice(self.available_budgets)
            budget_id = budget['id']
        
        payload = {
            "description": f"{random.choice(categories)} expense",
            "amount": str(amount),
            "budget": budget_id
        }
        
        with self.client.post("/api/expenses/", json=payload, catch_response=True) as response:
            if response.status_code != 201:
                response.failure(f"Failed to create expense: {response.status_code}, {response.text}")

    @task(1)
    def realistic_user_flow(self):
        # First check budgets
        budgets_response = self.client.get("/api/budgets/")
        if budgets_response.status_code == 200 and len(budgets_response.json()) > 0:
            # Then check expenses
            self.client.get("/api/expenses/")
            
            # Then create a new expense for a budget
            budget_id = budgets_response.json()[0]['id']
            expense_data = {
                "description": "Monthly grocery shopping",
                "amount": f"{random.randint(50, 150)}.00",
                "budget": budget_id
            }
            self.client.post("/api/expenses/", json=expense_data)
            
            # Finally check goals
            self.client.get("/api/goals/")

class PowerUser(BaseUser):
    """Simulates a power user with more write operations"""
    wait_time = between(1, 3)
    weight = 1
    
    @task(3)
    def view_and_create_workflow(self):
        # Check budgets
        budgets_response = self.client.get("/api/budgets/")
        
        # Create new budget if needed - CORRECTED VERSION
        if random.random() < 0.3:
            # Generate a more complete budget payload
            categories = ["Housing", "Food", "Transportation", "Entertainment", "Utilities", "Health"]
            category = random.choice(categories)
            budget_data = {
                "name": f"{category} Budget {random.randint(1000, 9999)}",
                "amount": f"{random.randint(500, 3000)}.00",
                "category": category
                # Removed description field which is not in the model
            }
            
            with self.client.post("/api/budgets/", json=budget_data, catch_response=True) as response:
                if response.status_code == 201:
                    logging.info(f"Successfully created budget: {budget_data['name']}")
                else:
                    response.failure(f"Failed to create budget: {response.status_code} - {response.text}")
        
        # Create expenses for existing budgets - WITH IMPROVED ERROR HANDLING
        if budgets_response.status_code == 200 and budgets_response.json():
            budget = random.choice(budgets_response.json())
            
            # Create 1-3 expenses for this budget
            for _ in range(random.randint(1, 3)):
                expense_data = {
                    "description": f"Expense {random.randint(1000, 9999)}",
                    "amount": f"{random.randint(10, 500)}.00",
                    "budget": budget['id']
                }
                with self.client.post("/api/expenses/", json=expense_data, catch_response=True) as response:
                    if response.status_code != 201:
                        response.failure(f"Failed to create expense: {response.status_code} - {response.text}")
    
    @task(2)
    def check_all_data(self):
        """Power users often check all their data"""
        self.client.get("/api/expenses/")
        self.client.get("/api/budgets/")
        self.client.get("/api/goals/")
    
    @task(1)
    def manage_goals(self):
        # Get current goals
        goals_response = self.client.get("/api/goals/")
        
        # CORRECTED: Create a new goal with proper fields
        if random.random() < 0.4:  # 40% chance
            # Generate a future date between 1 month and 2 years from now
            future_days = random.randint(30, 730)
            future_date = (datetime.now() + timedelta(days=future_days)).strftime("%Y-%m-%d")
            
            # Create goal data with correct fields
            goal_types = ["saving", "spending"]  # Match actual goal_type values in backend
            target_amount = random.randint(1000, 10000)
            current_amount = random.randint(0, int(target_amount * 0.5))
            
            goal_data = {
                "name": f"Financial Goal {random.randint(1000, 9999)}",
                "target_amount": f"{target_amount}.00",
                "amount": f"{current_amount}.00",  # This should be "amount" not "current_amount"
                "goal_type": random.choice(goal_types),
                "is_personal": True,
                "deadline": future_date
            }
            
            with self.client.post("/api/goals/", json=goal_data, catch_response=True) as response:
                if response.status_code == 201:
                    logging.info(f"Successfully created goal: {goal_data['name']}")
                else:
                    response.failure(f"Failed to create goal: {response.status_code} - {response.text}")
                    logging.error(f"Goal creation failed with: {response.text}")
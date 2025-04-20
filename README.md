[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/INFO-3604-Family-Financial-Management/FamilyFinancialManagement)

# Family Financial Management System

A comprehensive financial management system for families to track expenses, set budgets, and manage financial goals together.

## 📋 Project Overview

The Family Financial Management system consists of two main components:

- **Backend**: Django REST API providing authentication, data storage, and business logic
- **Frontend**: React Native mobile application built with Expo

## 🚀 Getting Started

### Prerequisites

- [Python](https://www.python.org/) 3.8 or higher
- [Node.js](https://nodejs.org/) 16 or higher
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

## 🔧 Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd FamilyFinancialManagement/backend
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables (create a `.env` file):

   ```
   SECRET_KEY=your-secret-key
   DEBUG=True
   DATABASE_URL=optional-postgres-connection-string
   ```

5. Run migrations:

   ```bash
   python manage.py migrate
   ```

6. Create a superuser:

   ```bash
   python manage.py createsuperuser
   ```

7. Start the development server:

   ```bash
   python manage.py runserver
   ```

The backend will be available at http://localhost:8000

## 📱 Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd FamilyFinancialManagement/info3604ffm
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Update the backend URL:

   If you're running the backend locally, update the `BACKEND_URL` in `/constants/config.js`:

   ```javascript
   export const BACKEND_URL = 'http://localhost:8000';
   ```

4. Start the Expo development server:

   ```bash
   npx expo start
   ```

5. Run the app:
   - Press `a` to run on Android emulator
   - Press `i` to run on iOS simulator
   - Scan the QR code with the Expo Go app on your phone

## 🧪 Running Tests

### Backend Tests

```bash
cd backend
python manage.py test
```

### Frontend Tests

```bash
cd info3604ffm
npm test
```

## 🌟 Features

- User authentication and registration
- Family group creation and management
- Personal and family budget creation and tracking
- Financial goal setting and progress tracking
- Expense tracking and categorization
- Financial reporting and insights

## 📦 Deployment

### Backend Deployment

The backend is configured to be deployable on platforms like Render or similar services:

1. Set environment variables on your hosting platform
2. Set `DEBUG=False` for production
3. Configure a PostgreSQL database if needed

### Frontend Deployment

The Expo application can be built for production using:

```bash
cd info3604ffm
es build --platform android  # For Android
```

---


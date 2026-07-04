# SAM Collection - Full Stack MERN E-Commerce

A full-featured e-commerce platform built with MongoDB, Express, React, Node.js.

## ⚙️ Setup Instructions

### 1. Clone & Install

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure MongoDB ⚠️ REQUIRED

Copy `.env.example` to `.env` in the backend folder:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set your MongoDB connection:

**Option A: MongoDB Atlas (Cloud - Recommended)**
1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Get your connection string
4. Set: `MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/sam-collection`

**Option B: Local MongoDB**
1. Install MongoDB locally
2. Set: `MONGO_URI=mongodb://localhost:27017/sam-collection`

### 3. Set Other Environment Variables

```env
JWT_SECRET=any_long_random_string_here
PORT=5000
CLIENT_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_... (from stripe.com)
```

### 4. Run the Application

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

App runs at: http://localhost:3000
API runs at: http://localhost:5000

## 📁 Project Structure

```
sam-collection/
├── backend/
│   ├── config/db.js          ← MongoDB connection (add your URI here)
│   ├── models/               ← Mongoose schemas
│   ├── controllers/          ← Business logic
│   ├── routes/               ← API endpoints
│   ├── middleware/auth.js    ← JWT protection
│   └── server.js             ← Entry point
└── frontend/
    └── src/
        ├── pages/            ← React pages
        ├── components/       ← Reusable UI
        ├── context/          ← Auth & Cart state
        └── services/api.js   ← Axios API calls
```

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/products | Get all products |
| GET | /api/products/:id | Get single product |
| POST | /api/orders | Create order |
| GET | /api/orders/myorders | My orders |
| GET | /api/admin/dashboard | Admin stats |

## 👤 User Roles

- **Customer**: Browse, cart, checkout, orders, wishlist, reviews
- **Seller**: Add/manage products, view orders for their items
- **Admin**: Full control - users, products approval, all orders

## 💳 Payment Setup

For Stripe: Add keys to `.env` and install:
```bash
cd frontend && npm install @stripe/react-stripe-js @stripe/stripe-js
```

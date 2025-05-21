# WooCommerce Integration Platform

A full-stack application that integrates with WooCommerce, allowing users to manage their product inventory, synchronize with WooCommerce stores, and handle e-commerce operations smoothly.

## 🚀 Features

- **User Authentication**: Secure signup, signin, and token-based authentication
- **Product Management**: Create, read, update, and delete products
- **WooCommerce Integration**: Sync products between the platform and WooCommerce
- **Responsive UI**: Clean, modern UI that works across devices
- **Dark Mode Support**: Toggle between light and dark themes

## 📂 Project Structure

The project is divided into two main parts:

### Backend (`/backend`)

Node.js API server with Express and MongoDB:

- **Authentication**: User signup, signin, verification
- **Product API**: RESTful endpoints for product operations
- **WooCommerce API**: Integration with WooCommerce REST API
- **MongoDB Integration**: Data persistence for user and product information

### Frontend (`/frontend`)

Modern Next.js application:

- **Authentication Pages**: Sign in/up with form validation
- **Dashboard Layout**: Responsive sidebar navigation
- **Product Pages**: UI for product management and synchronization
- **State Management**: Zustand for global state with persistence
- **API Integration**: React Query for data fetching and mutations

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **API Integration**: WooCommerce REST API

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Components**: Custom components with Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Form Handling**: React Hook Form with Zod validation
- **Notifications**: Sonner toast notifications

## 🔧 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- MongoDB instance
- WooCommerce store with API access

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd woocommerce
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Setup environment variables:
```
# Backend (.env)
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# Start frontend development server
cd ../frontend
npm run dev
```

## 🌐 API Routes

### Authentication
- `POST /auth/signup`: Create a new user account
- `POST /auth/login`: Authenticate and receive JWT token
- `GET /auth/me`: Get current user information
- `POST /auth/logout`: Invalidate token

### Products
- `GET /product`: Get all products for current user
- `GET /product/:id`: Get single product
- `POST /product`: Create new product
- `PUT /product/:id`: Update product
- `DELETE /product/:id`: Remove product
- `POST /product/:id/sync`: Sync product with WooCommerce
- `POST /product/check`: Check if product exists in WooCommerce
- `POST /product/import`: Import product from WooCommerce

### WooCommerce Integration
- `GET /integration`: Get user integrations
- `POST /integration`: Create new integration
- `PUT /integration/:id`: Update integration
- `DELETE /integration/:id`: Remove integration

## 📱 Screenshots

*Include screenshots of key pages/features*

## 🚧 Roadmap

- [ ] Bulk product management
- [ ] Order synchronization
- [ ] Customer data integration
- [ ] Analytics dashboard
- [ ] Multi-store support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

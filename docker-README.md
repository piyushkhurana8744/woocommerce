# WooCommerce Integration Project

This repository contains a WooCommerce integration application with a Next.js frontend and Express.js backend.

## Docker Setup

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Building and Running with Docker

1. Clone this repository:
   ```
   git clone <repository-url>
   cd woocommerce
   ```

2. Build and start all containers:
   ```
   docker-compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

4. Stop the containers:
   ```
   docker-compose down
   ```

### Individual Container Management

- Build and start only the backend:
  ```
  docker-compose up -d backend
  ```

- Build and start only the frontend:
  ```
  docker-compose up -d frontend
  ```

- View container logs:
  ```
  docker-compose logs -f [service_name]
  ```

- Restart a specific service:
  ```
  docker-compose restart [service_name]
  ```

## Development Without Docker

### Backend
```
cd backend
npm install
npm run dev
```

### Frontend
```
cd frontend
npm install
npm run dev
```

## Environment Variables

Create `.env` files in both frontend and backend directories with appropriate values.

### Backend `.env` Example
```
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb://localhost:27017/woocommerce
JWT_SECRET=your_jwt_secret
```

### Frontend `.env.local` Example
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

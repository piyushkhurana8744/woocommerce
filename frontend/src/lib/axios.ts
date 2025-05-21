// lib/axios.ts
import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This ensures cookies are sent with every request
});

// Add an interceptor to handle auth errors
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle authentication errors (e.g., redirect to login if 401)
    if (error.response && error.response.status === 401) {
      // You could redirect to login or handle token refresh here
      console.log('Authentication error');
      // window.location.href = '/login'; // Uncomment to redirect
    }
    return Promise.reject(error);
  }
);

export default instance;

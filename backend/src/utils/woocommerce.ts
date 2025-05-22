import axios from 'axios';
import { createHmac } from 'crypto';
import querystring from 'querystring';

// Interface for WooCommerce credentials
interface WooCommerceCredentials {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

// Function to create oAuth signature for WooCommerce REST API
const getOAuthSignature = (
  method: string, 
  endpoint: string, 
  credentials: WooCommerceCredentials, 
  params: Record<string, any> = {}
) => {
  const { url, consumerKey, consumerSecret } = credentials;
  
  // Ensure we have valid credentials
  if (!url || !consumerKey || !consumerSecret) {
    throw new Error('Invalid WooCommerce credentials - url, consumerKey, and consumerSecret are required');
  }
  
  // Clean the URL to ensure it doesn't end with a trailing slash
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = Math.random().toString(36).substring(2);
  
  // OAuth parameters
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp.toString(),
    oauth_nonce: nonce,
    oauth_version: '1.0',
  };

  // Combine with other query parameters
  const allParams = { ...oauthParams, ...params };
  
  // Create the signature base string
  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(`${cleanUrl}${endpoint}`),
    encodeURIComponent(querystring.stringify(allParams))
  ].join('&');
  
  // Create the signature
  const signature = createHmac('sha1', `${consumerSecret}&`)
    .update(baseString)
    .digest('base64');

  return {
    ...oauthParams,
    oauth_signature: signature
  };
};

// Alternative authentication method using basic auth
const getBasicAuthConfig = (credentials: WooCommerceCredentials) => {
  const { consumerKey, consumerSecret } = credentials;
  
  return {
    auth: {
      username: consumerKey,
      password: consumerSecret
    }
  };
};

// Create a WooCommerce API client factory
export const createWcApiClient = (credentials: WooCommerceCredentials) => {
  const { url } = credentials;
  
  // Clean the URL to ensure it doesn't end with a trailing slash
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
  // Log credentials (without showing the full secret)
  
  // Set up axios instance with default config
  const apiClient = axios.create({
    baseURL: cleanUrl,
    timeout: 10000, // 10 seconds timeout
  });
  
  // Add request interceptor for debugging
  apiClient.interceptors.request.use(request => {
    console.log('API Request:', request.method?.toUpperCase(), request.url);
    return request;
  });
  
  // Add response interceptor for debugging
  apiClient.interceptors.response.use(
    response => response,
    error => {
      console.error('API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      return Promise.reject(error);
    }
  );
  
  // Create a simpler utility for direct URL queries that avoids signature issues
  const makeQueryStringUrl = (endpoint: string, method: string = 'GET') => {
    const { consumerKey, consumerSecret } = credentials;
    // For simple requests, using query parameters for authentication is more reliable
    const authQuery = `consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`;
    const fullEndpoint = `${cleanUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}${authQuery}`;
    return fullEndpoint;
  };
  
  return {
    // Get products from WooCommerce with optional search parameters
    async getProducts(searchParams: Record<string, any> = {}) {
      try {
        // Try the query parameter approach first (more reliable)
        const queryString = Object.entries(searchParams)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&');
          
        const endpoint = `/wp-json/wc/v3/products${queryString ? `?${queryString}` : ''}`;
        const url = makeQueryStringUrl(endpoint);
        
       
        
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        console.error('Error fetching WooCommerce products, trying fallback method:', error);
        
        // Fallback to basic auth if query string approach fails
        try {
          const config = getBasicAuthConfig(credentials);
          const response = await apiClient.get('/wp-json/wc/v3/products', { 
            ...config,
            params: searchParams
          });
          return response.data;
        } catch (fallbackError) {
          console.error('All authentication methods failed:', fallbackError);
          throw fallbackError;
        }
      }
    },
    
    // Get a specific product by ID
    async getProductById(productId: number) {
      try {
        // Use direct query string authentication (most reliable)
        const endpoint = `/wp-json/wc/v3/products/${productId}`;
        const url = makeQueryStringUrl(endpoint);
        
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        // If it fails, fall back to basic auth
        console.error(`Error getting product ${productId}, trying fallback method:`, error);
        
        try {
          const config = getBasicAuthConfig(credentials);
          const response = await apiClient.get(`/wp-json/wc/v3/products/${productId}`, config);
          return response.data;
        } catch (fallbackError) {
          console.error('All authentication methods failed:', fallbackError);
          throw fallbackError;
        }
      }
    },
    
    // Create a product in WooCommerce
    async createProduct(productData: any) {
      try {
        // Use direct query string authentication for POST
        const endpoint = `/wp-json/wc/v3/products`;
        const url = makeQueryStringUrl(endpoint, 'POST');
        
        const response = await axios.post(url, productData);
        return response.data;
      } catch (error) {
        console.error('Error creating product, trying fallback method:', error);
        
        try {
          const config = getBasicAuthConfig(credentials);
          const response = await apiClient.post('/wp-json/wc/v3/products', productData, config);
          return response.data;
        } catch (fallbackError) {
          console.error('All authentication methods failed:', fallbackError);
          throw fallbackError;
        }
      }
    },
    
    // Update a product in WooCommerce
    async updateProduct(wcProductId: number, productData: any) {
      try {
        // Use direct query string authentication for PUT
        const endpoint = `/wp-json/wc/v3/products/${wcProductId}`;
        const url = makeQueryStringUrl(endpoint, 'PUT');
        
        const response = await axios.put(url, productData);
        return response.data;
      } catch (error) {
        console.error(`Error updating product ${wcProductId}, trying fallback method:`, error);
        
        try {
          const config = getBasicAuthConfig(credentials);
          const response = await apiClient.put(`/wp-json/wc/v3/products/${wcProductId}`, productData, config);
          return response.data;
        } catch (fallbackError) {
          console.error('All authentication methods failed:', fallbackError);
          throw fallbackError;
        }
      }
    },
    
    // Delete a product in WooCommerce
    async deleteProduct(wcProductId: number) {
      try {
        const params = getOAuthSignature('DELETE', `/wp-json/wc/v3/products/${wcProductId}`, credentials);
        const response = await axios.delete(`${url}/wp-json/wc/v3/products/${wcProductId}`, { params });
        return response.data;
      } catch (error) {
        console.error(`Error deleting WooCommerce product ${wcProductId}:`, error);
        throw error;
      }
    },
    
    // Test connection to WooCommerce
    async testConnection() {
      try {
        // Try the most reliable method first - query string authentication
        const url = makeQueryStringUrl('/wp-json/wc/v3/system_status');
        
        try {
          const response = await axios.get(url);
          return { 
            success: true, 
            message: 'Successfully connected to WooCommerce API using query parameters',
            method: 'query_string'
          };
        } catch (queryError: any) {
          console.log('Query string auth failed, trying basic auth:', queryError.message);
          
          // Try basic auth
          const config = getBasicAuthConfig(credentials);
          const response = await apiClient.get('/wp-json/wc/v3/system_status', config);
          return { 
            success: true, 
            message: 'Successfully connected to WooCommerce API using basic auth',
            method: 'basic_auth'
          };
        }
      } catch (error: any) {
        return { 
          success: false, 
          message: error.message,
          error
        };
      }
    }
  };
};

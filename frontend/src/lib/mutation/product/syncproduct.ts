import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../../lib/axios';
import { toast } from 'sonner';

// Define types for the API response
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  status: 'CREATED_LOCALLY' | 'SYNCED_TO_WC' | 'SYNC_FAILED';
  wcProductId?: number;
  userId: string;
}

interface SyncProductResponse {
  message: string;
  product: Product;
}

interface WooCommerceProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  regular_price: string;
  images: Array<{ src: string }>;
  sku: string;
  categories: Array<{ id: number; name: string }>;
}

interface CheckWooCommerceResponse {
  exists: boolean;
  products: WooCommerceProduct[];
  message: string;
}

interface ImportProductResponse {
  message: string;
  product: Product;
}

/**
 * React Query mutation hook for syncing a product with WooCommerce
 */
export function useSyncProduct() {
  const queryClient = useQueryClient();
  
  return useMutation<SyncProductResponse, Error, string>({
    mutationFn: async (productId: string) => {
      const response = await axios.post<SyncProductResponse>(
        `/product/${productId}/sync`
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update the products cache after successful sync
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Optionally update the single product in cache
      queryClient.setQueryData(['product', data.product._id], data.product);

      toast.success('Product synced successfully!', {
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to sync product', {
        description: error?.response?.data?.message || error.message, 
      });
    }
  });
}

/**
 * React Query mutation hook for checking if a product exists in WooCommerce
 */
export function useCheckWooCommerceProduct() {
  return useMutation<
    CheckWooCommerceResponse, 
    Error, 
    { name?: string; sku?: string }
  >({
    mutationFn: async (searchParams) => {
      const response = await axios.post<CheckWooCommerceResponse>(
        '/product/check',
        searchParams
      );
      return response.data;
    },
    onSuccess: (data) => {
        toast.success('WooCommerce product check successful!', {
          description: data.message,
        });
    },
    onError: (error: any) => {
      toast.error('Failed to check WooCommerce product', {
        description: error?.response?.data?.message || error.message, 
      });
    }
  });
}

/**
 * React Query mutation hook for importing a product from WooCommerce
 */
export function useImportFromWooCommerce() {
  const queryClient = useQueryClient();
  
  return useMutation<ImportProductResponse, Error, number>({
    mutationFn: async (wcProductId: number) => {
      const response = await axios.post<ImportProductResponse>(
        '/product/import',
        { wcProductId }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product imported successfully!', {
        description: data.message,
      });
    },
    onError: (error: any) => { // Changed Error to any to allow accessing response property
      console.log('Error importing product:', error);
      toast.error('Failed to import product', {
        description: error?.response?.data?.message || error.message,    
      });
    }
  });
}

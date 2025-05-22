import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../axios';
import { toast } from 'sonner';

// Create a proper interface for product data
interface ProductData {
  _id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  [key: string]: unknown; // For additional properties
}

// Create a custom error type
interface ApiError {
  message?: string;
  response?: {
    data?: {
      message?: string;
    }
  }
}

// Update product mutation hook
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productData: ProductData) => {
      const { _id, ...data } = productData;
      const response = await axios.put(`/product/${_id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast.success('Product updated successfully!', {
        description: data.message,
      });
    },
    onError: (error: ApiError) => {
      toast.error('Failed to update product', {
        description: error?.response?.data?.message || error.message,
      });
    }
  });
}

// Delete product mutation hook
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await axios.delete(`/product/${productId}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast.success('Product deleted successfully!', {
        description: data.message,
      });
    },
    onError: (error: ApiError) => {
      toast.error('Failed to delete product', {
        description: error?.response?.data?.message || error.message,
      });
    }
  });
}

// Export both hooks as named exports but fix the default export
export default useUpdateProduct;

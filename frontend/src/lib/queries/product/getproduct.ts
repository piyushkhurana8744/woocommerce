import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import instance from "@/lib/axios";

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category?: string;
  stock?: number;
  status?: 'CREATED_LOCALLY' | 'SYNCED_TO_WC' | 'SYNC_FAILED';
  wcProductId?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook for fetching all products
 */
export function useGetProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const response = await instance.get<Product[]>('/product');
        return response.data;
      } catch (error) {
        toast.error("Failed to fetch products", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching a single product by ID
 */
export function useGetProduct(productId: string) {
  return useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await instance.get<Product>(`/product/${productId}`);
      return response.data;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
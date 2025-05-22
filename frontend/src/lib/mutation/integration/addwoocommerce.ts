import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import instance from "@/lib/axios";

// Create interfaces for your data types
interface WooCommerceData {
  storeUrl: string;
  key: string;
  secret: string;
}

interface WooCommerceResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

// Add an ApiError interface and use it
interface ApiError {
  message?: string;
  response?: {
    data?: {
      message?: string;
    }
  }
}

const useAddWooCommerce = () => {
  return useMutation<WooCommerceResponse, Error, WooCommerceData>({
    mutationFn: async (data: WooCommerceData) => {
      try {
        const response = await instance.post<WooCommerceResponse>(
          "/integration/connect-woocommerce",
          data
        );
        return response.data;
      } catch (error) {
        // Handle errors within mutationFn
        const message = error instanceof Error ? error.message : "Failed to connect";
        throw new Error(message);
      }
    },
    onSuccess: (data) => {
      toast.success("WooCommerce connected!", {
        description: data.message,
      });
    },
    onError: (error: ApiError) => {
      toast.error('Failed to add WooCommerce integration', {
        description: error?.response?.data?.message || error.message || "An error occurred",
      });
    },
  });
};

export default useAddWooCommerce;
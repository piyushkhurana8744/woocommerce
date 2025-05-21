import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import instance from "@/lib/axios";

type AddProductData = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

type ProductResponse = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
};

// Add product mutation hook
const useAddProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<ProductResponse, Error, AddProductData>({
    mutationFn: async (data: AddProductData) => {
      // Get sync preference from DOM if checkbox exists
      const syncElement = document.getElementById(
        "syncToWooCommerce"
      ) as HTMLInputElement;
      const syncToWooCommerce = syncElement ? syncElement.checked : true;

      const response = await instance.post<ProductResponse>("/product", {
        ...data,
        syncToWooCommerce,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product added successfully!", {
        description: data.name,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to add product", {
        description: error.message,
      });
    },
  });
};

export default useAddProduct;
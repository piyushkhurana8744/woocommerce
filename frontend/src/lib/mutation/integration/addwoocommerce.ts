import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import instance from "@/lib/axios";

type AddWooCommerceData = {
  consumerKey: string;
  consumerSecret: string;
  storeUrl: string;
};

type AddWooCommerceResponse = {
  message: string;
  data?: any;
  integration?: any;
  error?: any;
};

const useAddWooCommerce = () => {
  return useMutation<AddWooCommerceResponse, Error, AddWooCommerceData>({
    mutationFn: async (data: AddWooCommerceData) => {
      try {
        const response = await instance.post<AddWooCommerceResponse>(
          "/integration/connect-woocommerce",
          data
        );
        return response.data;
      } catch (error: any) {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Failed to connect WooCommerce";
        throw new Error(message);
      }
    },
    onSuccess: (data) => {
      toast.success("WooCommerce connected!", {
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast.error("Connection failed", {
        description: error.message,
      });
    },
  });
};

export default useAddWooCommerce;
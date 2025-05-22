import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import instance from "@/lib/axios";

// Define interface for disconnect integration payload
interface DisconnectIntegrationPayload {
  integrationId: string;
}

interface DisconnectResponse {
  success: boolean;
  message: string;
}

// API error interface
interface ApiError {
  message?: string;
  response?: {
    data?: {
      message?: string;
    }
  }
}

/**
 * Hook for disconnecting an integration
 */
export default function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation<DisconnectResponse, ApiError, DisconnectIntegrationPayload>({
    mutationFn: async (data: DisconnectIntegrationPayload) => {
      const response = await instance.delete(`/integration/${data.integrationId}`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Integration disconnected!", {
        description: data.message || "The integration was successfully disconnected.",
      });

      // Invalidate the integrations query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error) => {
      toast.error("Failed to disconnect integration", {
        description: error?.response?.data?.message || error.message || "An error occurred",
      });
    },
  });
}

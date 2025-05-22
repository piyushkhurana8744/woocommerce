import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import instance from "@/lib/axios";

// Integration interface based on the backend model
export interface Integration {
  _id: string;
  key: string;
  secret: string;
  storeUrl: string;
  integration: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Response interface matching the API response structure
interface IntegrationResponse {
  message: string;
  data: Integration[];
}

/**
 * Hook for fetching all integrations for the authenticated user
 */
export function useGetIntegrations() {
  return useQuery<Integration[]>({
    queryKey: ['integrations'],
    queryFn: async () => {
      try {
        const response = await instance.get<IntegrationResponse>('/integration/get-integrations');
        return response.data.data; // Return the array of integrations from the response
      } catch (error) {
        toast.error("Failed to fetch integrations", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once if the request fails
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}



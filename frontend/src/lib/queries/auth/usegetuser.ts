import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';
import instance from '@/lib/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface GetUserResponse {
  user: User;
}

/**
 * Hook for fetching the current authenticated user
 * Updates the Zustand store with user data on successful response
 */
export function useGetUser() {
  const { setUser } = useUserStore();

  return useQuery<GetUserResponse, Error>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        // Get the token from localStorage
        
        // Make the API request
        const response = await instance.get<GetUserResponse>('/auth/me');
        
        // Update the user store with the retrieved data
        setUser(response.data.user);
        
        return response.data;
      } catch (error) {
        // Clear token if unauthorized
        console.error('Error fetching user data:', error);
        throw error; // Re-throw to let React Query handle the error state
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Retry once in case of network issues
  });
}

export default useGetUser;

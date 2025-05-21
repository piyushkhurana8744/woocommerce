import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import instance from "@/lib/axios";

interface LogoutResponse {
  success: boolean;
  message: string;
}

// Export as a named function, not a default export
export function useLogout() {
  const logout = useUserStore(state => state.logout);
  const router = useRouter();
  
  return useMutation<LogoutResponse, Error>({
    mutationFn: async () => {
      try {
        // Optional: Call logout API endpoint if you need to invalidate tokens on server
        const response = await instance.post<LogoutResponse>("/auth/logout");
        return response.data;
      } catch (error) {
        // Even if API call fails, we still want to clear local state
        console.warn("Logout API call failed, but local state will be cleared", error);
        return { success: true, message: "Logged out locally" };
      }
    },
    onSuccess: () => {
      // Clear token from localStorage
      localStorage.removeItem("token");
      
      // Update Zustand store to clear user data
      logout();
      
      toast.success("Logged out successfully");
      
      // Redirect to login page
      router.push("/sign-in");
    },
    onError: (error) => {
      // Handle error if needed
      toast.error(error.message);
    },
  });
}

// Also provide a default export that points to the same function
export default useLogout;
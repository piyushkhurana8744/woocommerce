import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import instance from "@/lib/axios";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";

type SignupData = {
    name: string;
    email: string;
    password: string;
}

interface SignupResponse {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    token: string;
}

const useSignup = () => {
    const { setUser } = useUserStore();
    const router = useRouter();
    
    return useMutation<SignupResponse, Error, SignupData>({
        mutationFn: async (data: SignupData) => {
            try {
                const response = await instance.post<SignupResponse>("/auth/signup", data);
                return response.data;
            } catch (error: any) {
                const message =
                    error.response?.data?.message ||
                    error.message ||
                    "Signup failed";
                throw new Error(message);
            }
        },
        onSuccess: (data) => {
            // Store JWT token in localStorage
            localStorage.setItem("token", data.token);
            
            toast.success("Account created successfully!", {
                description: `Welcome, ${data.user.name}!`,
            });
            
            // Update user store with complete data including ID
            setUser({
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
            });
            
            // Navigate to the product page
            router.push("/product");
        },
        onError: (error: Error) => {
            toast.error("Signup failed", {
                description: error.message || "Please try again later",
            });
        }
    });
};

export default useSignup;
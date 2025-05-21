import instance from "@/lib/axios";
import { useUserStore } from "@/store/userStore";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SigninData = {
    email: string;
    password: string;
};

interface SigninResponse {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    token: string;
}

const useSignin = () => {
    const { setUser } = useUserStore();
       const router = useRouter();
    return useMutation<SigninResponse, Error, SigninData>({
        mutationFn: async (data: SigninData) => {
            try {
                const response = await instance.post<SigninResponse>("/auth/login", data);
                return response.data;
            } catch (error: any) {
                const message =
                    error.response?.data?.message ||
                    error.message ||
                    "Invalid credentials";
                throw new Error(message);
            }
        },
        onSuccess: (data) => {
            // Update the Zustand store with user data
            setUser(data.user);
            
            toast.success("Signed in successfully!", {
                description: `Welcome back, ${data.user.name}!`,
            });
            
            // Navigate to the product page
            router.push("/product");
        },
        onError: (error: Error) => {
            console.log(error,"error");
            toast.error("Sign-in failed", {
                description: error.message || "Please check your credentials and try again",
            });
        },
    });
};

export default useSignin;
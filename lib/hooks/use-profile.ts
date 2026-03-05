import { useQuery } from "@tanstack/react-query";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "customer" | "staff" | "admin";
  image_url?: string;
  loyalty_points?: number;
}

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

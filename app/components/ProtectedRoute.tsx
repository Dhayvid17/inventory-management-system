import { useAuthContext } from "../hooks/useAuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!state.token) {
      router.push("/login");
    }
  }, [state.token, router]);

  return state.token ? <>{children}</> : null;
};

export default ProtectedRoute;

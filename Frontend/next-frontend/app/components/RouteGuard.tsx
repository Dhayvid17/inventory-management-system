"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../hooks/useAuthContext";
import Spinner from "./Spinner";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  allowedRoles,
}) => {
  const { state } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!state.isLoading) {
      if (!state.isAuthenticated) {
        router.push("/users/login");
        return;
      }

      if (state.user && !allowedRoles.includes(state.user.role)) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [
    state.isLoading,
    state.isAuthenticated,
    state.user,
    allowedRoles,
    router,
  ]);

  if (state.isLoading) {
    return <Spinner />;
  }

  if (
    !state.isAuthenticated ||
    (state.user && !allowedRoles.includes(state.user.role))
  ) {
    return null;
  }

  return <>{children}</>;
};

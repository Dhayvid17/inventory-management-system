"use client";

import React from "react";
import { useAuthContext } from "./useAuthContext";
const LogoutButton: React.FC = () => {
  const { dispatch } = useAuthContext();

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("token");
  };

  return (
    <button onClick={handleLogout} className="text-red-500">
      Logout
    </button>
  );
};

export default LogoutButton;

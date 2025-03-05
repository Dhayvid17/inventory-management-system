"use client";

import { ToastContext } from "../context/ToastContext";
import { useContext } from "react";

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastContextProvider");
  }
  return context;
};

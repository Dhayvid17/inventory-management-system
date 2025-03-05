"use client";

import React, { createContext, useReducer, ReactNode } from "react";
import Toast from "../components/Toaster";

//TOAST TYPES FOR STATE AND ACTION
export type ToastType = "success" | "error" | "warning" | "info";

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

type ToastAction =
  | { type: "SHOW_TOAST"; payload: { message: string; type: ToastType } }
  | { type: "HIDE_TOAST" };

//INITIAL STATE
const initialState: ToastState = {
  message: "",
  type: "info",
  isVisible: false,
};

// REDUCER FUNCTION
function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "SHOW_TOAST":
      return {
        ...state,
        message: action.payload.message,
        type: action.payload.type,
        isVisible: true,
      };
    case "HIDE_TOAST":
      return {
        ...state,
        isVisible: false,
        message: "",
      };
    default:
      return state;
  }
}

//CREATE TOAST CONTEXT
export const ToastContext = createContext<{
  state: ToastState;
  dispatch: React.Dispatch<ToastAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

//PROVIDER COMPONENT
export const ToastContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(toastReducer, initialState);

  return (
    <ToastContext.Provider value={{ state, dispatch }}>
      {children}
      <Toast />
    </ToastContext.Provider>
  );
};

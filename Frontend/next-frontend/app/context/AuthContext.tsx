"use client";

import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import React, { createContext, useReducer, ReactNode, useEffect } from "react";

//TYPES FOR STATES AND ACTIONS
export interface DecodedToken {
  id: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

type AuthState = {
  isAuthenticated: boolean;
  user: DecodedToken | null;
  token: string | null;
  isLoading: boolean;
};

type AuthAction =
  | { type: "LOGIN"; payload: { user: DecodedToken; token: string } }
  | { type: "LOGOUT" }
  | { type: "REGISTER"; payload: { user: DecodedToken; token: string } }
  | { type: "SET_LOADING"; payload: { isLoading: boolean } };

//INITIAL STATE
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
};

//REDUCER FUNCTION
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN":
    case "REGISTER":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      };

    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };
    default:
      return state;
  }
};

//CREATE AUTH CONTEXT
export const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
}>({ state: initialState, dispatch: () => null });

//PROVIDER COMPONENT
export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        if (decodedToken.exp * 1000 > Date.now()) {
          dispatch({
            type: "LOGIN",
            payload: {
              user: decodedToken,
              token,
            },
          });
        } else {
          localStorage.removeItem("token");
          dispatch({ type: "LOGOUT" });
          router.push("users/login");
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("token");
        dispatch({ type: "LOGOUT" });
      }
    }
    dispatch({ type: "SET_LOADING", payload: { isLoading: false } });
  }, [router]);
  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

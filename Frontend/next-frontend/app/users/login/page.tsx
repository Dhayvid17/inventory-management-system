"use client";

import React, { useState } from "react";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "@/app/context/AuthContext";

//LOGIC TO DISPLAY THE LOGIN PAGE
const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { state, dispatch } = useAuthContext();
  const router = useRouter();

  //HANDLE LOGIN LOGIC
  const handleLogin = async () => {
    //Clear previous errors
    setError("");
    setPasswordErrors([]);

    //Basic Input validation
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );
      const data = await response.json();
      //Handle specific error cases
      if (!response.ok) {
        //Check for different possible error formats
        if (data.errorType) {
          switch (data.errorType) {
            case "USERNAME_NOT_FOUND":
              setError("Username not found. Please check and try again.");
              break;
            case "INVALID_CREDENTIALS":
              setError("Invalid username or password.");
              break;
            default:
              setError(data.message || "Login failed");
          }
        } else if (data.error) {
          //Handle direct error message
          setError(data.error);
        } else {
          //Fallback generic error
          setError("Login failed. Please try again.");
        }
        return;
      }

      //Successful login
      if (data.token) {
        const decodedToken = jwtDecode<DecodedToken>(data.token);
        localStorage.setItem("token", data.token);
        dispatch({
          type: "LOGIN",
          payload: {
            user: decodedToken,
            token: data.token,
          },
        });
        router.push("/");
      } else {
        console.error(data.error);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container bg-gray-50 flex items-center justify-center px-4 my-10">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Login</h2>
        </div>
        <form
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-6 p-7"
        >
          {/* Display password validation errors */}
          {passwordErrors.length > 0 && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg mb-4">
              {passwordErrors.map((errorMsg, index) => (
                <p key={index} className="font-medium">
                  {errorMsg}
                </p>
              ))}
            </div>
          )}

          {/* Display general login errors */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg mb-4">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="relative">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Username
            </label>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-blue-950 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-green-700 focus:border-transparent outline-none cursor-pointer"
                disabled={isLoading}
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-blue-950 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-green-700 focus:border-transparent outline-none cursor-pointer"
                disabled={isLoading}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-lg text-white font-semibold transition-all duration-300 
              ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:shadow-lg"
              }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading...
              </div>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

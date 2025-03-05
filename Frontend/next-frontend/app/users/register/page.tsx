"use client";

import React, { useState } from "react";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "@/app/context/AuthContext";
import { useToastContext } from "@/app/hooks/useToastContext";

//LOGIC TO DISPLAY THE REGISTRATION PAGE
const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { state, dispatch } = useAuthContext();
  const { dispatch: toastDispatch } = useToastContext();
  const isAdmin = state.user?.role === "admin";
  const router = useRouter();

  // Comprehensive username validation
  const validateUsername = (username: string) => {
    const errors: string[] = [];

    // Check for empty password first
    if (!username.trim()) {
      errors.push("Username cannot be empty");
      return errors;
    }

    if (username.length < 4) {
      errors.push("Username must be at least 4 characters long");
    }

    if (username.length > 20) {
      errors.push("Username must be less than 20 characters");
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push(
        "Username can only contain letters, numbers, and underscores"
      );
    }

    return errors;
  };

  // Comprehensive password validation
  const validatePassword = (password: string) => {
    const errors: string[] = [];

    // Check for empty password first
    if (!password.trim()) {
      errors.push("Password cannot be empty");
      return errors;
    }

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return errors;
  };

  //HANDLE REGISTER LOGIC
  const handleRegister = async () => {
    // Clear previous errors
    setError("");
    setValidationErrors([]);

    // Validate username
    const usernameValidationErrors = validateUsername(username);

    // Validate password
    const passwordValidationErrors = validatePassword(password);

    // Check password confirmation
    if (password !== confirmPassword) {
      passwordValidationErrors.push("Passwords do not match");
    }

    // Combine all validation errors
    const allValidationErrors = [
      ...usernameValidationErrors,
      ...passwordValidationErrors,
    ];

    if (allValidationErrors.length > 0) {
      setValidationErrors(allValidationErrors);
      return;
    }

    // Proceed with registration
    setIsLoading(true);

    try {
      // Determine the appropriate registration endpoint
      const registrationEndpoint = isAdmin
        ? `${process.env.NEXT_PUBLIC_API_URL}/users/admin/create`
        : `${process.env.NEXT_PUBLIC_API_URL}/users/register`;

      // Prepare request body
      const requestBody = {
        username,
        password,
        ...(isAdmin && { role }), // Only include role if admin is creating a user
      };

      // Prepare fetch options
      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include authorization token for admin creation
          ...(isAdmin && {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          }),
        },
        body: JSON.stringify(requestBody),
      };

      const response = await fetch(registrationEndpoint, fetchOptions);
      const data = await response.json();

      // Handle response
      if (!response.ok) {
        // Error handling logic
        setError(data.error || "Registration failed");
        return;
      }

      // Admin user creation flow
      if (isAdmin) {
        // For admin creating users, show success notification and redirect to homepage
        toastDispatch({
          type: "SHOW_TOAST",
          payload: {
            message: "User created successfully!",
            type: "success",
          },
        });
        // Reset form
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setRole("user");
        // Redirect to Home page
        router.push("/");
        return;
      }
      // Regular user registration, log in and redirect
      const loginResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      const loginData = await loginResponse.json();
      if (!loginData.token) {
        setError("Registration successful, but login failed");
        return;
      }
      // Successful login
      const decodedToken = jwtDecode<DecodedToken>(loginData.token);

      dispatch({
        type: "LOGIN",
        payload: {
          user: decodedToken,
          token: loginData.token,
        },
      });

      localStorage.setItem("token", loginData.token);
      router.push("/");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container bg-gray-50 flex items-center justify-center px-4 my-10 mx-auto">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Register</h2>
        </div>
        <form
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            handleRegister();
          }}
          className="space-y-6 p-8"
        >
          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg"
              role="alert"
            >
              {validationErrors.map((errorMsg, index) => (
                <p key={index} className="font-medium">
                  {errorMsg}
                </p>
              ))}
            </div>
          )}

          {/* General Error Display */}
          {error && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg"
              role="alert"
            >
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Username Input */}
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

          {/* Password Input */}
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

          {/* Confirm Password Input */}
          <div className="relative">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Confirm Password
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-blue-950 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-green-700 focus:border-transparent outline-none cursor-pointer"
                disabled={isLoading}
                placeholder="Confirm your password"
              />
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Role
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-blue-950 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-green-700 focus:border-transparent outline-none cursor-pointer"
                >
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

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
              "Register"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

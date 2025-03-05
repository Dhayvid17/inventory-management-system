"use client";

import React, { useEffect } from "react";
import { useToastContext } from "../hooks/useToastContext";

//LOGIC TO DISPLAY THE TOAST COMPONENT
const Toast: React.FC = () => {
  const { state, dispatch } = useToastContext();

  // Automatically hide toast after 3 seconds
  useEffect(() => {
    if (state.isVisible) {
      const timer = setTimeout(() => {
        dispatch({ type: "HIDE_TOAST" });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [state.isVisible, dispatch]);

  if (!state.isVisible) return null;

  // Determine toast styles based on type
  const bgColorMap = {
    success: "bg-green-100 border-l-4 border-green-500 text-green-700",
    error: "bg-red-100 border-l-4 border-red-500 text-red-700",
    warning: "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700",
    info: "bg-blue-100 border-l-4 border-blue-500 text-blue-700",
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center items-start p-4">
      <div
        className={`max-w-md w-full ${
          bgColorMap[state.type]
        } p-4 rounded shadow-md`}
        role="alert"
      >
        <div className="flex items-center">
          <div className="font-medium">{state.message}</div>
          <button
            onClick={() => dispatch({ type: "HIDE_TOAST" })}
            className="ml-auto text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;

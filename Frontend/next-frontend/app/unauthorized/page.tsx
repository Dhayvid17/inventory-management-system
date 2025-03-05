"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";

//COMPONENT TO DISPLAY UNAUTHORIZED PAGE
const UnAuthorizedPage: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  //HANDLE GO BACK LOGIC
  const handleGoBack = () => {
    if (isMounted) {
      window.history.back();
    }
  };
  return (
    <div>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <FaLock className="text-6xl text-red-600 mx-auto" />
          <h1 className="text-6xl font-bold text-red-600">403</h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-800">
            Unauthorized Access
          </h2>
          <p className="mt-2 text-gray-600">
            Sorry, you do not have permission to view this page.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-block px-6 py-3 text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-200"
            >
              Go to Home
            </Link>
            <button
              onClick={handleGoBack}
              className="inline-block px-6 py-3 ml-4 text-blue-600 border border-blue-600 rounded hover:bg-blue-600 hover:text-white transition duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnAuthorizedPage;

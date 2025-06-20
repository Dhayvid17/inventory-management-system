"use client";

import { useAuthContext } from "@/app/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

//LOGIC TO ADD NEW CATEGORY FORM
const CategoryForm: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const { state } = useAuthContext();

  const isAdmin = state.user?.role === "admin";

  useEffect(() => {
    //Wait for authentication state to be ready
    if (state.isLoading) {
      return;
    }

    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    //Mark auth as checked after we've verified the user status
    setAuthChecked(true);

    if (!isAdmin) {
      setLoading(false); //No longer loading
      setError("You are not authorized to create a category.");
      router.push("/unauthorized"); //Redirect to unauthorized page
      return;
    }
  }, [state.isLoading, state.isAuthenticated, isAdmin, router]);

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      setError("Both fields are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create category: ${res.statusText}`);
      }
      router.push("/categories");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating category:", error);
      setError(`Error creating category: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  //DISPLAY ERROR MESSAGE IF THE USER IS NOT STAFF/ADMIN
  if (authChecked && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">
            You are not authorized to create a category.
          </span>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 shadow rounded-lg max-w-md"
    >
      <div className="mb-4">
        <label className="block text-gray-700">Name</label>
        <input
          type="text"
          className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {!name && error && (
          <p className="text-red-500 text-sm">This field is required.</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Description</label>
        <textarea
          className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />
        {!description && error && (
          <p className="text-red-500 text-sm">This field is required.</p>
        )}
      </div>
      <button
        type="submit"
        className={`w-full bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-700 transition-colors ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={loading}
      >
        {loading ? "Adding..." : "Create Category"}
      </button>
    </form>
  );
};

export default CategoryForm;

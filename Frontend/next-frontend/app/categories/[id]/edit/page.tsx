"use client";

import { Category } from "@/app/types/category";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import Spinner from "@/app/components/Spinner";

//LOGIC TO CONNECT TO THE BACKEND SERVER
const fetchCategoryData = async (
  id: string,
  token: string
): Promise<Category> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch category: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
};

//LOGIC TO EDIT EXISTING CATEGORY DATA
const CategoryForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { state } = useAuthContext();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const id = params.id;

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    if (!isStaffAdmin) {
      setError("You are not authorized to edit this category.");
      return;
    }
    const fetchCategories = async () => {
      try {
        const category = await fetchCategoryData(
          id as string,
          state.token || ""
        );
        setName(category.name);
        setDescription(category.description);
      } catch (error: any) {
        setError(error.message);
        console.error("Failed to load category data:", error);
      }
    };
    fetchCategories();
  }, [id, state.isAuthenticated, state.token, isStaffAdmin, router]);

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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify({ name, description }),
      });
      router.push("/categories");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating category:", error);
      setError(`Error updating category: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  //DISPLAY ERROR MESSAGE IF THE USER IS NOT STAFF/ADMIN
  if (!isStaffAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">
            You are not authorized to edit this category.
          </span>
        </div>
      </div>
    );
  }

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Edit Category</h1>
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
          {loading ? "Updating..." : "Update Category"}
        </button>
      </form>
    </div>
  );
};

export default CategoryForm;

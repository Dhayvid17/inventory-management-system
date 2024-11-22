"use client";

import React, { Suspense, useEffect, useState } from "react";
import CategoryList from "../components/category/CategoryList";
import Spinner from "../components/Spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../hooks/useAuthContext";

//LOGIC TO DISPLAY THE CATEGORY PAGE
const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state, dispatch } = useAuthContext();
  const router = useRouter();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";

  useEffect(() => {
    if (state.isLoading) return; //Wait until loading is false

    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    //Fetch categories from Backend API
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/categories`,
          {
            headers: {
              Authorization: `Bearer ${state.token}`,
            },
          }
        );
        if (!res.ok) {
          if (res.status === 401) {
            //Token might be invalid/expired
            router.push("/users/login");
            return;
          }
          throw new Error("Failed to fetch categories");
        }
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [state.isLoading, state.isAuthenticated, state.token, router]);

  //Display Spinner when IsLoading
  if (state.isLoading) {
    return <Spinner />;
  }

  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-gray-600 mt-1">
            Manage and organize your categories
          </p>
        </div>
        {isStaffAdmin && (
          <Link
            href="/categories/create"
            className="bg-blue-600 text-white font-medium border border-blue-600 hover:bg-blue-950 transition duration-200 ease-in-out px-4 py-2 rounded"
          >
            Add New Category
          </Link>
        )}
      </div>
      {isLoading ? (
        <Spinner />
      ) : categories.length > 0 ? (
        <CategoryList categories={categories} />
      ) : (
        <p className="text-center text-gray-500 mt-4 text-lg font-semibold">
          No categories available.
        </p>
      )}
    </main>
  );
};

export default CategoriesPage;

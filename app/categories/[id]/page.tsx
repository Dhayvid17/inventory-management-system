"use client";

import Spinner from "@/app/components/Spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NotFound from "../not-found";
import { Category } from "@/app/types/category";
import { useAuthContext } from "@/app/hooks/useAuthContext";

interface CategoryDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE CATEGORY DETAILS FROM THE BACKEND SERVER
async function getCategoryDetail(id: string, token: string) {
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
  const data = res.json();
  return data;
}

//LOGIC TO DISPLAY EACH CATEGORY DETAIL PAGE
export default function CategoryDetailPage({
  params,
}: CategoryDetailPageProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { state } = useAuthContext();
  const router = useRouter();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const isAdmin = state.user?.role === "admin";

  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!state.isAuthenticated) {
        router.push("/users/login"); //Redirect to login if not authenticated
        return;
      }
      try {
        const data = await getCategoryDetail(id, state.token || "");
        setCategory(data);
      } catch (error: any) {
        setCategory(null);
        setError(error.message);
        console.error("Error fetching category:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [id, state.isAuthenticated, state.token, router]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this category?")) {
      setIsDeleting(true);

      if (!isAdmin) {
        setError("You are not authorized to delete categories");
        return;
      }
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        });
        alert("Category deleted successfully!");
        router.push("/categories");
        router.refresh();
      } catch (error: any) {
        console.error("Error deleting category:", error);
        alert(`Error deleting Category: ${error.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  //DISPLAY ERROR MESSAGE
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg
              className="fill-current h-6 w-6 text-red-500"
              role="button"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 10-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 101.414 1.414L10 11.414l2.934 2.934a1 1 0 001.414-1.414L11.414 10l2.934-2.934a1 1 0 000-1.414z" />
            </svg>
          </span>
        </div>
      </div>
    );
  }

  //LOGIC TO DISPLAY NOT-FOUND IS CATEGORY DATA RETURN NULL
  if (!category) {
    return <NotFound />;
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <strong>Category Name: </strong>
            {category.name}
          </h1>
          <p className="text-gray-700 text-lg">
            <strong>Category Description: </strong>
            {category.description}
          </p>
        </div>
        {isStaffAdmin && (
          <div className="flex space-x-4">
            <Link
              href={`/categories/${id}/edit`}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className={`px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ${
                isDeleting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting.." : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

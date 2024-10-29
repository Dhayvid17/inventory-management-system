"use client";

import Spinner from "@/app/components/Spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NotFound from "../not-found";

interface Category {
  id: string;
  name: string;
  description: string;
}

interface CategoryDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE CATEGORY DETAILS FROM THE BACKEND SERVER
async function getCategoryDetail(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`,
    {
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) {
    return null;
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
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const data = await getCategoryDetail(id);
        setCategory(data);
      } catch (error) {
        setCategory(null);
        console.error("Error fetching category:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [id]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this category?")) {
      setIsDeleting(true);
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`, {
          method: "DELETE",
        });
        alert("Category deleted successfully!");
        router.push("/categories");
        router.refresh();
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Error deleting category");
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

  //LOGIC TO DISPLAY NOT-FOUND IS CATEGORY DATA RETURN NULL
  if (!category) {
    return <NotFound />;
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">
            <strong>Category Name: </strong>
            {category.name}
          </h1>
          <p className="text-gray-700 text-lg">
            <strong>Category Description: </strong>
            {category.description}
          </p>
        </div>
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
      </div>
    </div>
  );
}

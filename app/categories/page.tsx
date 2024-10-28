import React, { Suspense } from "react";
import CategoryList from "../components/category/CategoryList";
import Spinner from "../components/Spinner";
import Link from "next/link";

//LOGIC TO FETCH CATEGORIES FROM BACKEND SERVER
const fetchCategories = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
    next: {
      revalidate: 0,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  const data = await res.json();
  return data;
};

//LOGIC TO DISPLAY THE CATEGORY PAGE
const CategoriesPage: React.FC = async () => {
  const categories = await fetchCategories();

  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Link
          href="/categories/create"
          className="bg-blue-600 text-white font-medium border border-blue-600 hover:bg-blue-950 transition duration-200 ease-in-out px-4 py-2 rounded"
        >
          Add New Category
        </Link>
      </div>
      <Suspense fallback={<Spinner />}>
        <CategoryList categories={categories} />
      </Suspense>
    </main>
  );
};

export default CategoriesPage;

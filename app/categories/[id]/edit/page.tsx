"use client";

import { Category, CategoryEditFormProps } from "@/app/types/category";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

//LOGIC TO CONNECT TO THE BACKEND SERVER
const fetchCategoryData = async (id: string): Promise<Category> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`,
    {
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch category");
  const data = res.json();
  return data;
};

//LOGIC TO EDIT EXISTING CATEGORY DATA
const CategoryForm: React.FC<CategoryEditFormProps> = ({ category }) => {
  const router = useRouter();
  const params = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const id = params.id;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const category = await fetchCategoryData(id as string);
        setName(category.name);
        setDescription(category.description);
      } catch (error) {
        console.error("Failed to load category data:", error);
      }
    };
    fetchCategories();
  }, [id]);

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      setError("Both fields are required.");
      return;
    }
    setError("");
    setLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setLoading(false);
    router.push("/categories");
    router.refresh();
  };

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

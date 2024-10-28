"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

//LOGIC TO ADD NEW CATEGORY FORM
const CategoryForm: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      setError("Both fields are required.");
      return;
    }
    setError("");
    setLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setLoading(false);
    router.push("/categories");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 shadow rounded-lg max-w-md"
    >
      <div className="mb-4">
        <label className="block text-gray-700">Name</label>
        <input
          type="text"
          className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none"
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
          className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none"
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
        className="w-full bg-blue-500 text-white p-2 rounded mt-4"
        disabled={loading}
      >
        {loading ? "Adding..." : "Create Category"}
      </button>
    </form>
  );
};

export default CategoryForm;

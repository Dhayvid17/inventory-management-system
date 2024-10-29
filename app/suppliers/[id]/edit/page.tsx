"use client";

import { Supplier, SupplierEditFormProps } from "@/app/types/supplier";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

//LOGIC TO CONNECT TO THE BACKEND SERVER
const fetchSupplierData = async (id: string): Promise<Supplier> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`,
    {
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch supplier");
  const data = res.json();
  return data;
};

//LOGIC TO EDIT EXISTING SUPPLIER DATA
const SupplierForm: React.FC<SupplierEditFormProps> = ({ supplier }) => {
  const router = useRouter();
  const params = useParams();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const id = params.id;

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const supplier = await fetchSupplierData(id as string);
        setName(supplier.name);
        setContact(supplier.contact);
        setEmail(supplier.email);
        setAddress(supplier.address);
      } catch (error) {
        console.error("Failed to load supplier data:", error);
      }
    };
    fetchSuppliers();
  }, [id]);

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !email.trim() || !address.trim()) {
      setError("All fields are required.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          email: email.trim(),
          address: address.trim(),
        }),
      }
    );
    if (!res.ok) {
      throw new Error("Failed to update supplier");
    }
    setLoading(false);
    router.push("/suppliers");
    router.refresh();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Edit Supplier</h1>
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
          <label className="block text-gray-700">Contact</label>
          <input
            type="text"
            className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          {!contact && error && (
            <p className="text-red-500 text-sm">This field is required.</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Email Address</label>
          <input
            type="text"
            className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {!email && error && (
            <p className="text-red-500 text-sm">This field is required.</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Address</label>
          <input
            type="text"
            className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          {!address && error && (
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
          {loading ? "Updating..." : "Update Supplier"}
        </button>
      </form>
    </div>
  );
};

export default SupplierForm;

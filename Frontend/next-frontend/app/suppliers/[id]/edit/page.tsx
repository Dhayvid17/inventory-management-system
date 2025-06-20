"use client";

import Spinner from "@/app/components/Spinner";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import { Supplier, SupplierEditFormProps } from "@/app/types/supplier";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

//LOGIC TO CONNECT TO THE BACKEND SERVER
const fetchSupplierData = async (
  id: string,
  token: string
): Promise<Supplier> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) throw new Error(`Failed to fetch supplier: ${res.statusText}`);
  const data = await res.json();
  return data;
};

//LOGIC TO EDIT EXISTING SUPPLIER DATA
const SupplierForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false); //Add this to track auth check
  const { state } = useAuthContext();

  const isAdmin = state.user?.role === "admin";
  const id = params.id;

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
      setError("You are not authorized to edit this supplier.");
      router.push("/unauthorized"); //Redirect to unauthorized page
      return;
    }
    const fetchSuppliers = async () => {
      try {
        const supplier = await fetchSupplierData(
          id as string,
          state.token || ""
        );
        setName(supplier.name);
        setContact(supplier.contact);
        setEmail(supplier.email);
        setAddress(supplier.address);
      } catch (error: any) {
        setError(error.message);
        console.error("Failed to load supplier data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, [
    id,
    state.isLoading,
    state.isAuthenticated,
    state.token,
    isAdmin,
    router,
  ]);

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !email.trim() || !address.trim()) {
      setError("All fields are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            contact: contact.trim(),
            email: email.trim(),
            address: address.trim(),
          }),
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to update supplier: ${res.statusText}`);
      }
      router.push("/suppliers");
      router.refresh();
    } catch (error: any) {
      setError(error.message);
      console.error("Failed to update supplier data:", error);
    } finally {
      setLoading(false);
    }
  };

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

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
            You are not authorized to edit this supplier.
          </span>
        </div>
      </div>
    );
  }

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

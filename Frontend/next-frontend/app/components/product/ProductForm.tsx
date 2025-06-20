"use client";

import { useAuthContext } from "@/app/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Spinner from "../Spinner";

//Debounce function to limit API calls
function debounce(func: (...args: any[]) => void, delay: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

interface Option {
  _id: string;
  name: string;
}

//LOGIC TO ADD NEW PRODUCT FORM
const ProductForm: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [category, setCategory] = useState<Option | null>(null);
  const [warehouse, setWarehouse] = useState("");
  const [supplier, setSupplier] = useState<Option | null>(null);
  const [categories, setCategories] = useState<Option[]>([]);
  const [warehouses, setWarehouses] = useState<Option[]>([]);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const { state } = useAuthContext();

  const isAdmin = state.user?.role === "admin";

  useEffect(() => {
    //Check if the authentication state is still loading
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
      //Check if user is staff admin
      //If not, redirect to unauthorized page
      setLoading(false); //No longer loading
      setError("You are not authorized to create a category.");
      router.push("/unauthorized"); //Redirect to unauthorized page
      return;
    }
  }, [state.isLoading, state.isAuthenticated, isAdmin, router]);

  //Fetch initial options for warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/warehouses`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
          }
        );
        const data = await res.json();
        setWarehouses(data);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching warehouses:", error);
      }
    };
    fetchWarehouses();
  }, [state.token]);

  //Fetch dropdown options based on input
  const fetchOptions = async (
    type: "categories" | "suppliers",
    query: string
  ) => {
    if (!query) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${type}?query=${query}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
        }
      );
      const data = await res.json();
      if (type === "categories") setCategories(data);
      if (type === "suppliers") setSuppliers(data);
    } catch (error: any) {
      setError(error.message);
      console.error(`Error fetching ${type} options:`, error);
    }
  };

  //Debounced version of fetchOptions
  const debouncedFetchCategories = debounce(
    (query: string) => fetchOptions("categories", query),
    300
  );

  const debouncedFetchSuppliers = debounce(
    (query: string) => fetchOptions("suppliers", query),
    300
  );

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    //Validate fields
    if (
      !name.trim() ||
      price === "" ||
      quantity === "" ||
      !category ||
      !warehouse ||
      !supplier
    ) {
      setError("All fields are required.");
      return;
    }

    const priceNumber = typeof price === "string" ? Number(price) : price;
    if (isNaN(priceNumber) || priceNumber < 0) {
      setError("Price must be a valid non-negative number.");
      return;
    }

    const quantityNumber =
      typeof quantity === "string" ? Number(quantity) : quantity;
    if (isNaN(quantityNumber) || quantityNumber < 0) {
      setError("Quantity must be a valid non-negative number.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          price: priceNumber,
          quantity: quantityNumber,
          category: category._id,
          warehouse,
          supplier: supplier._id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Server response error:", errorData);
        throw new Error(
          errorData.message ||
            "Failed to create product" ||
            `Error: ${res.status}`
        );
      }

      router.push("/products");
      router.refresh();
    } catch (error: any) {
      console.error("Fetch error:", error);
      setError(
        `An error occurred while creating the product: ${error.message}`
      );
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
            You are not authorized to create a product.
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
        <label className="block text-gray-700">Price</label>
        <input
          type="number"
          className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        {price === "" && error && (
          <p className="text-red-500 text-sm">This field is required.</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Quantity</label>
        <input
          type="number"
          className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        {quantity === "" && error && (
          <p className="text-red-500 text-sm">This field is required.</p>
        )}
      </div>

      {/* Autocomplete Dropdown for Category */}
      <div className="mb-4 relative">
        <label className="block text-gray-700">Category</label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
          placeholder="Search category"
          value={categorySearch}
          onChange={(e) => {
            setCategorySearch(e.target.value);
            debouncedFetchCategories(e.target.value);
          }}
        />
        {categorySearch && categories.length > 0 && (
          <ul className="absolute w-full bg-white border border-gray-300 mt-1 max-h-40 overflow-y-auto z-10">
            {categories
              .filter((opt) =>
                opt.name.toLowerCase().includes(categorySearch.toLowerCase())
              )
              .map((opt) => (
                <li
                  key={opt._id}
                  onClick={() => {
                    setCategory(opt);
                    setCategories([]);
                    setCategorySearch(opt.name);
                  }}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                >
                  {opt.name}
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Warehouse</label>
        <select
          className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value)}
        >
          <option value="" className="text-gray-700">
            Select a warehouse
          </option>
          {warehouses.map((ware) => (
            <option key={ware._id} value={ware._id}>
              {ware.name}
            </option>
          ))}
        </select>
      </div>

      {/* Autocomplete Dropdown for Supplier */}
      <div className="mb-4 relative">
        <label className="block text-gray-700">Supplier</label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
          placeholder="Search supplier"
          value={supplierSearch}
          onChange={(e) => {
            setSupplierSearch(e.target.value);
            debouncedFetchSuppliers(e.target.value);
          }}
        />
        {supplierSearch && suppliers.length > 0 && (
          <ul className="absolute w-full bg-white border border-gray-300 mt-1 max-h-40 overflow-y-auto z-10">
            {suppliers
              .filter((opt) =>
                opt.name.toLowerCase().includes(supplierSearch.toLowerCase())
              )
              .map((opt) => (
                <li
                  key={opt._id}
                  onClick={() => {
                    setSupplier(opt);
                    setSuppliers([]);
                    setSupplierSearch(opt.name);
                  }}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                >
                  {opt.name}
                </li>
              ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        className={`w-full bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-700 transition-colors ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={loading}
      >
        {loading ? "Adding..." : "Create Product"}
      </button>
    </form>
  );
};

export default ProductForm;

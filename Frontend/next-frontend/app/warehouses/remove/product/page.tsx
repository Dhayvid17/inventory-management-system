"use client";

import { Product } from "@/app/types/product";
import { Warehouse } from "@/app/types/warehouse";
import React, { useState, useEffect, useCallback } from "react";

import { useAuthContext } from "@/app/hooks/useAuthContext";
import { useRouter } from "next/navigation";

//WAREHOUSE PRODUCT FORM COMPONENT
const WarehouseProductForm: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
    null
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const router = useRouter();
  const { state } = useAuthContext();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";

  //Fetch Products from the Backend API
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      const data = await response.json();
      setProducts(data.products);
    } catch (error: any) {
      console.error(error);
      setMessage(`Error fetching products: ${error.message}`);
    }
  }, [state.token]);

  //Fetch Warehouses from the Backend API
  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/warehouses`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch warehouses: ${response.statusText}`);
      }
      const data = await response.json();
      setWarehouses(data);
    } catch (error: any) {
      console.error(error);
      setMessage(`Error fetching warehouses: ${error.message}`);
    }
  }, [state.token]);

  useEffect(() => {
    if (state.isLoading) return;

    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    if (!isStaffAdmin) {
      router.push("/unauthorized");
      return;
    }
    //Fetch warehouses and products once when the component mounts
    const fetchData = async () => {
      await fetchWarehouses();
      await fetchProducts();
    };
    fetchData();
  }, [
    state.isAuthenticated,
    isStaffAdmin,
    router,
    fetchProducts,
    fetchWarehouses,
    state.isLoading,
  ]);

  //HANDLE REMOVE PRODUCT LOGIC
  const handleRemoveProduct = async () => {
    if (!selectedWarehouse || !selectedProduct) {
      setMessage("Please select both warehouse and product");
      return;
    }

    //Check if the product exists in the selected warehouse
    const productExists = selectedWarehouse.products?.some(
      (product) => product.productId === selectedProduct._id
    );

    if (!productExists) {
      setMessage("Product not found in the selected warehouse");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/warehouses/remove/product`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify({
            warehouseId: selectedWarehouse._id,
            productId: selectedProduct._id,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to remove product");
      }

      setMessage("Product removed from warehouse successfully");
      clearSelections();
      router.push("/warehouses");
      router.refresh();
    } catch (error: any) {
      setMessage(error.message || "Error removing product from warehouse");
    } finally {
      setLoading(false);
    }
  };

  const clearSelections = () => {
    setSelectedWarehouse(null);
    setSelectedProduct(null);
    setWarehouseSearch("");
    setProductSearch("");
  };

  const filteredWarehouses = warehouses.filter((warehouse) =>
    warehouse.name.toLowerCase().includes(warehouseSearch.toLowerCase())
  );

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="max-w-2xl mt-10 mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl text-gray-950 font-bold mb-6">
        Warehouse Product Management
      </h2>

      {message && (
        <div
          className={`p-4 mb-4 rounded ${
            message.includes("Error")
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-base text-gray-950 font-medium mb-2">
          Warehouse:
        </label>
        <div className="relative">
          <input
            type="text"
            className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 mb-2 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
            placeholder="Search warehouse..."
            value={warehouseSearch}
            onChange={(e) => {
              setWarehouseSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />

          {warehouseSearch && showDropdown && filteredWarehouses.length > 0 && (
            <ul className="absolute w-full bg-white border border-gray-300 mt-1 max-h-40 overflow-y-auto z-10">
              {filteredWarehouses.map((warehouse) => (
                <li
                  key={warehouse._id}
                  onClick={() => {
                    setSelectedWarehouse(warehouse);
                    setWarehouseSearch(warehouse.name);
                    setShowDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                >
                  {warehouse.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-base text-gray-950 font-medium mb-2">
          Product:
        </label>
        <div className="relative">
          <input
            type="text"
            className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 mb-2 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
            placeholder="Search product..."
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />

          {productSearch && showDropdown && filteredProducts.length > 0 && (
            <ul className="absolute w-full bg-white border border-gray-300 mt-1 max-h-40 overflow-y-auto z-10">
              {filteredProducts.map((product) => (
                <li
                  key={product._id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setProductSearch(product.name);
                    setShowDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                >
                  {product.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleRemoveProduct}
          disabled={loading}
          className="bg-red-500 w-48 text-white px-4 py-2 mx-auto rounded hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Removing..." : "Remove Product"}
        </button>
      </div>
    </div>
  );
};

export default WarehouseProductForm;

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/app/types/product";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import Spinner from "../Spinner";

//LOGIC TO FETCH PRODUCTS FROM BACKEND API
const fetchProducts = async (token: string) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    next: {
      revalidate: 60,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch orders: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
};

interface OrderProduct {
  productId: string;
  quantity: number;
}

//LOGIC TO CREATE NEW ORDER
const OrderForm: React.FC = () => {
  const router = useRouter();
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const { state } = useAuthContext();

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    const loadProducts = async () => {
      try {
        if (!state.token) {
          throw new Error("No authentication token available");
        }
        const products = await fetchProducts(state.token);
        setAvailableProducts(products);
      } catch (error) {
        setMessage({
          text:
            error instanceof Error ? error.message : "Failed to load products",
          isError: true,
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [state.isAuthenticated, state.token, router]);

  //Filter products based on search term
  const filteredProducts = useMemo(() => {
    return availableProducts.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableProducts, searchTerm]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    const product = availableProducts.find((p) => p._id === productId);
    if (!product || quantity > product.quantity) {
      setMessage({
        text: "Quantity exceeds available stock",
        isError: true,
      });
      return;
    }

    setSelectedProducts((prev) => {
      //Remove product if quantity is 0
      if (quantity === 0) {
        return prev.filter((p) => p.productId !== productId);
      }
      const existing = prev.find((p) => p.productId === productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === productId ? { ...p, quantity } : p
        );
      }
      return [...prev, { productId, quantity }];
    });
    setMessage(null);
  };

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    //Filter out any products with quantity 0 and format for backend
    const orderProducts = selectedProducts.filter((p) => p.quantity > 0);

    if (orderProducts.length === 0) {
      throw new Error("Please select at least one product");
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify({
            products: selectedProducts,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      setMessage({
        text: `Order #${data.orderNumber} created successfully!`,
        isError: false,
      });

      //Reset form and redirect after success
      setSelectedProducts([]);
      setTimeout(() => {
        router.push("/orders");
      }, 2000);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "An error occurred",
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (isLoadingProducts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4 sm:mb-6">Create New Order</h1>
      {/* Search Input */}
      <div className="mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {message && (
        <div
          className={`p-3 sm:p-4 mb-4 sm:mb-6 rounded ${
            message.isError
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <div className="min-w-full">
            {/* Desktop Table View */}
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 sm:px-6 py-3 text-left text-gray-500">
                    Product
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-gray-500">
                    Available
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-gray-500">
                    Price
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-gray-500">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 sm:px-6 py-4 text-center text-gray-500"
                    >
                      {searchTerm
                        ? "No products found matching your search"
                        : "No products available"}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id}>
                      <td className="px-4 sm:px-6 py-4">{product.name}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-500">
                        {product.quantity}
                      </td>
                      <td className="px-4 sm:px-6 py-4">${product.price}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          max={product.quantity}
                          className="w-20 px-2 py-1 border rounded"
                          onChange={(e) => {
                            const value = e.target.value;
                            const quantity = value === "" ? 0 : parseInt(value);
                            handleQuantityChange(product._id, quantity);
                          }}
                          value={
                            selectedProducts.find(
                              (p) => p.productId === product._id
                            )?.quantity || ""
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <div className="px-4 py-4 text-center text-gray-500">
                  {searchTerm
                    ? "No products found matching your search"
                    : "No products available"}
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product._id} className="p-4 space-y-2">
                    <div className="font-medium">{product.name}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-500">Available:</div>
                      <div>{product.quantity}</div>
                      <div className="text-gray-500">Price:</div>
                      <div>${product.price}</div>
                      <div className="text-gray-500">Quantity:</div>
                      <div>
                        <input
                          type="number"
                          min="0"
                          max={product.quantity}
                          className="w-20 px-2 py-1 border rounded"
                          onChange={(e) => {
                            const value = e.target.value;
                            const quantity = value === "" ? 0 : parseInt(value);
                            handleQuantityChange(product._id, quantity);
                          }}
                          value={
                            selectedProducts.find(
                              (p) => p.productId === product._id
                            )?.quantity || ""
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || selectedProducts.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700
                 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Order..." : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;

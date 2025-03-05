"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Product } from "@/app/types/product";
import { Order } from "@/app/types/order";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import Spinner from "@/app/components/Spinner";

//LOGIC TO CONNECT TO THE BACKEND SERVER
const fetchOrderData = async (id: string, token: string): Promise<Order> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: {
      revalidate: 60,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch order: ${res.statusText}`);
  const data = await res.json();
  return data;
};

//Fetch Products from the Backend Server
const fetchProductsData = async (token: string): Promise<Product[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: {
      revalidate: 60,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.statusText}`);
  const data = await res.json();
  return data;
};

interface OrderProduct {
  productId: string;
  quantity: number;
}

interface EditOrderFormProps {
  order: Order;
  availableProducts: Product[];
}

//LOGIC TO EDIT EXISTING ORDER DATA
const EditOrderForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [orderStatus, setOrderStatus] = useState("");
  const { state } = useAuthContext();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const id = params.id as string;

  //Fetch the existing order if order(Id) is provided
  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    const fetchOrder = async () => {
      try {
        const order = await fetchOrderData(id, state.token || "");
        setSelectedProducts(order.products);
        setOrderStatus(order.status);
      } catch (error: any) {
        setMessage({
          text: `Failed to fetch order details: ${error.message}`,
          isError: true,
        });
      }
    };
    fetchOrder();
  }, [id, state.isAuthenticated, state.token, router]);

  useEffect(() => {
    //Fetch available products from the API
    const fetchProducts = async () => {
      try {
        const products = await fetchProductsData(state.token || "");
        setAvailableProducts(products);
      } catch (error: any) {
        setMessage({ text: "Failed to fetch products", isError: true });
      }
    };

    fetchProducts();
  }, [state.token]);

  //Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!availableProducts || availableProducts.length === 0) {
      return [];
    }
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
      const existing = prev.find((p) => p.productId === productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === productId ? { ...p, quantity } : p
        );
      }
      return [...prev, { productId, quantity }];
    });
  };

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`,
        {
          method: "PUT",
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
        throw new Error(data.error || "Failed to update order");
      }
      setMessage({
        text: `Order #${data.orderNumber} updated successfully!`,
        isError: false,
      });

      //Redirect after success
      setTimeout(() => {
        router.push("/orders");
      }, 1000);
    } catch (error: any) {
      setMessage({
        text: error instanceof Error ? error.message : "An error occurred",
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  //LOGIC TO CANCEL ORDER
  const handleCancelOrder = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/cancel-order/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }
      setMessage({
        text: "Order canceled successfully!",
        isError: false,
      });

      //Redirect after success
      setTimeout(() => {
        router.push("/orders");
      }, 2000);
    } catch (error: any) {
      setMessage({
        text: error instanceof Error ? error.message : "An error occurred",
        isError: true,
      });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Edit Order</h1>

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
          className={`p-3 sm:p-4 mb-4 sm:mb-6 rounded text-sm sm:text-base ${
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
        {/* Table for larger screens */}
        <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm text-gray-500">
                  Product
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm text-gray-500">
                  Available
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm text-gray-500">
                  Price
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm text-gray-500">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 sm:px-6 py-4 text-center text-gray-500 text-sm"
                  >
                    {searchTerm
                      ? "No products found matching your search"
                      : "No products available"}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      {product.name}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                      {product.quantity}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      ${product.price}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        max={product.quantity}
                        className="w-20 px-2 py-1 border rounded text-sm"
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
        </div>

        {/* Card layout for mobile screens */}
        <div className="sm:hidden space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              {searchTerm
                ? "No products found matching your search"
                : "No products available"}
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-lg shadow p-4 space-y-2"
              >
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-gray-500">
                  Available: {product.quantity}
                </div>
                <div className="text-sm">${product.price}</div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Quantity:</label>
                  <input
                    type="number"
                    min="0"
                    max={product.quantity}
                    className="w-20 px-2 py-1 border rounded text-sm"
                    onChange={(e) => {
                      const value = e.target.value;
                      const quantity = value === "" ? 0 : parseInt(value);
                      handleQuantityChange(product._id, quantity);
                    }}
                    value={
                      selectedProducts.find((p) => p.productId === product._id)
                        ?.quantity || ""
                    }
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <button
            type="submit"
            disabled={isLoading || selectedProducts.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded text-sm 
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating Order..." : "Update Order"}
          </button>

          {orderStatus !== "Delivered" &&
            orderStatus !== "Out For Delivery" && (
              <button
                type="button"
                onClick={handleCancelOrder}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                {isLoading ? "Cancelling Order..." : "Cancel Order"}
              </button>
            )}
        </div>
      </form>
    </div>
  );
};

export default EditOrderForm;

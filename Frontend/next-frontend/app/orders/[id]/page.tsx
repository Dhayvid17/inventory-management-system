"use client";

import Spinner from "@/app/components/Spinner";
import { Order } from "@/app/types/order";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NotFound from "../not-found";
import { useAuthContext } from "@/app/hooks/useAuthContext";

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE ORDER DETAILS FROM THE BACKEND SERVER
async function getOrderDetail(id: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    next: {
      revalidate: 60,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch order: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

//COLOR FOR ORDER STATUS
const statusColors = {
  "Order Received": "bg-blue-100 text-blue-800",
  Processing: "bg-yellow-100 text-yellow-800",
  "Out For Delivery": "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

//LOGIC TO DISPLAY EACH ORDER DETAIL PAGE
export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { state } = useAuthContext();
  const router = useRouter();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const isAdmin = state.user?.role === "admin";

  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!state.isAuthenticated) {
        router.push("/users/login"); //Redirect to login if not authenticated
        return;
      }
      if (!isStaffAdmin) {
        setError("You are not authorized to edit this category.");
        return;
      }
      try {
        const data = await getOrderDetail(id, state.token || "");
        setOrder(data);
      } catch (error: any) {
        setOrder(null);
        setError(error.message);
        console.error("Error fetching order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id, state.isAuthenticated, isStaffAdmin, state.token, router]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this order?")) {
      setIsDeleting(true);
      if (!isAdmin) {
        setError("You are not authorized to delete order");
        return;
      }
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
        });
        alert("Order deleted successfully!");
        router.push("/orders");
        router.refresh();
      } catch (error: any) {
        console.error("Error deleting order:", error);
        alert(`Error deleting order: ${error.message}`);
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

  //DISPLAY ERROR MESSAGE
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md max-w-md mx-auto relative"
          role="alert"
        >
          <strong className="font-bold text-lg">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
          <button
            className="absolute top-2 right-2 text-red-500 hover:text-red-700 focus:outline-none"
            onClick={() => {
              /* Add your close handler here */
            }}
            aria-label="Close error message"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 10-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 101.414 1.414L10 11.414l2.934 2.934a1 1 0 001.414-1.414L11.414 10l2.934-2.934a1 1 0 000-1.414z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  //LOGIC TO DISPLAY NOT-FOUND IF WAREHOUSE DATA RETURN NULL
  if (!order) {
    return <NotFound />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-6">
        {/* Order Information */}
        <div className="flex flex-col space-y-3 sm:space-y-4">
          {/* Username */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="font-bold">Order Username:</span>
            <span className="text-gray-800">{order.user.username}</span>
          </h1>

          {/* Total Price */}
          <div className="text-sm sm:text-base lg:text-lg text-gray-700 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="font-bold">Order Total Price:</span>
            <span>💲{order.totalPrice.toFixed(2)}</span>
          </div>

          {/* Total Quantity */}
          <div className="text-sm sm:text-base lg:text-lg text-gray-700 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="font-bold">Order Total Quantity:</span>
            <span>{order.totalQuantity}</span>
          </div>

          {/* Order Number */}
          <div className="text-sm sm:text-base lg:text-lg text-gray-700 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="font-bold">Order Number:</span>
            <span>{order.orderNumber}</span>
          </div>

          {/* Order Status */}
          <div
            className={`text-base sm:text-xl lg:text-2xl p-2 rounded flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 ${
              statusColors[order.status as keyof typeof statusColors]
            }`}
          >
            <span className="font-bold">Order Status:</span>
            <span>{order.status}</span>
          </div>

          {/* Order Products */}
          <div className="mt-4 sm:mt-6">
            <div className="text-sm sm:text-base lg:text-lg text-gray-700">
              <span className="font-bold block mb-3">Orders:</span>
              <ul className="space-y-4">
                {order.products.map((product, index) => (
                  <li key={product.productId} className="border-b-2 pb-3">
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="font-bold">Product Name:</span>
                        <span>{product.name}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="font-bold">Product Price:</span>
                        <span>{product.price.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="font-bold">Product Quantity:</span>
                        <span>{product.quantity}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-0 sm:self-start">
          <Link
            href={`/orders/${id}/edit`}
            className="px-4 sm:px-6 py-2 bg-blue-500 text-white text-center rounded hover:bg-blue-600 transition-colors text-sm sm:text-base"
          >
            Edit
          </Link>
          <Link
            href={`/orders/${id}/update-order-status`}
            className="px-4 sm:px-6 py-2 bg-green-500 text-white text-center rounded hover:bg-green-600 transition-colors text-sm sm:text-base"
          >
            Update Order Status
          </Link>
          <button
            onClick={handleDelete}
            className={`px-4 sm:px-6 py-2 bg-red-500 text-white text-center rounded hover:bg-red-600 transition-colors text-sm sm:text-base
              ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

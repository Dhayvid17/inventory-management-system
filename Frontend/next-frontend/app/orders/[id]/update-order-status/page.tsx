"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Order } from "@/app/types/order";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import Spinner from "@/app/components/Spinner";

//LOGIC TO CONNECT TO THE BACKEND SERVER
const fetchOrderData = async (id: string, token: string): Promise<Order> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    next: {
      revalidate: 60,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.statusText}`);
  const data = await res.json();
  return data;
};

const updateOrderStatus = async (id: string, token: string, status: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/orders/status/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );
  if (!res.ok)
    throw new Error(`Failed to update order status: ${res.statusText}`);
  const data = await res.json();
  return data;
};

//LOGIC TO UPDATE EXISTING ORDER DATA
const OrderStatusForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { state } = useAuthContext();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const id = params.id;

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    if (!isStaffAdmin) {
      setMessage({
        text: "You are not authorized to update this order.",
        isError: true,
      });
      return;
    }
    const fetchOrder = async () => {
      try {
        const orderData = await fetchOrderData(id as string, state.token || "");
        setOrder(orderData);
        setNewStatus(orderData.status);
      } catch (error) {
        setMessage({
          text: "Failed to fetch order details",
          isError: true,
        });
      }
    };
    fetchOrder();
  }, [id, state.isAuthenticated, state.token, isStaffAdmin, router]);

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const updatedOrder = await updateOrderStatus(
        id as string,
        state.token || "",
        newStatus
      );
      setMessage({
        text: `Order status updated to ${updatedOrder.status} successfully!`,
        isError: false,
      });

      //Redirect after success
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

  //DISPLAY ERROR MESSAGE IF THE USER IS NOT STAFF/ADMIN
  if (!isStaffAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">
            You are not authorized to update this category.
          </span>
        </div>
      </div>
    );
  }

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Update Order Status</h1>

      {message && (
        <div
          className={`p-4 mb-6 rounded ${
            message.isError
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {order && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <label className="block text-gray-700 font-medium">
                Current Status
              </label>
              <p className="text-gray-500">{order.status}</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Order Received">Order Received</option>
                <option value="Processing">Processing</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex justify-between">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Updating Status..." : "Update Status"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default OrderStatusForm;

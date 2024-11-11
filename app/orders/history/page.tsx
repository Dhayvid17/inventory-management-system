"use client";

import React, { useEffect, useState } from "react";
import Spinner from "@/app/components/Spinner";
import { Order } from "@/app/types/order";

//LOGIC TO GET THE ORDER HISTORY DETAILS FROM THE BACKEND SERVER
const fetchOrderHistory = async (): Promise<Order[]> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/orders/user/history`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      next: { revalidate: 60 },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch order history");
  const data = await res.json();
  return data;
};

//LOGIC TO FETCH USER ORDER HISTORY
const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await fetchOrderHistory();
        setOrders(data);
      } catch (error) {
        setMessage("Failed to fetch order history");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (message) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{message}</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Order History</h1>
      {orders.length === 0 ? (
        <p className="text-lg text-gray-700">No orders found.</p>
      ) : (
        orders.map((order) => (
          <div
            key={order._id}
            className="mb-6 p-4 bg-white rounded-lg shadow-md"
          >
            <h2 className="text-xl font-bold mb-2">
              Order #{order.orderNumber}
            </h2>
            <p className="text-lg mb-2">
              <strong>Total Price: </strong>💲{order.totalPrice.toFixed(2)}
            </p>
            <p className="text-lg mb-2">
              <strong>Total Quantity: </strong>
              {order.totalQuantity}
            </p>
            <p
              className={`text-lg font-semibold mb-2 ${
                order.status === "Cancelled"
                  ? "text-red-500"
                  : order.status === "Delivered"
                  ? "text-green-500"
                  : order.status === "Out For Delivery"
                  ? "text-yellow-500"
                  : "text-blue-500"
              }`}
            >
              <strong>Status: </strong>
              {order.status}
            </p>
            <p className="text-lg mb-2">
              <strong>Username: </strong>
              {order.user.username}
            </p>
            <ul className="text-lg">
              {order.products.map((product) => (
                <li key={product.productId} className="mb-2">
                  <p>
                    <strong>Product: </strong>
                    {product.name}
                  </p>
                  <p>
                    <strong>Price: </strong>${product.price.toFixed(2)}
                  </p>
                  <p>
                    <strong>Quantity: </strong>
                    {product.quantity}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default OrderHistoryPage;

"use client";

import { OrderNotification } from "@/app/types/notification";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Spinner from "../Spinner";
import { useAuthContext } from "@/app/hooks/useAuthContext";

//LOGIC TO FETCH ORDER NOTIFICATIONS FROM BACKEND SERVER
const fetchOrderNotifications = async (token: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/order-notification`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 0,
      },
    }
  );
  if (!res.ok)
    throw new Error(`Failed to fetch order notifications: ${res.statusText}`);
  const data = await res.json();
  return data;
};

//LOGIC TO FETCH THE BACKEND SERVER FOR MARK ORDER NOTIFICATION AS READ
const markOrderNotificationAsRead = async (id: string, token: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/order-notification/${id}/read`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to mark notification as read: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
};

//LOGIC TO DISPLAY ORDER NOTIFICATION LIST
const OrderNotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { state } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (state.isLoading) return; //Wait until loading is false

    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    const fetchNotifications = async () => {
      try {
        const data = await fetchOrderNotifications(state.token || "");
        setNotifications(data);
      } catch (error: any) {
        setError(`Failed to fetch notifications: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [state.isAuthenticated, state.token, router]);

  const handleMarkAsRead = async (id: string, token: string) => {
    try {
      await markOrderNotificationAsRead(id, state.token || "");
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error: any) {
      setError(`Failed to mark notification as read: ${error.message}`);
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

  //LOGIC TO DISPLAY ERROR IF DATA RETURN NULL
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <ul>
      {notifications.map((notification) => (
        <li key={notification._id} className="mb-4 p-4 border rounded shadow">
          <div className="text-lg font-semibold">{notification.type}</div>
          <div className="text-gray-600">{notification.message}</div>
          <div
            className={`text-sm ${
              notification.isRead ? "text-green-600" : "text-red-600"
            }`}
          >
            {notification.isRead ? "Read" : "Unread"}
          </div>
          <div className="text-sm text-gray-600">
            Username:{" "}
            {notification.staffId?.username || notification.userId?.username}
          </div>
          <div className="text-sm text-gray-400">
            {new Date(notification.createdAt).toLocaleString()}
          </div>
          <div>
            <Link href={`/order-notification/${notification._id}`} passHref>
              <button
                onClick={() =>
                  handleMarkAsRead(notification._id, state.token || "")
                }
                className="ml-4 px-4 py-2 mt-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                View Details
              </button>
            </Link>
          </div>
        </li>
      ))}
      {notifications.length === 0 && (
        <li className="p-4 text-gray-500 text-center">No results found</li>
      )}
    </ul>
  );
};

export default OrderNotificationList;

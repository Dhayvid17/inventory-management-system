"use client";

import Spinner from "@/app/components/Spinner";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Notification, OrderNotification } from "@/app/types/notification";
import NotFound from "../not-found";
import { useAuthContext } from "@/app/hooks/useAuthContext";

interface OrderNotificationDetailPageProps {
  params: Promise<{ id: string }>;
}

//LOGIC TO GET THE ORDER NOTIFICATION DETAILS FROM THE BACKEND SERVER
async function getOrderNotificationDetail(id: string, token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/order-notification/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok)
    throw new Error(
      `Failed to fetch notification details from backend: ${res.statusText}`
    );
  const data = await res.json();
  return data;
}

//LOGIC TO DISPLAY EACH NOTIFICATION DETAILS PAGE
export default function NotificationDetailPage({
  params,
}: OrderNotificationDetailPageProps) {
  const [notification, setNotification] = useState<OrderNotification | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { state } = useAuthContext();
  const router = useRouter();

  //unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchOrderNotification = async () => {
      if (!state.isAuthenticated) {
        router.push("/users/login"); //Redirect to login if not authenticated
        return;
      }
      try {
        const data = await getOrderNotificationDetail(id, state.token || "");
        setNotification(data);
      } catch (error: any) {
        setNotification(null);
        setError(error.message);
        console.error(`Error fetching notification: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderNotification();
  }, [id, state.isAuthenticated, state.token, router]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this notification?")) {
      setIsDeleting(true);
      if (!state.isAuthenticated) {
        router.push("/users/login"); //Redirect to login if not authenticated
      }
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notification/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token || ""}`,
          },
        });
        alert("Notification deleted successfully!");
        router.push("/order-notification");
        router.refresh();
      } catch (error: any) {
        console.error("Error deleting notification:", error);
        alert(`Error deleting notification: ${error.message}`);
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

  //LOGIC TO DISPLAY NOT-FOUND IF NOTIFICATION DATA RETURN NULL
  if (!notification) {
    return <NotFound />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 bg-gray-50 min-h-screen flex flex-col items-center">
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-4 gap-4 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
            Notification Details
          </h1>
          <button
            onClick={handleDelete}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors duration-200 ${
              isDeleting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="break-words">
            <h2 className="text-lg sm:text-xl font-bold text-gray-700">
              <span className="block sm:inline">Username:</span>{" "}
              <span className="text-gray-600 break-all">
                {notification.staffId?.username ||
                  notification.userId?.username}
              </span>
            </h2>
          </div>

          <div className="text-gray-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <strong className="min-w-[100px]">Type:</strong>
              <span className="text-gray-600">{notification.type}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
              <strong className="min-w-[100px]">Message:</strong>
              <span className="text-gray-600 break-words">
                {notification.message}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <strong className="min-w-[100px]">Read Status:</strong>
              <span className="text-gray-600">
                {notification.isRead ? "Read" : "Unread"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <strong className="min-w-[100px]">Created At:</strong>
              <span className="text-gray-600">
                {new Date(notification.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

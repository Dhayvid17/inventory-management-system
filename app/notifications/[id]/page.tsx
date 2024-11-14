"use client";

import Spinner from "@/app/components/Spinner";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NotFound from "../not-found";
import { Notification } from "@/app/types/notification";

interface NotificationDetailPageProps {
  params: Promise<{ id: string }>;
}

//LOGIC TO GET THE NOTIFICATION DETAILS FROM THE BACKEND SERVER
async function getNotificationDetail(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}`,
    {
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok)
    throw new Error("Failed to fetch notification details from backend");
  const data = await res.json();
  return data;
}

//LOGIC TO DISPLAY EACH NOTIFICATION DETAILS PAGE
export default function NotificationDetailPage({
  params,
}: NotificationDetailPageProps) {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  //unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const data = await getNotificationDetail(id);
        setNotification(data);
      } catch (error) {
        setNotification(null);
        console.error("Error fetching notification:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotification();
  }, [id]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this notification?")) {
      setIsDeleting(true);
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}`, {
          method: "DELETE",
        });
        alert("Notification deleted successfully!");
        router.push("/notifications");
        router.refresh();
      } catch (error) {
        console.error("Error deleting notification:", error);
        alert("Error deleting notification");
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

  //LOGIC TO DISPLAY NOT-FOUND IF NOTIFICATION DATA RETURN NULL
  if (!notification) {
    return <NotFound />;
  }

  return (
    <div className="p-10 bg-gray-50 min-h-screen flex flex-col items-center">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h1 className="text-3xl font-semibold text-gray-800">
            Notification Details
          </h1>
          <button
            onClick={handleDelete}
            className={`px-6 py-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors duration-200 ${
              isDeleting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-700">
              <strong>Username:</strong>{" "}
              <span className="text-gray-600">
                {notification.staffId?.username ||
                  notification.userId?.username}
              </span>
            </h2>
          </div>

          <div className="text-gray-700">
            <p className="mb-2">
              <strong>Type:</strong>{" "}
              <span className="text-gray-600">{notification.type}</span>
            </p>
            <p className="mb-2">
              <strong>Message:</strong>{" "}
              <span className="text-gray-600">{notification.message}</span>
            </p>
            <p className="mb-2">
              <strong>Read Status:</strong>{" "}
              <span className="text-gray-600">
                {notification.isRead ? "Read" : "Unread"}
              </span>
            </p>
            <p className="mb-2">
              <strong>Created At:</strong>{" "}
              <span className="text-gray-600">
                {new Date(notification.createdAt).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

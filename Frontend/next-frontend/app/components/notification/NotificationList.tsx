import { Notification } from "@/app/types/notification";
import Link from "next/link";
import React from "react";

interface NotificationListProps {
  notifications: Notification[];
}

//LOGIC TO DISPLAY ORDER NOTIFICATION LIST
const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
}) => {
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
          <Link
            href={`/notifications/${notification._id}`}
            className="mt-4 text-blue-500 hover:underline"
          >
            <p>Click here to see Notification Details</p>
          </Link>
        </li>
      ))}
      {notifications.length === 0 && (
        <li className="p-4 text-gray-500 text-center">No results found</li>
      )}
    </ul>
  );
};

export default NotificationList;

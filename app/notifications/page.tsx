import React, { Suspense } from "react";
import Spinner from "../components/Spinner";
import NotificationList from "../components/notification/NotificationList";

//LOGIC TO FETCH NOTIFICATIONS FROM BACKEND SERVER
const fetchNotifications = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
    next: {
      revalidate: 0,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  const data = await res.json();
  return data;
};

//LOGIC TO DISPLAY THE NOTIFICATION PAGE
const notificationsPage: React.FC = async () => {
  const notifications = await fetchNotifications();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <Suspense fallback={<Spinner />}>
        <NotificationList notifications={notifications} />
      </Suspense>
    </div>
  );
};

export default notificationsPage;

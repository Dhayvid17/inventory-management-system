import React, { Suspense } from "react";
import Spinner from "../components/Spinner";
import OrderNotificationList from "../components/notification/OrderNotificationList";

//LOGIC TO DISPLAY THE ORDER NOTIFICATION PAGE
const OrderNotificationsPage: React.FC = async () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <OrderNotificationList />
    </div>
  );
};

export default OrderNotificationsPage;

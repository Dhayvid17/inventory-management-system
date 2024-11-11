import React, { Suspense } from "react";
import Spinner from "../components/Spinner";
import Link from "next/link";
import OrderList from "../components/order/OrderList";

//LOGIC TO FETCH SUPPLIERS FROM BACKEND SERVER
const fetchOrders = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
    next: {
      revalidate: 0,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch Orders");
  const data = await res.json();
  return data;
};

//LOGIC TO DISPLAY ALL ORDERS
const OrdersPage: React.FC = async () => {
  const orders = await fetchOrders();

  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Link
          href="/orders/create"
          className="bg-blue-600 text-white font-medium border border-blue-600 hover:bg-blue-950 transition duration-200 ease-in-out px-4 py-2 rounded"
        >
          Add New Order
        </Link>
      </div>
      <Suspense fallback={<Spinner />}>
        <OrderList orders={orders} />
      </Suspense>
    </main>
  );
};

export default OrdersPage;

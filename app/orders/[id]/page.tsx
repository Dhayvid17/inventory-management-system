"use client";

import Spinner from "@/app/components/Spinner";
import { Order } from "@/app/types/order";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NotFound from "../not-found";

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE ORDER DETAILS FROM THE BACKEND SERVER
async function getOrderDetail(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
    next: {
      revalidate: 60,
    },
  });
  if (!res.ok) {
    return null;
  }
  const data = res.json();
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
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderDetail(id);
        setOrder(data);
      } catch (error) {
        setOrder(null);
        console.error("Error fetching order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this order?")) {
      setIsDeleting(true);
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
          method: "DELETE",
        });
        alert("Order deleted successfully!");
        router.push("/orders");
        router.refresh();
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Error deleting order");
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

  //LOGIC TO DISPLAY NOT-FOUND IF WAREHOUSE DATA RETURN NULL
  if (!order) {
    return <NotFound />;
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-4">
            <strong>Order Username: </strong>
            {order.user.username}
          </h1>
          <span className="text-gray-700 text-lg mb-2">
            <strong>Order Total Price: </strong>
            💲{order.totalPrice.toFixed(2)}
          </span>
          <span className="text-gray-700 text-lg mb-2">
            <strong>Order Total Quantity: </strong>
            {order.totalQuantity}
          </span>
          <span className="text-gray-700 text-lg mb-2">
            <strong>Order Number: </strong>
            {order.orderNumber}
          </span>
          <span
            className={`text-2xl mb-2 p-2 rounded ${
              statusColors[order.status as keyof typeof statusColors]
            }`}
          >
            <strong>Order Status: </strong>
            {order.status}
          </span>

          <div className="mt-6">
            <div className="text-gray-700 text-lg">
              <strong>Orders: </strong>
              <ul>
                {order.products.map((product, index) => (
                  <li
                    key={product.productId}
                    className="text-gray-700 text-lg block mb-4 border-b-2 pb-2"
                  >
                    <span className="text-gray-700 text-lg block">
                      <strong>Product Name: </strong>
                      {product.name}
                    </span>
                    <span className="text-gray-700 text-lg block">
                      <strong>Product Price: </strong>
                      {product.price.toFixed(2)}
                    </span>
                    <span className="text-gray-700 text-lg block">
                      <strong>Product Quantity: </strong>
                      {product.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="flex space-x-4 justify-items-start items-baseline">
          <Link
            href={`/orders/${id}/edit`}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Edit
          </Link>
          <Link
            href={`/orders/${id}/update-order-status`}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            Update Order Status
          </Link>
          <button
            onClick={handleDelete}
            className={`px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ${
              isDeleting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting.." : "Delete Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

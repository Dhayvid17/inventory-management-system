import React from "react";
import Link from "next/link";
import { Order } from "@/app/types/order";

interface OrderListProps {
  orders: Order[];
}

//LOGIC TO LIST ORDERS
const OrderList: React.FC<OrderListProps> = ({ orders }) => (
  <ul className="space-y-4">
    {orders.map((order) => (
      <li key={order._id} className="p-4 border-b border-gray-400">
        <Link
          href={`/orders/${order._id}`}
          className="text-lg font-medium text-blue-600 hover:text-blue-950"
        >
          {order.user.username}
        </Link>
      </li>
    ))}
    {orders.length === 0 && (
      <li className="p-4 text-gray-500 text-center">No results found</li>
    )}
  </ul>
);

export default OrderList;

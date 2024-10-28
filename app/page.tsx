import type { Metadata } from "next";
import React from "react";

//USE METADATA TO SET THE PAGE TITLE
export const metadata: Metadata = {
  title: "Inventory Management System",
  description: "Home Page",
};

//LOGIC FOR INVENTORY HOME COMPONENT
const Home: React.FC = () => {
  return (
    <main className="flex flex-col items-center justify-center text-center p-8 mt-10">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        Welcome to the Inventory Management System
      </h1>
      <p className="text-gray-700 text-lg max-w-prose mb-8">
        This system helps you efficiently manage categories, warehouses,
        suppliers, products, and inventory transactions. Track and update your
        stock levels, manage suppliers, and view detailed transaction histories.
      </p>
    </main>
  );
};

export default Home;

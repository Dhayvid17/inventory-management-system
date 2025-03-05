"use client";

import type { Metadata } from "next";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "./hooks/useAuthContext";
import Spinner from "./components/Spinner";
import {
  Box,
  Package,
  Warehouse,
  Users,
  Bell,
  ShoppingCart,
  Truck,
  Layout,
  ArrowRightLeft,
  ClipboardList,
  UserCheck,
  PlusSquare,
  MinusSquare,
  History,
  UserPlus,
  BarChart3,
  Boxes,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

//USE METADATA TO SET THE PAGE TITLE
const metadata: Metadata = {
  title: "Inventory Management System",
  description: "Home Page",
};

//LOGIC FOR INVENTORY HOME COMPONENT
const Home: React.FC = () => {
  const router = useRouter();
  const { state } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const isAdmin = state.user?.role === "admin";
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    recentTransactions: 0,
  });

  useEffect(() => {
    if (state.isLoading) return;

    if (!state.isAuthenticated) {
      router.push("/users/login");
      return;
    }
    //Fetch DashBoard Stats from Backend API
    const fetchDashboardStats = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`,
          {
            headers: {
              Authorization: `Bearer ${state.token}`,
            },
          }
        );
        if (!res.ok) {
          if (res.status === 401) {
            //Token might be invalid/expired
            router.push("/users/login");
            return;
          }
          throw new Error(`Failed to fetch DashBoard Stats: ${res.statusText}`);
        }
        const data = await res.json();
        setDashboardStats(data);
      } catch (error: any) {
        setError(error.message);
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setIsStatsLoading(false);
      }
    };
    if (state.isAuthenticated && !state.isLoading) {
      fetchDashboardStats();
    }
  }, [
    state.isLoading,
    state.isAuthenticated,
    router,
    isAdmin,
    isStaffAdmin,
    state.token,
  ]);

  //Menu Items Listed
  const menuItems = {
    primary: [
      {
        title: "Products",
        icon: <Package className="w-8 h-8" />,
        description: "Browse and manage product catalog",
        link: "/products",
        access: "all",
      },
      {
        title: "Order Product(s)",
        icon: <ShoppingCart className="w-8 h-8" />,
        description: "Place new orders for products",
        link: "/orders",
        access: "all",
      },
      {
        title: "Order History",
        icon: <History className="w-8 h-8" />,
        description: "View your order history",
        link: "/orders/user/history",
        access: "all",
      },
      {
        title: "Record Transactions",
        icon: <Box className="w-8 h-8" />,
        description: "Record, track inventory transactions and stock levels",
        link: "/inventory-transactions/create",
        access: "isStaffAdmin",
      },
    ],
    secondary: [
      {
        title: "Categories",
        icon: <Layout className="w-6 h-6" />,
        link: "/categories",
        access: "isStaffAdmin",
      },
      {
        title: "Get All Transactions",
        icon: <ClipboardList className="w-6 h-6" />,
        description: "View and manage all inventory transactions",
        link: "/inventory-transactions",
        access: "isStaffAdmin",
      },
      {
        title: "Warehouses",
        icon: <Warehouse className="w-6 h-6" />,
        link: "/warehouses",
        access: "isStaffAdmin",
      },
      {
        title: "Suppliers",
        icon: <Truck className="w-6 h-6" />,
        link: "/suppliers",
        access: "isStaffAdmin",
      },
      {
        title: "Register User",
        icon: <UserPlus className="w-6 h-6" />,
        link: "users/register",
        access: "isAdmin",
      },
      {
        title: "Staff Management",
        icon: <UserCheck className="w-6 h-6" />,
        link: "/staff-assignments",
        access: "isAdmin",
      },
      {
        title: "User Management",
        icon: <Users className="w-6 h-6" />,
        link: "/users",
        access: "isAdmin",
      },
      {
        title: "Transfer Requests",
        icon: <ArrowRightLeft className="w-6 h-6" />,
        link: "/transfer-request",
        access: "isStaffAdmin",
      },
      {
        title: "Notifications",
        icon: <Bell className="w-6 h-6" />,
        link: "/notifications",
        access: "isStaffAdmin",
      },
      {
        title: "Add to Warehouse",
        icon: <PlusSquare className="w-6 h-6" />,
        link: "/warehouses/add/product",
        access: "isStaffAdmin",
      },
      {
        title: "Remove from Warehouse",
        icon: <MinusSquare className="w-6 h-6" />,
        link: "/warehouses/remove/product",
        access: "isStaffAdmin",
      },
      {
        title: "Create Staff/Admin",
        icon: <UserPlus className="w-6 h-6" />,
        description: "Register new staff or admin users",
        link: "/users/register",
        access: "isAdmin",
      },
    ],
  };

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (state.isLoading) {
    return <Spinner />;
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

  //LOGIC TO SHOW MENU BASED ON USER ROLE
  const shouldShowMenuItem = (access: string) => {
    if (access === "all") return true;
    if (access === "isStaffAdmin") return isStaffAdmin;
    if (access === "isAdmin") return isAdmin;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Inventory Management System
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Streamline your inventory operations with our comprehensive
            management system. Track products, manage orders, and monitor stock
            levels all in one place. This system helps you efficiently manage
            your inventory, reducing costs and improving customer satisfaction.
          </p>

          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            It also provides a user-friendly interface for staff to manage their
            assignments and track their work. Additionally, it includes a user
            management system for administrators to manage user roles and
            permissions.
          </p>
        </div>

        {isStaffAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {isStatsLoading ? (
              <>
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="bg-white p-6 rounded-lg shadow-md animate-pulse"
                  >
                    <div className="h-12 w-12 bg-gray-300 rounded-full mb-4"></div>
                    <div className="h-6 bg-gray-200 mb-2 w-3/4"></div>
                    <div className="h-8 bg-gray-100 w-1/2"></div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                  <Boxes className="w-12 h-12 text-blue-600 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Total Products
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats.totalProducts}
                    </p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                  <TrendingUp className="w-12 h-12 text-red-600 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Low Stock Items
                    </h3>
                    <p className="text-2xl font-bold text-red-900">
                      {dashboardStats.lowStockItems}
                    </p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                  <BarChart3 className="w-12 h-12 text-green-600 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Recent Transactions
                    </h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats.recentTransactions}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Primary Features Grid */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Quick Access
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {menuItems.primary
              .filter((item) => shouldShowMenuItem(item.access))
              .map((item) => (
                <Link
                  href={item.link}
                  key={item.title}
                  className="relative group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="text-blue-600 mb-4">{item.icon}</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>

        {/* Secondary Features */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Additional Features
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {menuItems.secondary
              .filter((item) => shouldShowMenuItem(item.access))
              .map((item) => (
                <Link
                  href={item.link}
                  key={item.title}
                  className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="text-gray-600">{item.icon}</div>
                  <span className="mt-2 text-sm font-medium text-gray-900">
                    {item.title}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;

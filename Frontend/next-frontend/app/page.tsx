// "use client";

// import type { Metadata } from "next";
// import React from "react";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useAuthContext } from "./hooks/useAuthContext";
// import Spinner from "./components/Spinner";
// import { motion } from "framer-motion";
// import {
//   Box,
//   Package,
//   Warehouse,
//   Users,
//   Bell,
//   ShoppingCart,
//   Truck,
//   Layout,
//   ArrowRightLeft,
//   ClipboardList,
//   UserCheck,
//   PlusSquare,
//   MinusSquare,
//   History,
//   UserPlus,
//   BarChart3,
//   Boxes,
//   TrendingUp,
//   FileText,
// } from "lucide-react";
// import Link from "next/link";

// //USE METADATA TO SET THE PAGE TITLE
// const metadata: Metadata = {
//   title: "Inventory Management System",
//   description: "Home Page",
// };

// //LOGIC FOR INVENTORY HOME COMPONENT
// const Home: React.FC = () => {
//   const router = useRouter();
//   const { state } = useAuthContext();
//   const [error, setError] = useState<string | null>(null);
//   const isStaffAdmin =
//     state.user?.role === "admin" || state.user?.role === "staff";
//   const isAdmin = state.user?.role === "admin";
//   const [isStatsLoading, setIsStatsLoading] = useState(true);
//   const [dashboardStats, setDashboardStats] = useState({
//     totalProducts: 0,
//     lowStockItems: 0,
//     recentTransactions: 0,
//   });

//   useEffect(() => {
//     if (state.isLoading) return;

//     if (!state.isAuthenticated) {
//       router.push("/users/login");
//       return;
//     }
//     //Fetch DashBoard Stats from Backend API
//     const fetchDashboardStats = async () => {
//       try {
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`,
//           {
//             headers: {
//               Authorization: `Bearer ${state.token}`,
//             },
//           }
//         );
//         if (!res.ok) {
//           if (res.status === 401) {
//             //Token might be invalid/expired
//             router.push("/users/login");
//             return;
//           }
//           throw new Error(`Failed to fetch DashBoard Stats: ${res.statusText}`);
//         }
//         const data = await res.json();
//         setDashboardStats(data);
//       } catch (error: any) {
//         setError(error.message);
//         console.error("Failed to fetch dashboard stats", error);
//       } finally {
//         setIsStatsLoading(false);
//       }
//     };
//     if (state.isAuthenticated && !state.isLoading) {
//       fetchDashboardStats();
//     }
//   }, [
//     state.isLoading,
//     state.isAuthenticated,
//     router,
//     isAdmin,
//     isStaffAdmin,
//     state.token,
//   ]);

//   //Framer Motion Variants for animations
//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1,
//       },
//     },
//   };

//   //Item Variants for animations
//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1,
//     },
//   };

//   //Menu Items Listed
//   const menuItems = {
//     primary: [
//       {
//         title: "Products",
//         icon: <Package className="w-8 h-8" />,
//         description: "Browse and manage product catalog",
//         link: "/products",
//         access: "all",
//       },
//       {
//         title: "Record Transactions",
//         icon: <Box className="w-8 h-8" />,
//         description: "Record, track inventory transactions and stock levels",
//         link: "/inventory-transactions/create",
//         access: "isStaffAdmin",
//       },
//       {
//         title: "Warehouse Management",
//         icon: <Warehouse className="w-8 h-8" />,
//         description: "Manage warehouses and product allocation",
//         link: "/warehouses",
//         access: "isStaffAdmin",
//       },
//       {
//         title: "Transfer Requests",
//         icon: <ArrowRightLeft className="w-8 h-8" />,
//         description: "Manage inter-warehouse transfers",
//         link: "/transfer-request",
//         access: "isStaffAdmin",
//       },
//     ],
//     secondary: [
//       {
//         title: "Categories",
//         icon: <Layout className="w-6 h-6" />,
//         link: "/categories",
//         access: "isStaffAdmin",
//       },
//       {
//         title: "Get All Transactions",
//         icon: <ClipboardList className="w-6 h-6" />,
//         description: "View and manage all inventory transactions",
//         link: "/inventory-transactions",
//         access: "isStaffAdmin",
//       },
//       {
//         title: "Suppliers",
//         icon: <Truck className="w-6 h-6" />,
//         link: "/suppliers",
//         access: "isStaffAdmin",
//       },
//       {
//         title: "Staff Management",
//         icon: <UserCheck className="w-6 h-6" />,
//         link: "/staff-assignments",
//         access: "isAdmin",
//       },
//       {
//         title: "User Management",
//         icon: <Users className="w-6 h-6" />,
//         link: "/users",
//         access: "isAdmin",
//       },
//       {
//         title: "Transfer Requests",
//         icon: <ArrowRightLeft className="w-6 h-6" />,
//         link: "/transfer-request",
//         access: "isStaffAdmin",
//       },
//       {
//         title: "Notifications",
//         icon: <Bell className="w-6 h-6" />,
//         link: "/notifications",
//         access: "isStaffAdmin",
//       },
//       {
//         title: "Create Staff/Admin",
//         icon: <UserPlus className="w-6 h-6" />,
//         description: "Register new staff or admin users",
//         link: "/users/register",
//         access: "isAdmin",
//       },
//       {
//         title: "Add Product To Warehouse",
//         icon: <PlusSquare className="w-6 h-6" />,
//         description: "Manage products in warehouses",
//         link: "/warehouses/add/product",
//         access: "isStaffAdmin",
//       },
//       {
//         title: "Remove Product From Warehouse",
//         icon: <MinusSquare className="w-6 h-6" />,
//         description: "Manage products in warehouses",
//         link: "/warehouses/remove/product",
//         access: "isStaffAdmin",
//       },
//       {
//         title: "Analytics Dashboard",
//         icon: <BarChart3 className="w-6 h-6" />,
//         link: "/analytics",
//         access: "isStaffAdmin",
//       },
//       {
//         title: "Low Stock Alerts",
//         icon: <Bell className="w-6 h-6" />,
//         description: "View low stock and critical alerts",
//         link: "/analytics/low-stock-alerts",
//         access: "isStaffAdmin",
//       },
//     ],
//   };

//   //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
//   if (state.isLoading) {
//     return <Spinner />;
//   }

//   //DISPLAY ERROR MESSAGE
//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div
//           className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md max-w-md mx-auto relative"
//           role="alert"
//         >
//           <strong className="font-bold text-lg">Error:</strong>
//           <span className="block sm:inline ml-2">{error}</span>
//           <button
//             className="absolute top-2 right-2 text-red-500 hover:text-red-700 focus:outline-none"
//             onClick={() => {
//               /* Add your close handler here */
//             }}
//             aria-label="Close error message"
//           >
//             <svg
//               className="h-6 w-6"
//               xmlns="http://www.w3.org/2000/svg"
//               viewBox="0 0 20 20"
//               fill="currentColor"
//             >
//               <path d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 10-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 101.414 1.414L10 11.414l2.934 2.934a1 1 0 001.414-1.414L11.414 10l2.934-2.934a1 1 0 000-1.414z" />
//             </svg>
//           </button>
//         </div>
//       </div>
//     );
//   }

//   //LOGIC TO SHOW MENU BASED ON USER ROLE
//   const shouldShowMenuItem = (access: string) => {
//     if (access === "all") return true;
//     if (access === "isStaffAdmin") return isStaffAdmin;
//     if (access === "isAdmin") return isAdmin;
//     return false;
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       {/* Hero Section */}
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <div className="text-center mb-16">
//           <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
//             Inventory Management System
//           </h1>
//           <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
//             Streamline your inventory operations with our comprehensive
//             management system. Track products, manage orders, and monitor stock
//             levels all in one place. This system helps you efficiently manage
//             your inventory, reducing costs and improving customer satisfaction.
//           </p>

//           <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
//             It also provides a user-friendly interface for staff to manage their
//             assignments and track their work. Additionally, it includes a user
//             management system for administrators to manage user roles and
//             permissions.
//           </p>
//         </div>

//         {isStaffAdmin && (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
//             {isStatsLoading ? (
//               <>
//                 {[1, 2, 3].map((item) => (
//                   <div
//                     key={item}
//                     className="bg-white p-6 rounded-lg shadow-md animate-pulse"
//                   >
//                     <div className="h-12 w-12 bg-gray-300 rounded-full mb-4"></div>
//                     <div className="h-6 bg-gray-200 mb-2 w-3/4"></div>
//                     <div className="h-8 bg-gray-100 w-1/2"></div>
//                   </div>
//                 ))}
//               </>
//             ) : (
//               <>
//                 <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
//                   <Boxes className="w-12 h-12 text-blue-600 mr-4" />
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-800">
//                       Total Products
//                     </h3>
//                     <p className="text-2xl font-bold text-gray-900">
//                       {dashboardStats.totalProducts}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
//                   <TrendingUp className="w-12 h-12 text-red-600 mr-4" />
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-800">
//                       Low Stock Items
//                     </h3>
//                     <p className="text-2xl font-bold text-red-900">
//                       {dashboardStats.lowStockItems}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
//                   <BarChart3 className="w-12 h-12 text-green-600 mr-4" />
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-800">
//                       Recent Transactions
//                     </h3>
//                     <p className="text-2xl font-bold text-gray-900">
//                       {dashboardStats.recentTransactions}
//                     </p>
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
//         )}

//         {/* Primary Features Grid */}
//         <div className="mt-12">
//           <h2 className="text-2xl font-bold text-gray-900 mb-8">
//             Quick Access
//           </h2>
//           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 text-center">
//             {menuItems.primary
//               .filter((item) => shouldShowMenuItem(item.access))
//               .map((item) => (
//                 <Link
//                   href={item.link}
//                   key={item.title}
//                   className="relative group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
//                 >
//                   <div className="flex flex-col items-center text-center">
//                     <div className="text-blue-600 mb-4">{item.icon}</div>
//                     <h3 className="text-lg font-medium text-gray-900 mb-2">
//                       {item.title}
//                     </h3>
//                     <p className="text-sm text-gray-500">{item.description}</p>
//                   </div>
//                 </Link>
//               ))}
//           </div>
//         </div>

//         {/* Secondary Features */}
//         <div className="mt-16">
//           <h2 className="text-2xl font-bold text-gray-900 mb-8">
//             Additional Features
//           </h2>
//           <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 text-center">
//             {menuItems.secondary
//               .filter((item) => shouldShowMenuItem(item.access))
//               .map((item) => (
//                 <Link
//                   href={item.link}
//                   key={item.title}
//                   className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
//                 >
//                   <div className="text-gray-600">{item.icon}</div>
//                   <span className="mt-2 text-sm font-medium text-gray-900">
//                     {item.title}
//                   </span>
//                 </Link>
//               ))}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Home;

"use client";

import type { Metadata } from "next";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "./hooks/useAuthContext";
import Spinner from "./components/Spinner";
import { motion, useInView, easeInOut } from "framer-motion";
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
  FileText,
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

  //Enhanced Framer Motion Variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
        duration: 0.6,
      },
    },
  };

  const heroVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        duration: 0.2,
        ease: "easeInOut" as const,
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    },
  };

  const primaryCardVariants = {
    hidden: { opacity: 0, y: 30, rotateX: 15 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.6,
        ease: easeInOut,
      },
    },
    hover: {
      scale: 1.08,
      y: -8,
      rotateX: 5,
      boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
      transition: {
        duration: 0.3,
        ease: easeInOut,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  };

  const statsCardVariants = {
    hidden: { opacity: 0, x: -30, scale: 0.9 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
    hover: {
      scale: 1.03,
      y: -3,
      transition: {
        duration: 0.2,
      },
    },
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: easeInOut,
        delay: 0.2,
      },
    },
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: easeInOut,
      },
    },
  };

  const backgroundVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: easeInOut, // use the imported easing function
      },
    },
  };

  //Menu Items Listed
  const menuItems = {
    primary: [
      {
        title: "Products",
        icon: <Package className="w-8 h-8" />,
        description: "Browse and manage product catalog",
        link: "/products",
        access: "all",
        color: "from-blue-500 to-blue-600",
      },
      {
        title: "Record Transactions",
        icon: <Box className="w-8 h-8" />,
        description: "Record, track inventory transactions and stock levels",
        link: "/inventory-transactions/create",
        access: "isStaffAdmin",
        color: "from-green-500 to-green-600",
      },
      {
        title: "Warehouse Management",
        icon: <Warehouse className="w-8 h-8" />,
        description: "Manage warehouses and product allocation",
        link: "/warehouses",
        access: "isStaffAdmin",
        color: "from-purple-500 to-purple-600",
      },
      {
        title: "Transfer Requests",
        icon: <ArrowRightLeft className="w-8 h-8" />,
        description: "Manage inter-warehouse transfers",
        link: "/transfer-request",
        access: "isStaffAdmin",
        color: "from-orange-500 to-orange-600",
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
        title: "Suppliers",
        icon: <Truck className="w-6 h-6" />,
        link: "/suppliers",
        access: "isStaffAdmin",
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
        title: "Create Staff/Admin",
        icon: <UserPlus className="w-6 h-6" />,
        description: "Register new staff or admin users",
        link: "/users/register",
        access: "isAdmin",
      },
      {
        title: "Add Product To Warehouse",
        icon: <PlusSquare className="w-6 h-6" />,
        description: "Manage products in warehouses",
        link: "/warehouses/add/product",
        access: "isStaffAdmin",
      },
      {
        title: "Remove Product From Warehouse",
        icon: <MinusSquare className="w-6 h-6" />,
        description: "Manage products in warehouses",
        link: "/warehouses/remove/product",
        access: "isStaffAdmin",
      },
      {
        title: "Analytics Dashboard",
        icon: <BarChart3 className="w-6 h-6" />,
        link: "/analytics",
        access: "isStaffAdmin",
      },
      {
        title: "Low Stock Alerts",
        icon: <Bell className="w-6 h-6" />,
        description: "View low stock and critical alerts",
        link: "/analytics/low-stock-alerts",
        access: "isStaffAdmin",
      },
    ],
  };

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (state.isLoading) {
    return <Spinner />;
  }

  //ENHANCED ERROR MESSAGE WITH ANIMATION
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-screen"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md max-w-md mx-auto relative"
          role="alert"
        >
          <strong className="font-bold text-lg">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700 focus:outline-none"
            onClick={() => setError(null)}
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
          </motion.button>
        </motion.div>
      </motion.div>
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={backgroundVariants}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [-20, 20, -20],
            y: [-20, 20, -20],
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-xl"
        />
        <motion.div
          animate={{
            x: [20, -20, 20],
            y: [20, -20, 20],
            rotate: [360, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-10 right-10 w-40 h-40 bg-purple-200 rounded-full opacity-20 blur-xl"
        />
        <motion.div
          animate={{
            x: [-30, 30, -30],
            y: [30, -30, 30],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-green-200 rounded-full opacity-15 blur-lg"
        />
      </div>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <motion.h1
            variants={heroVariants}
            className="text-4xl font-extrabold text-gray-900 leading-tight py-3 sm:text-5xl md:text-6xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
          >
            Inventory Management System
          </motion.h1>
          <motion.p
            variants={textVariants}
            className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl leading-relaxed"
          >
            Streamline your inventory operations with our comprehensive
            management system. Track products, manage orders, and monitor stock
            levels all in one place. This system helps you efficiently manage
            your inventory, reducing costs and improving customer satisfaction.
          </motion.p>

          <motion.p
            variants={textVariants}
            className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl leading-relaxed"
          >
            It also provides a user-friendly interface for staff to manage their
            assignments and track their work. Additionally, it includes a user
            management system for administrators to manage user roles and
            permissions.
          </motion.p>
        </motion.div>

        {/* Enhanced Stats Section */}
        {isStaffAdmin && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            {isStatsLoading ? (
              <>
                {[1, 2, 3].map((item) => (
                  <motion.div
                    key={item}
                    variants={statsCardVariants}
                    className="bg-white p-6 rounded-xl shadow-lg animate-pulse border border-gray-100"
                  >
                    <div className="h-12 w-12 bg-gray-300 rounded-full mb-4"></div>
                    <div className="h-6 bg-gray-200 mb-2 w-3/4 rounded"></div>
                    <div className="h-8 bg-gray-100 w-1/2 rounded"></div>
                  </motion.div>
                ))}
              </>
            ) : (
              <>
                <motion.div
                  variants={statsCardVariants}
                  whileHover="hover"
                  className="bg-white p-6 rounded-xl shadow-lg flex items-center border border-gray-100 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                >
                  <motion.div variants={iconVariants}>
                    <Boxes className="w-12 h-12 text-blue-600 mr-4" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Total Products
                    </h3>
                    <motion.p
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="text-2xl font-bold text-gray-900"
                    >
                      {dashboardStats.totalProducts}
                    </motion.p>
                  </div>
                </motion.div>
                <motion.div
                  variants={statsCardVariants}
                  whileHover="hover"
                  className="bg-white p-6 rounded-xl shadow-lg flex items-center border border-gray-100 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                >
                  <motion.div variants={iconVariants}>
                    <TrendingUp className="w-12 h-12 text-red-600 mr-4" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Low Stock Items
                    </h3>
                    <motion.p
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                      className="text-2xl font-bold text-red-900"
                    >
                      {dashboardStats.lowStockItems}
                    </motion.p>
                  </div>
                </motion.div>
                <motion.div
                  variants={statsCardVariants}
                  whileHover="hover"
                  className="bg-white p-6 rounded-xl shadow-lg flex items-center border border-gray-100 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                >
                  <motion.div variants={iconVariants}>
                    <BarChart3 className="w-12 h-12 text-green-600 mr-4" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Recent Transactions
                    </h3>
                    <motion.p
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9, duration: 0.5 }}
                      className="text-2xl font-bold text-gray-900"
                    >
                      {dashboardStats.recentTransactions}
                    </motion.p>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        )}

        {/* Enhanced Primary Features Grid */}
        <div className="mt-12">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-gray-900 mb-8 text-center"
          >
            Quick Access
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 text-center"
          >
            {menuItems.primary
              .filter((item) => shouldShowMenuItem(item.access))
              .map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={primaryCardVariants}
                  whileHover="hover"
                  whileTap="tap"
                  custom={index}
                  className="h-full"
                >
                  <Link
                    href={item.link}
                    className={`relative group bg-gradient-to-br ${item.color} p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 block overflow-hidden h-full min-h-[200px] sm:min-h-[220px]`}
                  >
                    <div className="absolute inset-0 bg-white opacity-90 group-hover:opacity-95 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex flex-col items-center text-center h-full justify-center">
                      <motion.div
                        variants={iconVariants}
                        className="text-gray-700 mb-4 group-hover:text-gray-900 transition-colors duration-300 flex-shrink-0"
                      >
                        {item.icon}
                      </motion.div>
                      <motion.h3
                        variants={textVariants}
                        className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors duration-300 flex-shrink-0"
                      >
                        {item.title}
                      </motion.h3>
                      <motion.p
                        variants={textVariants}
                        className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed flex-grow flex items-center"
                      >
                        {item.description}
                      </motion.p>
                    </div>
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
                  </Link>
                </motion.div>
              ))}
          </motion.div>
        </div>

        {/* Enhanced Secondary Features */}
        <div className="mt-16">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl font-bold text-gray-900 mb-8 text-center"
          >
            Additional Features
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 text-center"
          >
            {menuItems.secondary
              .filter((item) => shouldShowMenuItem(item.access))
              .map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={cardVariants}
                  whileHover="hover"
                  whileTap="tap"
                  custom={index}
                  className="h-full"
                >
                  <Link
                    href={item.link}
                    className="flex flex-col items-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 group relative overflow-hidden h-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <motion.div
                      variants={iconVariants}
                      className="text-gray-600 group-hover:text-blue-600 transition-colors duration-300 relative z-10 flex-shrink-0 mb-2"
                    >
                      {item.icon}
                    </motion.div>
                    <motion.span
                      variants={textVariants}
                      className="mt-2 text-sm font-medium text-gray-900 group-hover:text-blue-800 transition-colors duration-300 relative z-10 text-center leading-tight flex items-center justify-center flex-grow"
                    >
                      {item.title}
                    </motion.span>
                  </Link>
                </motion.div>
              ))}
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
};

export default Home;

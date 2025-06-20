import React from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Clock,
  ArrowRightLeft,
  AlertTriangle,
  LayoutDashboard,
} from "lucide-react";

//LOGIC TO DISPLAY THE REPORTS PAGE
const ReportsPage = () => {
  const reportTypes = [
    {
      title: "Inventory Status",
      icon: <BarChart3 className="w-8 h-8" />,
      description: "Current inventory levels and values",
      link: "/analytics/inventory-status",
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
    {
      title: "Inventory Movement",
      icon: <TrendingUp className="w-8 h-8" />,
      description: "Track inventory transactions",
      link: "/analytics/inventory-movement",
      color: "bg-green-50 border-green-200 hover:bg-green-100",
    },
    {
      title: "Inventory Aging",
      icon: <Clock className="w-8 h-8" />,
      description: "Product age analysis",
      link: "/analytics/inventory-aging",
      color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
    },
    {
      title: "Transfer Efficiency",
      icon: <ArrowRightLeft className="w-8 h-8" />,
      description: "Warehouse transfer metrics",
      link: "/analytics/transfer-efficiency",
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    },
    {
      title: "Low Stock Alerts",
      icon: <AlertTriangle className="w-8 h-8" />,
      description: "Critical stock levels",
      link: "/analytics/low-stock-alerts",
      color: "bg-red-50 border-red-200 hover:bg-red-100",
    },
    {
      title: "Dashboard Summary",
      icon: <LayoutDashboard className="w-8 h-8" />,
      description: "Overview of key metrics",
      link: "/analytics/dashboard-summary",
      color: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-8 px-2 sm:px-0">
          Reports Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {reportTypes.map((report) => (
            <Link
              href={report.link}
              key={report.title}
              className={`${report.color} rounded-lg p-4 sm:p-6 border transition-all duration-300 hover:shadow-lg`}
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="text-gray-700 flex-shrink-0">
                  {React.cloneElement(report.icon as React.ReactElement, {
                    className: "w-6 h-6 sm:w-8 sm:h-8",
                  })}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 truncate">
                    {report.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {report.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

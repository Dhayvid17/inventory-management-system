"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";
import { Menu, X } from "lucide-react";

//LOGIC TO DISPLAY NAV-BAR
const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { state, dispatch } = useAuthContext();
  const router = useRouter();

  //HANDLE LOGOUT LOGIC
  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("token");
    router.push("/login");
  };

  //LINKS FOR EACH NAV
  const navLinks = [
    { href: "/products", label: "Products" },
    { href: "/orders/user/history", label: "Order History" },
    { href: "/orders", label: "Order" },
  ];

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold">
              Inventory System
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center">
            <div className="flex space-x-3 xl:space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-2 xl:px-3 py-2 rounded-md text-base hover:text-blue-200 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Notification Bell */}
            {state.isAuthenticated && (
              <div className="ml-4 xl:ml-4">
                <NotificationBell />
              </div>
            )}

            {/* Auth Section */}
            <div className="ml-3 xl:ml-4 flex items-center space-x-3 xl:space-x-4">
              {state.isLoading ? (
                <span>Loading...</span>
              ) : state.isAuthenticated ? (
                <>
                  <span className="text-base">
                    Welcome, {state.user?.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/users/login")}
                    className="px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => router.push("/users/register")}
                    className="px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            {state.isAuthenticated && (
              <div className="mr-4">
                <NotificationBell />
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-700 focus:outline-none"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Auth Section */}
              <div className="border-t border-blue-500 pt-2 mt-2">
                {state.isLoading ? (
                  <span className="px-3 py-2">Loading...</span>
                ) : state.isAuthenticated ? (
                  <>
                    <span className="px-3 py-2 block text-sm">
                      Welcome, {state.user?.username}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-2 w-full text-left text-sm hover:bg-blue-700 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        router.push("/users/login");
                        setIsOpen(false);
                      }}
                      className="px-3 py-2 w-full text-left text-sm hover:bg-blue-700 transition-colors"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        router.push("/users/register");
                        setIsOpen(false);
                      }}
                      className="px-3 py-2 w-full text-left text-sm hover:bg-blue-700 transition-colors"
                    >
                      Register
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

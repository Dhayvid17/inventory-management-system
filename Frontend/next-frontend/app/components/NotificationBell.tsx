"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../hooks/useAuthContext";
import { Notification } from "../types/notification";

//LOGIC TO DISPLAY THE NOTIFICATION BELL AND DROP DOWN
const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const prevLatestNotificationId = useRef<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const prevUnreadCountRef = useRef(unreadCount);
  // const audioRef = useRef(new Audio("./notification-sound.mp3"));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  //Initialize audio in useEffect
  useEffect(() => {
    audioRef.current = new Audio("/notification-sound.mp3");
  }, []);

  const { state } = useAuthContext();
  const router = useRouter();
  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";

  //Play sound logic
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.load(); // Ensure audio file is loaded
      audioRef.current.play().catch((error) => {
        console.log("Audio playback failed:", error);
      });
    }
  };

  //Display toast for 5 seconds
  const showNotificationToast = (notification: Notification) => {
    setLatestNotification(notification);
    setShowToast(true);
    setIsAnimating(true);
    setTimeout(() => {
      setShowToast(false);
    }, 5000); //Hide toast after 5 seconds
  };

  //Fetch notifications from Backend API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data: Notification[] = await res.json();
      const newUnreadCount = data.filter((n: any) => !n.isRead).length;
      const latestUnreadNotification = data.find((n) => !n.isRead);

      // Play sound only if there is a new notification (based on unique ID)
      if (
        latestUnreadNotification &&
        latestUnreadNotification._id !== prevLatestNotificationId.current
      ) {
        playNotificationSound();
        showNotificationToast(latestUnreadNotification);
        prevLatestNotificationId.current = latestUnreadNotification._id;
      }

      setNotifications(data);
      setUnreadCount(newUnreadCount);
      prevUnreadCountRef.current = newUnreadCount;
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  },[state.token])

  //Poll for new notifications every 30 seconds
  useEffect(() => {
    if (state.isAuthenticated) {
      fetchNotifications();
      //Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated, fetchNotifications]);

  //Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    setIsAnimating(false);
  };

  const handleNotificationClick = () => {
    setShowDropdown(false);
    if (isStaffAdmin) {
      router.push("/notifications");
    } else {
      router.push("/order-notification");
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleBellClick}
          className="relative p-2 hover:bg-blue-700 rounded-full"
          aria-label="Notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 ${isAnimating ? "animate-swing" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {showDropdown && (
          <div className="fixed sm:absolute right-0 sm:right-4 top-16 sm:top-auto sm:mt-2 w-full sm:w-80 max-w-[95vw] sm:max-w-none mx-auto sm:mx-0 bg-white rounded-lg shadow-xl text-gray-800 z-50">
            <div className="p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold">
                Notifications
              </h3>
            </div>
            <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-3 sm:p-4 border-b hover:bg-gray-50 cursor-pointer ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                    onClick={handleNotificationClick}
                  >
                    <p className="text-sm">{notification.message}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 sm:p-4 text-center text-gray-500">
                  No notifications
                </div>
              )}
            </div>
            <div className="p-3 sm:p-4 text-center border-t">
              <button
                onClick={handleNotificationClick}
                className="text-blue-600 hover:text-blue-800 text-sm sm:text-base"
              >
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && latestNotification && (
        <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 bg-white rounded-lg shadow-xl p-3 sm:p-4 w-auto sm:w-80 max-w-[calc(100vw-2rem)] animate-slideInUp z-50 border border-gray-200">
          <div className="flex items-start sm:items-center gap-3">
            {/* Notification Icon */}
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>

            {/* Notification Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-semibold text-gray-900 leading-tight">
                🔔 New Notification
              </p>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-normal break-words line-clamp-3">
                {latestNotification.message}
              </p>
            </div>

            {/* Close Button */}
            <div className="flex-shrink-0 -mt-1 -mr-1">
              <button
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                onClick={() => setShowToast(false)}
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationBell;

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import Spinner from "@/app/components/Spinner";
import Link from "next/link";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}
//Types Interface
interface User {
  username: string;
  role: string;
  _id: string;
}

//LOGIC TO DISPLAY EACH USER DETAILS PAGE
export default function UserDetailPage({ params }: UserDetailPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state } = useAuthContext();
  const router = useRouter();

  const isAdmin = state.user?.role === "admin";

  useEffect(() => {
    if (state.isLoading) return;
    if (!state.isAuthenticated) {
      router.push("/users/login");
      return;
    }
    if (!isAdmin) {
      router.push("/unauthorized");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${(await params).id}`,
          {
            headers: {
              Authorization: `Bearer ${state.token}`,
            },
          }
        );

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/users/login");
            return;
          }
          throw new Error(`Failed to fetch user: ${res.statusText}`);
        }

        const data = await res.json();
        setUser(data);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [
    state.isLoading,
    state.isAuthenticated,
    state.token,
    router,
    params,
    isAdmin,
  ]);

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (state.isLoading || isLoading) {
    return <Spinner />;
  }

  //DISPLAY ERROR MESSAGE
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  //DISPLAY USER DETAILS
  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">User Details</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-2xl font-medium text-gray-700">
              Username
            </label>
            <p className="mt-1 text-base text-gray-600">{user.username}</p>
          </div>
          <div>
            <label className="block text-2xl font-medium text-gray-700">
              Role
            </label>
            <p className="mt-1 text-base text-gray-600">{user.role}</p>
          </div>
        </div>
        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => router.back()}
            className="bg-gray-200 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
          >
            Back To Users
          </button>

          {/* {HANDLE DELETE LOGIC} */}
          <button
            onClick={async () => {
              if (confirm("Are you sure you want to delete this user?")) {
                try {
                  const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}`,
                    {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${state.token}`,
                      },
                    }
                  );

                  if (!res.ok) {
                    throw new Error(`Failed to delete user: ${res.statusText}`);
                  }

                  router.push("/users");
                  router.refresh();
                } catch (error: any) {
                  setError(error.message);
                  console.error("Error deleting user:", error);
                }
              }
            }}
            className="bg-red-600 hover:bg-red-900 text-white px-4 py-2 rounded"
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../hooks/useAuthContext";
import Spinner from "../components/Spinner";
import { TrashIcon } from "lucide-react";

//Types Interface
interface User {
  username: string;
  role: string;
  _id: string;
}

//LOGIC TO DISPLAY THE USERS PAGE
const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
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

    //Fetch the users from Backend API
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/users/login");
            return;
          }
          throw new Error(`Failed to fetch users: ${res.statusText}`);
        }

        const data = await res.json();
        setUsers(data);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [state.isLoading, state.isAuthenticated, state.token, router, isAdmin]);

  //HANDLE DELETE LOGIC
  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    if (!isAdmin) {
      setError("You are not authorized to delete user");
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
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
      alert("User deleted successfully!");
      setUsers(users.filter((user) => user._id !== userId));
      router.refresh();
    } catch (error: any) {
      setError(error.message);
      console.error("Error deleting user:", error);
    }
  };

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (state.isLoading || isLoading) {
    return <Spinner />;
  }

  //DISPLAY ERROR MESSAGE
  if (error) {
    return (
      <div className="p-2 sm:p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-3 sm:p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      {isLoading ? (
        <Spinner />
      ) : users.length > 0 ? (
        <div>
          {/* Mobile View */}
          <div className="block sm:hidden">
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user._id} className="bg-white shadow rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{user.username}</h3>
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {user.role}
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => router.push(`/users/${user._id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => router.push(`/users/${user._id}`)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-4 text-lg font-semibold">
          <p>No users found.</p>
        </div>
      )}
    </div>
  );
};

export default UsersPage;

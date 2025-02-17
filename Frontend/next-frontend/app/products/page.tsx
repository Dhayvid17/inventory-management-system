"use client";

import React, { Suspense, useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import Link from "next/link";
import ProductList from "../components/product/ProductList";
import { useAuthContext } from "../hooks/useAuthContext";
import { useRouter } from "next/navigation";

//LOGIC TO DISPLAY ALL PRODUCTS
const ProductPage: React.FC = () => {
  const [products, setProducts] = useState<[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state } = useAuthContext();
  const router = useRouter();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";

  useEffect(() => {
    if (state.isLoading) return; //Wait until loading is false

    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    //Fetch products from Backend API
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        });
        if (!res.ok) {
          if (res.status === 401) {
            //Token might be invalid/expired
            router.push("/users/login");
            return;
          }
          throw new Error(`Failed to fetch products: ${res.statusText}`);
        }
        const data = await res.json();
        setProducts(data);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [state.isLoading, state.isAuthenticated, state.token, router]);

  //Display Spinner when IsLoading
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

  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2 sm:gap-0">
        <h1 className="text-2xl font-bold">Products</h1>
        {isStaffAdmin && (
          <Link
            href="/products/create"
            className="bg-blue-600 text-white font-medium border border-blue-600 hover:bg-blue-950 transition duration-200 ease-in-out px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base"
          >
            Add New Product
          </Link>
        )}
      </div>
      {isLoading ? (
        <Spinner />
      ) : products.length > 0 ? (
        <ProductList products={products} />
      ) : (
        <p className="text-center text-gray-500 mt-4 text-lg font-semibold">
          No products available.
        </p>
      )}
    </main>
  );
};

export default ProductPage;

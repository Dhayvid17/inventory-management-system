"use client";

import Spinner from "@/app/components/Spinner";
import { Product } from "@/app/types/product";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NotFound from "../not-found";
import { useAuthContext } from "@/app/hooks/useAuthContext";

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE PRODUCT DETAILS FROM THE BACKEND SERVER
async function getProductDetail(id: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: {
      revalidate: 60,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch product: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

//LOGIC TO DISPLAY EACH PRODUCT DETAIL PAGE
export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { state } = useAuthContext();
  const router = useRouter();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const isAdmin = state.user?.role === "admin";

  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!state.isAuthenticated) {
        router.push("/users/login"); //Redirect to login if not authenticated
        return;
      }
      try {
        const data = await getProductDetail(id, state.token || "");
        setProduct(data);
      } catch (error: any) {
        setProduct(null);
        setError(error.message);
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, state.isAuthenticated, state.token, router]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this product?")) {
      setIsDeleting(true);

      if (!isAdmin) {
        setError("You are not authorized to delete categories");
        return;
      }
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
        });
        alert("Product deleted successfully!");
        router.push("/products");
        router.refresh();
      } catch (error: any) {
        console.error("Error deleting product:", error);
        alert("Error deleting product");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
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

  //LOGIC TO DISPLAY NOT-FOUND IF PRODUCT DATA RETURN NULL
  if (!product) {
    return <NotFound />;
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-4">
            <strong>Product Name: </strong>
            {product.name}
          </h1>
          <span className="text-gray-700 text-lg mb-2">
            <strong>Product Price: </strong>
            💲{product.price.toFixed(2)}
          </span>
          <span className="text-gray-700 text-lg mb-2">
            <strong>Product Quantity: </strong>
            {product.quantity}
          </span>

          <p className="text-gray-700 text-lg mb-2">
            <strong>Category: </strong>
            {product.category ? (
              <span className="block">{product.category.name} </span>
            ) : (
              <span>No category available</span>
            )}
          </p>
          {isStaffAdmin && (
            <div className="mt-6">
              <div className="text-gray-700 text-lg">
                <strong>Warehouse: </strong>
                {product.warehouse ? (
                  <div className="mb-4 border-b pb-4 mt-3">
                    <span className="text-gray-700 text-lg block">
                      <strong>Warehouse Name: </strong>
                      {product.warehouse.name}
                    </span>
                    <span className="text-gray-700 text-lg block">
                      <strong>Warehouse Location: </strong>
                      {product.warehouse.location}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-700 text-lg block">
                    <strong>No warehouse information available</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        {isStaffAdmin && (
          <div className="flex space-x-4 justify-items-start items-baseline">
            <Link
              href={`/products/${id}/edit`}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className={`px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ${
                isDeleting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting.." : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

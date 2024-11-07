"use client";

import Spinner from "@/app/components/Spinner";
import { Product } from "@/app/types/product";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NotFound from "../not-found";

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE PRODUCT DETAILS FROM THE BACKEND SERVER
async function getProductDetail(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
    next: {
      revalidate: 60,
    },
  });
  if (!res.ok) {
    return null;
  }
  const data = res.json();
  return data;
}

//LOGIC TO DISPLAY EACH PRODUCT DETAIL PAGE
export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductDetail(id);
        setProduct(data);
      } catch (error) {
        setProduct(null);
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this product?")) {
      setIsDeleting(true);
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
          method: "DELETE",
        });
        alert("Product deleted successfully!");
        router.push("/products");
        router.refresh();
      } catch (error) {
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

  //LOGIC TO DISPLAY NOT-FOUND IF WAREHOUSE DATA RETURN NULL
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
        </div>
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
      </div>
    </div>
  );
}

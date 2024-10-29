"use client";

import Spinner from "@/app/components/Spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Supplier } from "@/app/types/supplier";
import NotFound from "../not-found";

interface SupplierDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE SUPPLIER DETAILS FROM THE BACKEND SERVER
async function getSupplierDetail(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`,
    {
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) {
    return null;
  }
  const data = res.json();
  return data;
}

//LOGIC TO DISPLAY EACH SUPPLIER DETAIL PAGE
export default function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const data = await getSupplierDetail(id);
        setSupplier(data);
      } catch (error) {
        setSupplier(null);
        console.error("Error fetching category:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplier();
  }, [id]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this category?")) {
      setIsDeleting(true);
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`, {
          method: "DELETE",
        });
        alert("Supplier deleted successfully!");
        router.push("/suppliers");
        router.refresh();
      } catch (error) {
        console.error("Error deleting supplier:", error);
        alert("Error deleting supplier");
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

  //LOGIC TO DISPLAY NOT-FOUND IS CATEGORY DATA RETURN NULL
  if (!supplier) {
    return <NotFound />;
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-4">
            <strong>Supplier Name: </strong>
            {supplier.name}
          </h1>

          <span className="text-gray-700 text-lg block mb-2">
            <strong>Supplier Contact: </strong>
            {supplier.contact}
          </span>

          <span className="text-gray-700 text-lg block mb-2">
            <strong>Supplier Email: </strong>
            {supplier.email}
          </span>

          <span className="text-gray-700 text-lg block">
            <strong>Supplier Address: </strong>
            {supplier.address}
          </span>
        </div>
        <div className="flex space-x-4 justify-items-start items-baseline">
          <Link
            href={`/suppliers/${id}/edit`}
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

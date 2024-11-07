import React, { Suspense } from "react";
import Spinner from "../components/Spinner";
import Link from "next/link";
import ProductList from "../components/product/ProductList";

//LOGIC TO FETCH PRODUCTS FROM BACKEND SERVER
const fetchProducts = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
    next: {
      revalidate: 0,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = await res.json();
  return data;
};

//LOGIC TO DISPLAY ALL PRODUCTS
const ProductPage: React.FC = async () => {
  const products = await fetchProducts();

  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/products/create"
          className="bg-blue-600 text-white font-medium border border-blue-600 hover:bg-blue-950 transition duration-200 ease-in-out px-4 py-2 rounded"
        >
          Add New Product
        </Link>
      </div>
      <Suspense fallback={<Spinner />}>
        <ProductList products={products} />
      </Suspense>
    </main>
  );
};

export default ProductPage;

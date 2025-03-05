import React from "react";
import Link from "next/link";
import { Product } from "@/app/types/product";

interface ProductListProps {
  products: Product[];
}

//LOGIC TO LIST PRODUCTS
const ProductList: React.FC<ProductListProps> = ({ products }) => (
  <ul className="space-y-4">
    {products.map((product) => (
      <li key={product._id} className="p-4 border-b border-gray-400">
        <Link
          href={`/products/${product._id}`}
          className="text-lg font-medium text-blue-600 hover:text-blue-950"
        >
          {product.name}
        </Link>
      </li>
    ))}
    {products.length === 0 && (
      <li className="p-4 text-gray-500 text-center">No results found</li>
    )}
  </ul>
);

export default ProductList;

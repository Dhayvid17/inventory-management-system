import React from "react";
import { Category } from "@/app/types/category";
import Link from "next/link";

interface CategoryListProps {
  categories: Category[];
}

//LOGIC TO LIST CATEGORIES
const CategoryList: React.FC<CategoryListProps> = ({ categories }) => (
  <ul className="space-y-4">
    {categories.map((category) => (
      <li key={category._id} className="p-4 border-b border-gray-400">
        <Link
          href={`/categories/${category._id}`}
          className="text-lg font-medium text-blue-600 hover:text-blue-950"
        >
          {category.name}
        </Link>
      </li>
    ))}
    {categories.length === 0 && (
      <li className="p-4 text-gray-500 text-center">No results found</li>
    )}
  </ul>
);

export default CategoryList;

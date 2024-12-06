"use client";

import { useAuthContext } from "@/app/hooks/useAuthContext";
import { Product } from "@/app/types/product";
import { TransferRequestPayload } from "@/app/types/transfer-request";
import { Warehouse } from "@/app/types/warehouse";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";

//LOGIC TO ADD NEW TRANSFER REQUEST FORM
const TransferRequestForm: React.FC = () => {
  const router = useRouter();
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [products, setProducts] = useState<
    Array<{
      productId: string;
      quantity: number;
    }>
  >([]);
  const [transferType, setTransferType] =
    useState<TransferRequestPayload["transferType"]>("RegularToRegular");
  const [note, setNote] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { state } = useAuthContext();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";

  useEffect(() => {
    console.log("Auth State:", state);
    //Check if the authentication state is still loading
    if (state.isLoading) {
      <Spinner />;
      return;
    }

    if (!state.isAuthenticated) {
      console.log("User not authenticated, redirecting to login.");
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    if (!isStaffAdmin) {
      console.log("User  is not authorized to create a transfer request.");
      //   setError("You are not authorized to create a transfer request.");
      return;
    }

    //Fetch warehouses and products from your backend API
    const fetchWarehouses = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/warehouses`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
          }
        );
        const data = await response.json();
        setWarehouses(data);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching warehouses:", error);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
          }
        );
        const data = await response.json();
        setProductList(data);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching products:", error);
      }
    };

    fetchWarehouses();
    fetchProducts();
  }, [state.isAuthenticated, isStaffAdmin, router]);

  //HANDLE ADD PRODUCT LOGIC
  const handleAddProduct = () => {
    setProducts([...products, { productId: "", quantity: 0 }]);
  };

  //HANDLE PRODUCT CHANGE LOGIC
  const handleProductChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newProducts = [...products];
    newProducts[index] = {
      ...newProducts[index],
      [field]: value,
    };
    setProducts(newProducts);
  };

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload: TransferRequestPayload = {
      fromWarehouseId,
      toWarehouseId,
      products: products,
      transferType,
      note,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/create/transfer-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      router.push("/");
      router.refresh();
    } catch (error: any) {
      console.error("Failed to create transfer request:", error);
      setError(`Error creating transfer request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  //DISPLAY ERROR MESSAGE IF THE USER IS NOT STAFF/ADMIN
  if (!isStaffAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">
            You are not authorized to create a transfer request.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Create Transfer Request</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warehouse Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              From Warehouse
            </label>
            <select
              id="fromWarehouseId"
              value={fromWarehouseId}
              onChange={(e) => setFromWarehouseId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              required
            >
              <option value="">Select From Warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              To Warehouse
            </label>
            <select
              id="toWarehouseId"
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              required
            >
              <option value="">Select To Warehouse</option>
              {warehouses
                .filter((w) => w._id !== fromWarehouseId)
                .map((warehouse) => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Products Selection */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Products</h3>
            <button
              type="button"
              onClick={handleAddProduct}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Add Product
            </button>
          </div>

          {products.map((product, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 mb-2">
              <select
                value={product.productId}
                onChange={(e) =>
                  handleProductChange(index, "productId", e.target.value)
                }
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                required
              >
                <option value="">Select Product</option>
                {productList.map((prod) => (
                  <option key={prod._id} value={prod._id}>
                    {prod.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={product.quantity}
                onChange={(e) =>
                  handleProductChange(index, "quantity", Number(e.target.value))
                }
                min="1"
                className="block w-1/4 border border-gray-300 rounded-md shadow-sm py-2 px-3"
                required
              />
              <button
                type="button"
                onClick={() => {
                  const newProducts = products.filter((_, i) => i !== index);
                  setProducts(newProducts);
                }}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Transfer Type */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Transfer Type
          </label>
          <select
            id="transferType"
            value={transferType}
            onChange={(e) =>
              setTransferType(
                e.target.value as TransferRequestPayload["transferType"]
              )
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          >
            <option value="">Select transfer type</option>
            <option value="SuperToRegular">Super To Regular</option>
            <option value="RegularToRegular">Regular To Regular</option>
            <option value="RegularToSuper">Regular To Super</option>
          </select>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Note (Optional)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600 transition-colors"
        >
          {loading ? "Creating Transfer Request..." : "Create Transfer Request"}
        </button>
      </form>
    </div>
  );
};

export default TransferRequestForm;

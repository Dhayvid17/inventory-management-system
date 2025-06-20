"use client";

import { useAuthContext } from "@/app/hooks/useAuthContext";
import { Product } from "@/app/types/product";
import { TransferRequest } from "@/app/types/transferRequest";
import { Warehouse } from "@/app/types/warehouse";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";

//LOGIC TO CREATE NEW TRANSFER REQUEST
const TransferRequestForm: React.FC = () => {
  const router = useRouter();
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [products, setProducts] = useState<
    Array<{ productId: string; quantity: number }>
  >([]);
  const [transferType, setTransferType] =
    useState<TransferRequest["transferType"]>("RegularToRegular");
  const [note, setNote] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [error, setError] = useState("");
  const { state } = useAuthContext();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";

  useEffect(() => {
    //Check if the authentication state is still loading
    if (state.isLoading) {
      <Spinner />;
      return;
    }

    if (!state.isAuthenticated) {
      router.push("/users/login");
      return;
    }

    if (!isStaffAdmin) {
      setShowMessage(true);
      console.log("User  is not authorized to create a transfer request.");
      setError("You are not authorized to create a transfer request.");
      return;
    }

    //Fetch warehouses and products from your backend API
    const fetchData = async () => {
      try {
        const [warehousesResponse, productsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?limit=10000`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
          }),
        ]);

        if (!warehousesResponse.ok || !productsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [warehousesData, productsData] = await Promise.all([
          warehousesResponse.json(),
          productsResponse.json(),
        ]);

        setWarehouses(warehousesData);
        setProductList(productsData.products);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [
    state.isLoading,
    state.isAuthenticated,
    isStaffAdmin,
    state.token,
    router,
  ]);

  //Second useEffect for handling from warehouse changes and available products
  useEffect(() => {
    if (!fromWarehouseId) return;

    const selectedWarehouse = warehouses.find((w) => w._id === fromWarehouseId);
    if (selectedWarehouse && selectedWarehouse.products) {
      //Get available products for the selected warehouse
      const warehouseProducts = selectedWarehouse.products
        .map((wp) => {
          const product = productList.find((p) => p._id === wp.productId);
          return product
            ? {
                ...product,
                availableQuantity: wp.quantity,
              }
            : null;
        })
        .filter((p) => p !== null);

      setAvailableProducts(warehouseProducts);
    }
  }, [fromWarehouseId, warehouses, productList]);

  //Third useEffect for product search filtering
  useEffect(() => {
    if (!productSearch.trim()) {
      setFilteredProducts(availableProducts);
      return;
    }

    const filtered = availableProducts.filter((product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [productSearch, availableProducts]);

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

    //Validate required fields
    if (
      !fromWarehouseId ||
      !toWarehouseId ||
      !transferType ||
      products.length === 0
    ) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    //Validate quantities against available stock
    for (const product of products) {
      const availableProduct = availableProducts.find(
        (p) => p._id === product.productId
      );
      if (!availableProduct) {
        setError("Selected product not available in source warehouse");
        setLoading(false);
        return;
      }
      if (product.quantity > availableProduct.quantity) {
        setError(`Insufficient quantity available for selected product`);
        setLoading(false);
        return;
      }
    }

    //Validate products
    const invalidProducts = products.some(
      (p) => !p.productId || p.quantity <= 0
    );
    if (invalidProducts) {
      setError("Please ensure all products have valid IDs and quantities");
      setLoading(false);
      return;
    }

    const payload = {
      fromWarehouseId,
      toWarehouseId,
      products,
      transferType,
      note,
    };

    //Check if the toWarehouse is managed by the authenticated user
    const toWarehouse = warehouses.find((w) => w._id === toWarehouseId);
    if (
      toWarehouse &&
      !toWarehouse.managedBy.some(
        (managedBy) => managedBy._id === state.user?.id
      )
    ) {
      setError("User isn't authorized");
      setLoading(false);
      return;
    }

    //Check if the fromWarehouse has a managedBy
    const fromWarehouse = warehouses.find((w) => w._id === fromWarehouseId);
    if (
      fromWarehouse &&
      (!fromWarehouse.managedBy || fromWarehouse.managedBy.length === 0)
    ) {
      setError("No staff at the selected warehouse");
      setLoading(false);
      return;
    }

    //Check if the products are available in the fromWarehouse
    const fromWarehouseProducts = fromWarehouse?.products || [];
    const selectedProducts = products.map((p) => p.productId);
    const unavailableProducts = selectedProducts.filter(
      (p) => !fromWarehouseProducts.some((product) => product.productId === p)
    );
    if (unavailableProducts.length > 0) {
      setError("Some products are not available in the from warehouse");
      setLoading(false);
      return;
    }

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
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to create transfer request"
        );
      }

      await response.json();
      router.push("/transfer-request");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Failed to create transfer request");
      console.error("Error creating transfer request:", error);
    } finally {
      setLoading(false);
    }
  };

  //DISPLAY ERROR MESSAGE IF NOT AUTHORIZED
  if (showMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-red-100">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="text-sm text-red-500">
                You are not authorized to create a transfer request.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Create Transfer Request
            </h2>
            <p className="text-sm sm:text-base text-blue-100 mt-1">
              Transfer inventory between warehouses
            </p>
          </div>

          {/* Main Form */}
          <div className="p-4 sm:p-6 lg:p-8">
            {error && (
              <div className="mb-4 sm:mb-6 bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs sm:text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Warehouse Selection Section */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg sm:rounded-xl space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Warehouse Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      From Warehouse <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={fromWarehouseId}
                      onChange={(e) => setFromWarehouseId(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none cursor-pointer"
                      required
                    >
                      <option value="">Select Source Warehouse</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse._id} value={warehouse._id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      To Warehouse <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={toWarehouseId}
                      onChange={(e) => setToWarehouseId(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none cursor-pointer"
                      required
                    >
                      <option value="">Select Destination Warehouse</option>
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
              </div>

              {/* Products Section */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg sm:rounded-xl">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Products <span className="text-red-500">*</span>
                  </h3>

                  {/* Search Products Input with Dropdown */}
                  <div className="relative w-full sm:w-64 mb-4">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-green-700 text-sm outline-none"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>

                    {/* Dropdown List */}
                    {productSearch.trim() && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.map((product) => (
                          <div
                            key={product._id}
                            onClick={() => {
                              // Add the selected product to the products array
                              const newProduct = {
                                productId: product._id,
                                quantity: 1,
                              };
                              setProducts([...products, newProduct]);
                              setProductSearch(""); // Clear search after selection
                            }}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {product.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                Available: {product.availableQuantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No results message */}
                    {productSearch.trim() && filteredProducts.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                        <p className="text-sm text-gray-500">
                          No products found
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Product
                  </button>
                </div>

                {products.length === 0 && (
                  <div className="text-center py-6 sm:py-8 bg-gray-100 rounded-lg">
                    <svg
                      className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      No products added yet
                    </p>
                    <p className="text-xs text-gray-400">
                      Click "Add Product" to start
                    </p>
                  </div>
                )}

                {/* Products List */}
                <div className="space-y-3 sm:space-y-4">
                  {products.map((product, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-white p-3 sm:p-4 rounded-lg shadow-sm"
                    >
                      <div className="w-full sm:flex-grow grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <select
                          value={product.productId}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              "productId",
                              e.target.value
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none cursor-pointer"
                          required
                        >
                          <option value="">Select Product</option>
                          {filteredProducts.map((prod) => (
                            <option
                              key={prod._id}
                              value={prod._id}
                              disabled={products.some(
                                (p) => p.productId === prod._id && p !== product
                              )}
                            >
                              {prod.name} (Available: {prod.availableQuantity})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          placeholder="Quantity"
                          value={product.quantity}
                          onChange={(e) => {
                            const quantity = Number(e.target.value);
                            const selectedProduct = filteredProducts.find(
                              (p) => p._id === product.productId
                            );
                            if (
                              selectedProduct &&
                              quantity > selectedProduct.quantity
                            ) {
                              setError(
                                `Cannot exceed available quantity of ${selectedProduct.quantity}`
                              );
                              return;
                            }
                            handleProductChange(index, "quantity", quantity);
                          }}
                          min="1"
                          max={
                            filteredProducts.find(
                              (p) => p._id === product.productId
                            )?.quantity || 1
                          }
                          className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none"
                          required
                        />
                      </div>
                      {/* <div className="w-full sm:flex-grow grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <select
                          value={product.productId}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              "productId",
                              e.target.value
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none cursor-pointer"
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
                            handleProductChange(
                              index,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          min="1"
                          className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none"
                          required
                        />
                      </div> */}
                      <button
                        type="button"
                        onClick={() => {
                          const newProducts = products.filter(
                            (_, i) => i !== index
                          );
                          setProducts(newProducts);
                        }}
                        className="sm:ml-2 p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transfer Details Section */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg sm:rounded-xl space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Transfer Details
                </h3>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Transfer Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={transferType}
                    onChange={(e) =>
                      setTransferType(
                        e.target.value as TransferRequest["transferType"]
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none cursor-pointer"
                    required
                  >
                    <option value="SuperToRegular">Super To Regular</option>
                    <option value="RegularToRegular">Regular To Regular</option>
                    <option value="RegularToSuper">Regular To Super</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Note (Optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none"
                    rows={4}
                    placeholder="Add any additional information about this transfer..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`
                  inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white
                  ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  }
                  transition-colors w-full sm:w-auto
                `}
                >
                  {loading && (
                    <svg
                      className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {loading
                    ? "Creating Transfer Request..."
                    : "Create Transfer Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferRequestForm;

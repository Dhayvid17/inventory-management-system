"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import Spinner from "../Spinner";

//TYPESCRIPT INTERFACES
interface Product {
  _id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Warehouse {
  _id: string;
  name: string;
}

interface Supplier {
  _id: string;
  name: string;
}

interface SelectedProduct {
  productId: string;
  quantity: number;
}

interface FormData {
  transactionType: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  warehouseId: string;
  products: SelectedProduct[];
  supplierId: string;
  action: string;
  interWarehouseTransferStatus: string;
  staffId: string;
}

//LOGIC FOR INVENTORY TRANSACTION FORM
const InventoryTransactionForm: React.FC = () => {
  //State for form data
  const [formData, setFormData] = useState<FormData>({
    transactionType: "",
    fromWarehouseId: "",
    toWarehouseId: "",
    warehouseId: "",
    products: [],
    supplierId: "",
    action: "",
    interWarehouseTransferStatus: "Pending",
    staffId: "",
  });

  const router = useRouter();
  //State for validation
  const [errors, setErrors] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  //State for dropdown data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  //State for search filters
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [fromWarehouseSearch, setFromWarehouseSearch] = useState("");
  const [toWarehouseSearch, setToWarehouseSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");

  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const { state } = useAuthContext();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const transactionTypes = [
    "Restock Transaction",
    "Sales Transaction",
    "Damaged Product",
    "Supplier Return",
    "Customer Return",
    "Addition/Removal of Product From Warehouse",
  ];

  const actions = [
    "Add Product To Warehouse",
    "Remove Product From Warehouse",
    "Product Transferred In",
    "Product Transferred Out",
  ];

  const transferStatuses = [
    "Pending",
    "Approved",
    "Declined",
    "In Transit",
    "Completed",
    "Cancelled",
    "Failed Transfer Request",
  ];

  useEffect(() => {
    //Check if the authentication state is still loading
    if (state.isLoading) {
      <Spinner />;
      return;
    }

    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    if (!isStaffAdmin) {
      setShowMessage(true);
      setErrors("You are not authorized to create a transaction.");
    }
  }, [state.isLoading, state.isAuthenticated, isStaffAdmin, router]);

  //Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [warehousesRes, suppliersRes, productsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?limit=1000`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
          }),
        ]);

        const warehousesData = await warehousesRes.json();
        const suppliersData = await suppliersRes.json();
        const productsData = await productsRes.json();

        setWarehouses(warehousesData);
        setSuppliers(suppliersData);
        setAllProducts(productsData.products);
      } catch (error: any) {
        setErrors(error.message);
        console.error("Error fetching data:", error);
      }
    };
    if (!state.token) return;
    fetchData();
  }, [state.token]);

  //LOGIC TO VALIDATE FORM
  const validateForm = (): boolean => {
    //Reset errors
    setErrors("");

    //Basic validation
    if (!formData.transactionType) {
      setErrors("Transaction type is required");
      return false;
    }

    if (formData.products.length === 0) {
      setErrors("At least one product is required");
      return false;
    }

    //Validate quantities
    if (formData.products.some((p) => !p.quantity || p.quantity <= 0)) {
      setErrors("All products must have a valid quantity");
      return false;
    }

    //Conditional validation based on transaction type
    if (
      formData.transactionType ===
        "Addition/Removal of Product From Warehouse" &&
      !formData.action
    ) {
      setErrors("Action is required for this transaction type");
      return false;
    }

    if (
      [
        "Addition/Removal of Product From Warehouse",
        "Customer Return",
        "Restock Transaction",
        "Supplier Return",
        "Sales Transaction",
      ].includes(formData.transactionType) &&
      !formData.warehouseId
    ) {
      setErrors("Warehouse is required for this transaction type");
      return false;
    }

    if (
      ["Restock Transaction", "Supplier Return"].includes(
        formData.transactionType
      ) &&
      !formData.supplierId
    ) {
      setErrors("Supplier is required for this transaction type");
      return false;
    }

    return true; //Form is valid
  };

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    setLoading(true);

    try {
      //Prepare the form data including staffId directly
      const transactionData = {
        ...formData,
        staffId: state.user?.id, // Include staffId directly in the request body
      };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory-transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify(transactionData),
        }
      );
      if (!response.ok)
        throw new Error(`Failed to create transaction: ${response.statusText}`);
      router.push("/inventory-transactions");
      router.refresh();
    } catch (error: any) {
      setErrors(error.message);
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  //LOGIC TO HANDLE PRODUCT QUANTITY
  const handleProductQuantityChange = (productId: string, quantity: number) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.productId === productId ? { ...p, quantity } : p
      ),
    }));
  };

  const addProduct = (productId: string) => {
    if (!formData.products.find((p) => p.productId === productId)) {
      setFormData((prev) => ({
        ...prev,
        products: [...prev.products, { productId, quantity: 1 }],
      }));
      setProductSearch("");
    }
  };

  const removeProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.productId !== productId),
    }));
  };

  //Filter functions
  const filteredWarehouses = warehouses.filter((w) =>
    w.name.toLowerCase().includes(warehouseSearch.toLowerCase())
  );

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredFromWarehouses = warehouses.filter((w) =>
    w.name.toLowerCase().includes(fromWarehouseSearch.toLowerCase())
  );

  const filteredToWarehouses = warehouses.filter((w) =>
    w.name.toLowerCase().includes(toWarehouseSearch.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  //HANDLE FORM FIELD CHANGES
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  //DISPLAY ERROR MESSAGE IF THE USER IS NOT STAFF/ADMIN
  if (showMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">
            You are not authorized to create Inventory Transaction.
          </span>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6"
    >
      {/* Error Messages */}
      {errors && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded relative mb-4">
          <span className="block pr-8">{errors}</span>
          <button
            onClick={() => setErrors("")}
            className="absolute top-1/2 -translate-y-1/2 right-2 p-1 sm:p-2"
          >
            <svg
              className="fill-current h-4 w-4 sm:h-6 sm:w-6 text-red-500"
              role="button"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 10-1.414 1.414l2.934 2.934-2.934 2.934a1 1 0 101.414 1.414L10 12.414l2.934 2.934a1 1 0 001.414-1.414l-2.934-2.934 2.934-2.934a1 1 0 000-1.414z" />
            </svg>
          </button>
        </div>
      )}

      {/* Transaction Type */}
      <div className="space-y-1 sm:space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Transaction Type*
        </label>
        <select
          name="transactionType"
          value={formData.transactionType}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none cursor-pointer"
        >
          <option value="">Select transaction type</option>
          {transactionTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Action Selection for Addition/Removal */}
      {formData.transactionType ===
        "Addition/Removal of Product From Warehouse" && (
        <div className="space-y-1 sm:space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Action*
          </label>
          <select
            name="action"
            value={formData.action}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none cursor-pointer"
          >
            <option value="">Select action</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Transfer Status for Inter-warehouse Transfer */}
      {/* {formData.transactionType === "Inter-Warehouse Transfer" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Transfer Status*
          </label>
          <select
            value={formData.interWarehouseTransferStatus}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                interWarehouseTransferStatus: e.target.value,
              }))
            }
            className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
          >
            {transferStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Warehouse Fields for Transfers */}
      {/* {(formData.transactionType === "Inter-Warehouse Transfer" ||
        formData.transactionType === "Failed Transfer Request") && (
        <div className="space-y-4"> */}
      {/* From Warehouse */}
      {/* <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              From Warehouse*
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search source warehouse..."
                value={fromWarehouseSearch}
                onChange={(e) => setFromWarehouseSearch(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
              />
              {fromWarehouseSearch && (
                <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
                  {filteredFromWarehouses.map((warehouse) => (
                    <div
                      key={warehouse._id}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          fromWarehouseId: warehouse._id,
                        }));
                        setWarehouses([]);
                        setFromWarehouseSearch(warehouse.name);
                      }}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {warehouse.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div> */}

      {/* To Warehouse */}
      {/* <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              To Warehouse*
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search destination warehouse..."
                value={toWarehouseSearch}
                onChange={(e) => setToWarehouseSearch(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
              />
              {toWarehouseSearch && (
                <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
                  {filteredToWarehouses.map((warehouse) => (
                    <div
                      key={warehouse._id}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          toWarehouseId: warehouse._id,
                        }));
                        setWarehouses([]);
                        setToWarehouseSearch(warehouse.name);
                      }}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {warehouse.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )} */}

      {/* Warehouse */}
      {[
        "Addition/Removal of Product From Warehouse",
        "Customer Return",
        "Restock Transaction",
        "Supplier Return",
        "Sales Transaction",
      ].includes(formData.transactionType) && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Warehouse*
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Warehouse..."
              value={warehouseSearch}
              onChange={(e) => {
                setWarehouseSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none"
            />
            {warehouseSearch && showDropdown && warehouses.length > 0 && (
              <div className="absolute z-10 w-full mt-1 max-h-48 sm:max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
                {filteredWarehouses.map((warehouse) => (
                  <div
                    key={warehouse._id}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        warehouseId: warehouse._id,
                      }));
                      setWarehouseSearch(warehouse.name);
                      setShowDropdown(false);
                    }}
                    className="p-2 text-sm sm:text-base hover:bg-gray-100 cursor-pointer"
                  >
                    {warehouse.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Selection */}
      <div className="space-y-2 sm:space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Products*
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search and add products..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none"
          />
          {productSearch && (
            <div className="absolute z-10 w-full mt-1 max-h-48 sm:max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  onClick={() => addProduct(product._id)}
                  className="p-2 text-sm sm:text-base hover:bg-gray-100 cursor-pointer"
                >
                  {product.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Products List */}
        <div className="space-y-2">
          {formData.products.map((selectedProduct) => {
            const product = allProducts.find(
              (p) => p._id === selectedProduct.productId
            );
            return product ? (
              <div
                key={product._id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2 sm:p-3 border rounded-md bg-gray-50"
              >
                <span className="font-medium text-sm sm:text-base flex-grow">
                  {product.name}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedProduct.quantity}
                    onChange={(e) =>
                      handleProductQuantityChange(
                        product._id,
                        parseInt(e.target.value)
                      )
                    }
                    className="w-20 sm:w-24 p-1 border rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => removeProduct(product._id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* Supplier */}
      {["Restock Transaction", "Supplier Return"].includes(
        formData.transactionType
      ) && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Supplier*
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Supplier..."
              value={supplierSearch}
              onChange={(e) => {
                setSupplierSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full p-2 border border-gray-300 rounded text-sm sm:text-base focus:border-2 focus:border-green-700 outline-none"
            />
            {supplierSearch && showDropdown && suppliers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 max-h-48 sm:max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
                {filteredSuppliers.map((supplier) => (
                  <div
                    key={supplier._id}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        supplierId: supplier._id,
                      }));
                      setSupplierSearch(supplier.name);
                      setShowDropdown(false);
                    }}
                    className="p-2 text-sm sm:text-base hover:bg-gray-100 cursor-pointer"
                  >
                    {supplier.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-blue-500 text-white py-2 px-4 rounded-md text-sm sm:text-base hover:bg-blue-700 transition-colors ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Creating..." : "Create Transaction"}
      </button>
    </form>
  );
};

export default InventoryTransactionForm;

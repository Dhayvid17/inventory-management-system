"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import {
  InventoryTransaction,
  InventoryTransactionEditFormProps,
} from "@/app/types/inventory-transaction";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import Spinner from "@/app/components/Spinner";

//LOGIC TO CONNECT TO THE BACKEND SERVER
const fetchInventoryData = async (id: string, token: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/inventory-transactions/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
};

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

interface Customer {
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
  customerId: string;
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
    customerId: "",
    action: "",
    interWarehouseTransferStatus: "Pending",
    staffId: "",
  });

  const router = useRouter();
  const params = useParams();
  //State for validation
  const [errors, setErrors] = useState("");

  //State for dropdown data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  //State for search filters
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [fromWarehouseSearch, setFromWarehouseSearch] = useState("");
  const [toWarehouseSearch, setToWarehouseSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const { state } = useAuthContext();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const id = params.id;

  const transactionTypes = [
    "Restock Transaction",
    "Sales Transaction",
    "Online Order",
    "Damaged Product",
    "Supplier Return",
    "Customer Return",
    "Inter-Warehouse Transfer",
    "Addition/Removal of Product From Warehouse",
    "Failed Transfer Request",
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

  //Fetch data on component mount
  useEffect(() => {
    //Check if the authentication state is still loading
    if (state.isLoading) {
      <Spinner />;
      return;
    }

    if (!state.token || !state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    if (!isStaffAdmin) {
      setErrors("You are not authorized to edit this transaction.");
      return;
    }
    //Fetch data on component mount
    const fetchData = async () => {
      try {
        const [warehousesRes, suppliersRes, customersRes, productsRes] =
          await Promise.all([
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
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${state.token}`,
              },
            }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${state.token}`,
              },
            }),
          ]);

        const warehousesData = await warehousesRes.json();
        const suppliersData = await suppliersRes.json();
        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        setWarehouses(warehousesData);
        setSuppliers(suppliersData);
        setCustomers(customersData);
        setAllProducts(productsData);
      } catch (error: any) {
        setErrors(error.message);
        console.error("Error fetching data:", error);
      }
    };

    const fetchTransaction = async () => {
      try {
        const transactionData = await fetchInventoryData(
          id as string,
          state.token || ""
        );
        //Process the fetched transaction data
        const processedTransactionData = {
          ...transactionData,
          products: [], // Explicitly clear previous products
        };
        setFormData(processedTransactionData);
      } catch (error: any) {
        setErrors(error.message);
        console.error("Error fetching transaction:", error);
      }
    };

    fetchData();
    fetchTransaction();
  }, [
    id,
    state.isLoading,
    state.isAuthenticated,
    state.token,
    isStaffAdmin,
    router,
  ]);

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
      (formData.transactionType === "Inter-Warehouse Transfer" ||
        formData.transactionType === "Failed Transfer Request") &&
      (!formData.fromWarehouseId || !formData.toWarehouseId)
    ) {
      setErrors(
        "Both source and destination warehouses are required for transfers"
      );
      return false;
    }

    if (
      [
        "Addition/Removal of Product From Warehouse",
        "Online Order",
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

    if (
      ["Online Order", "Customer Return"].includes(formData.transactionType) &&
      !formData.customerId
    ) {
      setErrors("Customer is required for this transaction type");
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
    setErrors("");

    try {
      //Prepare the form data including staffId directly
      const transactionData = {
        ...formData,
        staffId: state.user?.id, // Include staffId directly in the request body
        //Ensure only current products are submitted
        products: formData.products
          .map((product) => ({
            productId: product.productId,
            quantity: product.quantity,
          }))
          .filter((product) => product.productId && product.quantity > 0), // Additional filtering
      };
      //Clear previous products
      if (transactionData.products.length === 0) {
        setErrors("No valid products to submit.");
        setLoading(false);
        return;
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory-transactions/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify(transactionData),
        }
      );
      if (!response.ok) {
        throw new Error(response.statusText || "Failed to submit data.");
      }
      router.push("/inventory-transactions");
      router.refresh();
    } catch (error: any) {
      console.error("Error submitting form:", error.message);
      setErrors(error.message);
      console.log("Validation Errors:", errors);
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
    if (formData.products.some((product) => product.productId === productId)) {
      setErrors("Product already added");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { productId, quantity: 1 }],
    }));
    setProductSearch("");
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

  const filteredCustomers = customers.filter((c) =>
    c.name?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  //HANDLE FORM FIELD CHANGES
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
            You are not authorized to edit this Inventory Transaction.
          </span>
        </div>
      </div>
    );
  }

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          Edit Inventory Transaction
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Error Messages */}
          {errors && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded relative mb-4 text-sm sm:text-base">
              <span className="block pr-8">{errors}</span>
              <button
                onClick={() => setErrors("")}
                className="absolute top-0 right-0 p-2 sm:p-3"
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

          {/* Form Fields */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Transaction Type */}
            <div className="space-y-1 sm:space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Transaction Type*
              </label>
              <select
                name="transactionType"
                value={formData.transactionType}
                onChange={handleChange}
                className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded focus:border-2 focus:border-green-700 outline-none cursor-pointer"
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
                  className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded focus:border-2 focus:border-green-700 outline-none cursor-pointer"
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
          )} */}

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
              "Online Order",
              "Customer Return",
              "Restock Transaction",
              "Supplier Return",
              "Sales Transaction",
            ].includes(formData.transactionType) && (
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Warehouse*
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Warehouse..."
                    value={warehouseSearch}
                    onChange={(e) => setWarehouseSearch(e.target.value)}
                    className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded focus:border-2 focus:border-green-700 outline-none cursor-pointer"
                  />
                  {warehouseSearch && warehouses.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 max-h-48 sm:max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
                      {filteredWarehouses.map((warehouse) => (
                        <div
                          key={warehouse._id}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              warehouseId: warehouse._id,
                            }));
                            setWarehouses([]);
                            setWarehouseSearch(warehouse.name);
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

            {/* Products Selection with Individual Quantity Inputs */}
            <div className="space-y-2 sm:space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Products*
              </label>

              {/* Product Search and Add */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search and add products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded focus:border-2 focus:border-green-700 outline-none pointer-cursor"
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

              {/* Selected Products List with Quantity Inputs */}
              <div className="space-y-2">
                {formData.products.map((selectedProduct) => {
                  const product = allProducts.find(
                    (p) => p._id === selectedProduct.productId
                  );
                  return product ? (
                    <div
                      key={product._id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 border rounded-md bg-gray-50"
                    >
                      <span className="font-medium text-sm sm:text-base">
                        {product.name}
                      </span>
                      <div className="flex items-center gap-2 ml:auto">
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
                          className="w-20 sm:w-24 p-1 text-sm sm:text-base border rounded"
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
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Supplier*
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Supplier..."
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
                  />
                  {supplierSearch && (
                    <div className="absolute z-10 w-full mt-1 max-h-48 sm:max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
                      {filteredSuppliers.map((supplier) => (
                        <div
                          key={supplier._id}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              supplierId: supplier._id,
                            }));
                            setSuppliers([]);
                            setSupplierSearch(supplier.name);
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

            {/* Customer */}
            {["Online Order", "Customer Return"].includes(
              formData.transactionType
            ) && (
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Customer*
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Customer..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded focus:border-2 focus:border-green-700 outline-none cursor-pointer"
                  />
                  {customerSearch && (
                    <div className="absolute z-10 w-full mt-1 max-h-48 sm:max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer._id}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              customerId: customer._id,
                            }));
                            setCustomers([]);
                            setCustomerSearch(customer.name);
                          }}
                          className="p- text-sm sm:text-base hover:bg-gray-100 cursor-pointer"
                        >
                          {customer.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base
              ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? "Updating..." : "Update Transaction"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default InventoryTransactionForm;

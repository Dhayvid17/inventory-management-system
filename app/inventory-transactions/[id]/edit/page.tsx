"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import {
  InventoryTransaction,
  InventoryTransactionEditFormProps,
} from "@/app/types/inventory-transaction";

//LOGIC TO CONNECT TO THE BACKEND SERVER
const fetchInventoryData = async (id: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/inventory-transactions/${id}`,
    {
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = res.json();
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
const InventoryTransactionForm: React.FC<
  InventoryTransactionEditFormProps
> = () => {
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
  const [errors, setErrors] = useState<string[]>([]);

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
    const fetchData = async () => {
      try {
        const [warehousesRes, suppliersRes, customersRes, productsRes] =
          await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`),
          ]);

        const warehousesData = await warehousesRes.json();
        const suppliersData = await suppliersRes.json();
        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        setWarehouses(warehousesData);
        setSuppliers(suppliersData);
        setCustomers(customersData);
        setAllProducts(productsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchTransaction = async () => {
      try {
        const transactionData = await fetchInventoryData(id as string);
        setFormData(transactionData);
      } catch (error) {
        console.error("Error fetching transaction:", error);
      }
    };

    fetchData();
    fetchTransaction();

    //Decode token to set staffId
    const token = localStorage.getItem("token");
    if (token) {
      const decoded: { staffId: string } = jwtDecode(token);
      setFormData((prev) => ({
        ...prev,
        staffId: decoded.staffId,
      }));
    }
  }, [id]);

  //LOGIC TO VALIDATE FORM
  const validateForm = () => {
    const newErrors: string[] = [];
    //Basic validation
    if (!formData.transactionType) {
      newErrors.push("Transaction type is required");
    }

    if (formData.products.length === 0) {
      newErrors.push("At least one product is required");
    }

    //Validate quantities
    if (formData.products.some((p) => !p.quantity || p.quantity <= 0)) {
      newErrors.push("All products must have a valid quantity");
    }

    //Conditional validation based on transaction type
    if (
      formData.transactionType ===
        "Addition/Removal of Product From Warehouse" &&
      !formData.action
    ) {
      newErrors.push("Action is required for this transaction type");
    }

    if (
      (formData.transactionType === "Inter-Warehouse Transfer" ||
        formData.transactionType === "Failed Transfer Request") &&
      (!formData.fromWarehouseId || !formData.toWarehouseId)
    ) {
      newErrors.push(
        "Both source and destination warehouses are required for transfers"
      );
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
      newErrors.push("Warehouse is required for this transaction type");
    }

    if (
      ["Restock Transaction", "Supplier Return"].includes(
        formData.transactionType
      ) &&
      !formData.supplierId
    ) {
      newErrors.push("Supplier is required for this transaction type");
    }

    if (
      ["Online Order", "Customer Return"].includes(formData.transactionType) &&
      !formData.customerId
    ) {
      newErrors.push("Customer is required for this transaction type");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory-transactions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to create transaction");
      setLoading(false);
      router.push("/inventory-transactions");
    } catch (error) {
      console.error("Error submitting form:", error);
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

  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Edit Inventory Transaction</h1>
      <div>
        {errors.length > 0 && (
          <div>
            <ul>
              {errors.map((error, index) => (
                <li key={index} style={{ color: "red" }}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto p-6 space-y-6"
        >
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              <ul className="list-disc pl-5">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Transaction Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Transaction Type*
            </label>
            <select
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Action*
              </label>
              <select
                name="action"
                value={formData.action}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
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
          {formData.transactionType === "Inter-Warehouse Transfer" && (
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
          {(formData.transactionType === "Inter-Warehouse Transfer" ||
            formData.transactionType === "Failed Transfer Request") && (
            <div className="space-y-4">
              {/* From Warehouse */}
              <div className="space-y-2">
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
              </div>

              {/* To Warehouse */}
              <div className="space-y-2">
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
          )}

          {/* Warehouse */}
          {[
            "Addition/Removal of Product From Warehouse",
            "Online Order",
            "Customer Return",
            "Restock Transaction",
            "Supplier Return",
            "Sales Transaction",
          ].includes(formData.transactionType) && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Warehouse*
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Warehouse..."
                  value={warehouseSearch}
                  onChange={(e) => setWarehouseSearch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
                />
                {warehouseSearch && warehouses.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
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
                        className="p-2 hover:bg-gray-100 cursor-pointer"
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
          <div className="space-y-4">
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
                className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
              />
              {productSearch && (
                <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => addProduct(product._id)}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
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
                    className="flex items-center gap-4 p-3 border rounded-md bg-gray-50"
                  >
                    <span className="flex-grow font-medium">
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
                        className="w-24 p-1 border rounded"
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
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Supplier*
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Supplier..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
                />
                {supplierSearch && (
                  <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
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
                        className="p-2 hover:bg-gray-100 cursor-pointer"
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
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Customer*
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Customer..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
                />
                {customerSearch && (
                  <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border rounded-md shadow-lg">
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
                        className="p-2 hover:bg-gray-100 cursor-pointer"
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
            className={`w-full bg-blue-500 text-white py-2 px-4 mt-2 rounded-md hover:bg-blue-700 transition-colors ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating..." : "Create Transaction"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default InventoryTransactionForm;

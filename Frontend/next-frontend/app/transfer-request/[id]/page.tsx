"use client";

import Spinner from "@/app/components/Spinner";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import { Product, TransferRequest } from "@/app/types/transfer-request";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import NotFound from "../not-found";
import Modal from "@/app/components/Modal";

//Custom SVG Icons
const MapPinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
);

const PackageIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
    />
  </svg>
);

const DollarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.172-.879-1.172-2.303 0-3.182s3.07-.879 4.242 0l.879.659m-3-2.818v-3"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5 text-green-600"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 12.75l6 6 9-13.5"
    />
  </svg>
);

const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5 text-red-600"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

interface ProductStatus {
  status: "Pending" | "Accepted" | "Rejected";
  note: string;
}

interface ProductStatuses {
  [key: string]: ProductStatus;
}

interface ProductApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSubmit: (
    formattedProducts: Array<{
      productId: string;
      newStatus: string;
      note: string;
    }>,
    generalNote: string
  ) => void;
  isLoading: boolean;
}

interface TransferRequestActions {
  onApprove: (note?: string) => Promise<void>;
  onDecline: (note?: string) => Promise<void>;
  onCancel: (note?: string) => Promise<void>;
  onMarkInTransit: (note?: string) => Promise<void>;
  onComplete: (note?: string) => Promise<void>;
  onFailedTransfer: (note?: string) => Promise<void>;
  onTransferProducts: (note?: string) => Promise<void>;
}

interface TransferRequestDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE TRANSFER REQUEST DETAILS FROM THE BACKEND SERVER
async function getTransferDetail(id: string, token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/transfer-request/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch transfer request: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

//UTILITY FUNCTION FOR TRANSFER STATUS
const handleTransferStatus = async (
  id: string,
  status: string,
  note: string | undefined,
  token: string
) => {
  let endpoint;
  switch (status) {
    case "Approved":
      endpoint = `${process.env.NEXT_PUBLIC_API_URL}/transfer-request/${id}/approval`;
      break;
    case "Declined":
      endpoint = `${process.env.NEXT_PUBLIC_API_URL}/transfer-request/${id}/decline`;
      break;
    case "Cancelled":
      endpoint = `${process.env.NEXT_PUBLIC_API_URL}/transfer-request/${id}/cancel`;
      break;
    case "In Transit":
      endpoint = `${process.env.NEXT_PUBLIC_API_URL}/transfer-request/${id}/in-transit`;
      break;
    case "Failed Transfer Request":
      endpoint = `${process.env.NEXT_PUBLIC_API_URL}/transfer-request/${id}/failed-transfer`;
      break;
    case "Completed":
      endpoint = `${process.env.NEXT_PUBLIC_API_URL}/transfer-request/${id}/complete`;
      break;
    case "Transferred":
      endpoint = `${process.env.NEXT_PUBLIC_API_URL}/transfer-request/${id}/transfer-products`;
      break;
    default:
      throw new Error(`Unsupported status: ${status}`);
  }

  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, note }),
    });

    if (!response.ok) {
      throw new Error("Failed to update transfer status");
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    throw new Error(error.message || "Error updating transfer status");
  }
};

//Product Approval Modal Component
const ProductApprovalModal: React.FC<ProductApprovalModalProps> = ({
  isOpen,
  onClose,
  products,
  onSubmit,
  isLoading,
}) => {
  const [productStatuses, setProductStatuses] = useState<ProductStatuses>(
    products.reduce(
      (acc, product) => ({
        ...acc,
        [product.productId._id]: {
          status: "Pending",
          note: "",
        },
      }),
      {}
    )
  );

  const [generalNote, setGeneralNote] = useState<string>("");
  const [isSubmitEnabled, setIsSubmitEnabled] = useState<boolean>(false);
  const handleStatusChange = (
    productId: string,
    newStatus: "Pending" | "Accepted" | "Rejected"
  ) => {
    setProductStatuses((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        status: newStatus,
      },
    }));
  };

  const handleNoteChange = (productId: string, note: string) => {
    setProductStatuses((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        note,
      },
    }));
  };

  const handleSubmit = () => {
    const formattedProducts = Object.entries(productStatuses).map(
      ([productId, data]) => ({
        productId,
        newStatus: data.status,
        note: data.note,
      })
    );

    onSubmit(formattedProducts, generalNote);
  };

  //Check If all products are checked before submitting
  useEffect(() => {
    const isSubmitEnabled = products.every(
      (product) => productStatuses[product.productId._id]?.status !== "Pending"
    );
    setIsSubmitEnabled(isSubmitEnabled);
  }, [products, productStatuses]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b">
          <h2 className="text-xl md:text-2xl font-bold">
            Review Transfer Products
          </h2>
        </div>

        <div className="p-4 space-y-4">
          {products.map((product) => (
            <div
              key={product.productId._id}
              className="bg-gray-50 p-3 md:p-4 rounded-lg"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold break-words">{product.name}</h3>
                  <p className="text-sm text-gray-600">
                    Quantity: {product.quantity}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      handleStatusChange(product.productId._id, "Accepted")
                    }
                    className={`px-3 py-1 rounded text-sm md:text-base flex-1 sm:flex-none ${
                      productStatuses[product.productId._id]?.status ===
                      "Accepted"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() =>
                      handleStatusChange(product.productId._id, "Rejected")
                    }
                    className={`px-3 py-1 rounded text-sm md:text-base flex-1 sm:flex-none ${
                      productStatuses[product.productId._id]?.status ===
                      "Rejected"
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>
              <textarea
                placeholder="Add note for this product (optional)"
                value={productStatuses[product.productId._id]?.note || ""}
                onChange={(e) =>
                  handleNoteChange(product.productId._id, e.target.value)
                }
                className="mt-2 w-full p-2 border rounded text-blue-950 border-gray-300 focus:border-2 focus:border-green-700 outline-none cursor-pointer text-sm md:text-base"
                rows={2}
              />
            </div>
          ))}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Note (Optional)
            </label>
            <textarea
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              placeholder="Add a general note for this transfer"
              className="w-full text-blue-950 p-2 border border-gray-300 rounded focus:border-2 focus:border-green-700 outline-none cursor-pointer text-sm md:text-base"
              rows={2}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white p-4 border-t">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded transition-colors hover:bg-gray-300 text-sm md:text-base w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isSubmitEnabled}
              className="px-4 py-2 bg-blue-500 text-white rounded transition-colors hover:bg-blue-700 disabled:opacity-50 text-sm md:text-base w-full sm:w-auto"
            >
              {isLoading ? "Processing..." : "Submit Approval"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

//Action Buttons Component
const ActionButtons = ({
  transferRequest,
  isFromWarehouseManager,
  isToWarehouseManager,
  onAction,
}: {
  transferRequest: TransferRequest;
  isFromWarehouseManager: boolean;
  isToWarehouseManager: boolean;
  onAction: TransferRequestActions;
}) => {
  const [note, setNote] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [actionType, setActionType] = useState<
    | "Approve"
    | "Decline"
    | "Cancelled"
    | "In Transit"
    | "Completed"
    | "Failed Transfer Request"
    | "Transferred"
    | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (
    action:
      | "Approve"
      | "Decline"
      | "Cancelled"
      | "In Transit"
      | "Completed"
      | "Failed Transfer Request"
      | "Transferred"
  ) => {
    setActionType(action);
    setShowNoteModal(true);
  };

  const handleNoteSubmit = async () => {
    setIsLoading(true);
    try {
      switch (actionType) {
        case "Approve":
          await onAction.onApprove(note);
          break;
        case "Decline":
          await onAction.onDecline(note);
          break;
        case "Cancelled":
          await onAction.onCancel(note);
          break;
        case "In Transit":
          await onAction.onMarkInTransit(note);
          break;
        case "Completed":
          await onAction.onComplete(note);
          break;
        case "Failed Transfer Request":
          await onAction.onFailedTransfer(note);
          break;
        case "Transferred":
          await onAction.onTransferProducts(note);
          break;
      }
      setShowNoteModal(false);
      setNote("");
    } catch (error: any) {
      console.error("Action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  //Check if all products are accepted or rejected before displaying MARK IN TRANSIT
  const canMarkInTransit = transferRequest.products.every(
    (product) => product.status === "Accepted" || product.status === "Rejected"
  );

  //Label name for each action
  const getActionLabel = (action: string) => {
    switch (action) {
      case "Approve":
        return "Approve Transfer Request";
      case "Decline":
        return "Decline Transfer Request";
      case "Cancelled":
        return "Cancel Transfer Request";
      case "In Transit":
        return "Mark as In Transit";
      case "Completed":
        return "Complete Transfer Request";
      case "Failed Transfer Request":
        return "Failed Transfer Request";
      case "Transferred":
        return "Transfer Products Request";
      default:
        return action;
    }
  };

  return (
    <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
      {transferRequest.status === "Pending" && isFromWarehouseManager && (
        <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
          <button
            onClick={() => handleAction("Approve")}
            disabled={isLoading}
            className="w-full sm:w-auto bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            Approve Transfer Request
          </button>
          <button
            onClick={() => handleAction("Decline")}
            disabled={isLoading}
            className="w-full sm:w-auto bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            Decline Transfer Request
          </button>
        </div>
      )}

      {transferRequest.status === "Approved" && isFromWarehouseManager && (
        <button
          onClick={() => handleAction("In Transit")}
          disabled={!canMarkInTransit || isLoading}
          className={`w-full sm:w-auto bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-900 transition-colors disabled:opacity-50 text-sm sm:text-base ${
            !canMarkInTransit ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {!canMarkInTransit
            ? "Pending Product Approvals"
            : "Mark as In Transit"}
        </button>
      )}

      {/* From Warehouse Manager - Failed Transfer */}
      {transferRequest.status === "In Transit" && isFromWarehouseManager && (
        <button
          onClick={() => handleAction("Failed Transfer Request")}
          className="w-full sm:w-auto bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-red-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
        >
          Failed Transfer Request
        </button>
      )}

      {/* To Warehouse Manager - Transfer Products */}
      {transferRequest.status === "In Transit" && isToWarehouseManager && (
        <button
          onClick={() => handleAction("Completed")}
          className="w-full sm:w-auto bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
        >
          Complete Transfer
        </button>
      )}

      {/* Transfer Products - Only if Completed and To Warehouse Manager */}
      {transferRequest.status === "Completed" && isToWarehouseManager && (
        <button
          onClick={() => handleAction("Transferred")}
          className="w-full sm:w-auto bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
        >
          Transfer Products
        </button>
      )}

      {(isFromWarehouseManager || isToWarehouseManager) &&
        (transferRequest.status === "Pending" ||
          transferRequest.status === "Approved") && (
          <button
            onClick={() => handleAction("Cancelled")}
            disabled={isLoading}
            className="w-full sm:w-auto bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            Cancel Transfer
          </button>
        )}

      {/* Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl text-blue-950 font-bold mb-3 sm:mb-4">
              Review Transfer Request
            </h2>
            <div className="p-3 sm:p-6">
              <h2 className="text-lg sm:text-2xl text-blue-950 font-bold mb-3 sm:mb-4">
                {getActionLabel(actionType || "")}
              </h2>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none text-sm sm:text-base"
                rows={3}
              />
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="w-full sm:w-auto bg-gray-300 px-3 sm:px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNoteSubmit}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-900 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {isLoading ? "Processing..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

//LOGIC TO DISPLAY TRANSFER REQUEST DETAIL PAGE
export default function TransferRequestDetailPage({
  params,
}: TransferRequestDetailPageProps) {
  const [transferRequest, setTransferRequest] =
    useState<TransferRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showProductApprovalModal, setShowProductApprovalModal] =
    useState(false);
  const [isFromWarehouseManager, setIsFromWarehouseManager] = useState(false);
  const [isToWarehouseManager, setIsToWarehouseManager] = useState(false);

  const { state } = useAuthContext();
  const router = useRouter();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const isAdmin = state.user?.role === "admin";

  //Unwrap params using React.use()
  const { id } = React.use(params);

  //Handle Product Status Submission
  const handleProductStatusSubmit = async (
    formattedProducts: Array<{
      productId: string;
      newStatus: string;
      note: string;
    }>,
    generalNote: string
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transfer-request/${id}/product-status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            products: formattedProducts,
            generalNote,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update product status");
      }

      //Fetch the full transfer request details
      const detailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transfer-request/${id}`,
        {
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!detailResponse.ok) {
        throw new Error("Failed to fetch updated transfer request details");
      }

      const updatedTransfer = await detailResponse.json();
      //Add a null check before setting state
      if (updatedTransfer && updatedTransfer.fromWarehouseId) {
        setTransferRequest(updatedTransfer);
        setShowProductApprovalModal(false);
      } else {
        console.error(
          "Received invalid transfer request data:",
          updatedTransfer
        );
        setError("Received invalid transfer request data");
      }
    } catch (error: any) {
      setError(error.message);
      console.error("Error updating product statuses:", error);
    }
  };

  //Fetch Transfer-Request from Backend
  const fetchTransferRequest = useCallback(async () => {
    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    if (!isStaffAdmin) {
      router.push("/unauthorized"); //Redirect to 403 if not staff admin
    }
    try {
      const data = await getTransferDetail(id, state.token || "");
      setTransferRequest(data);
      setError(null);
    } catch (error: any) {
      setTransferRequest(null);
      setError(error.message);
      console.error("Error fetching transfer request:", error);
    } finally {
      setIsLoading(false);
    }
  }, [state.isAuthenticated, isStaffAdmin, state.token, id, router]);

  //Set up useEffect for fetching transfer request data and set Interval every 5 seconds to refresh
  useEffect(() => {
    //Initial fetch
    fetchTransferRequest();

    //Set up interval for polling (every 5 seconds)
    const intervalId = setInterval(() => {
      //Only poll if the transfer is not in a final state
      if (
        transferRequest &&
        ![
          "Completed",
          "Transferred",
          "Cancelled",
          "Failed Transfer Request",
        ].includes(transferRequest.status)
      ) {
        fetchTransferRequest();
      }
    }, 5000); //Poll every 5 seconds

    //Cleanup function to clear interval when component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [
    id,
    isStaffAdmin,
    state.isAuthenticated,
    state.token,
    router,
    fetchTransferRequest,
    transferRequest,
    transferRequest?.status,
  ]);

  useEffect(() => {
    const checkWarehouseManager = async () => {
      if (transferRequest && state.user) {
        const fromWarehouse = transferRequest.fromWarehouseId;
        const toWarehouse = transferRequest.toWarehouseId;

        setIsFromWarehouseManager(
          fromWarehouse.managedBy.includes(state.user.id)
        );
        setIsToWarehouseManager(toWarehouse.managedBy.includes(state.user.id));
      }
    };

    checkWarehouseManager();
  }, [transferRequest, state.user]);

  //HANDLE APPROVE LOGIC
  const handleApprove = async (note?: string) => {
    try {
      const updatedTransfer = await handleTransferStatus(
        id,
        "Approved",
        note,
        state.token || ""
      );
      setTransferRequest(updatedTransfer);
      setShowProductApprovalModal(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  //HANDLE DECLINE LOGIC
  const handleDecline = async (note?: string) => {
    try {
      const updatedTransfer = await handleTransferStatus(
        id,
        "Declined",
        note,
        state.token || ""
      );
      setTransferRequest(updatedTransfer);
    } catch (error: any) {
      setError(error.message);
    }
  };

  //HANDLE CANCEL LOGIC
  const handleCancel = async () => {
    try {
      const updatedTransfer = await handleTransferStatus(
        id,
        "Cancelled",
        undefined,
        state.token || ""
      );
      setTransferRequest(updatedTransfer);
    } catch (error: any) {
      setError(error.message);
    }
  };

  //HANDLE MARK IN TRANSIT LOGIC
  const handleMarkInTransit = async () => {
    try {
      const updatedTransfer = await handleTransferStatus(
        id,
        "In Transit",
        undefined,
        state.token || ""
      );
      setTransferRequest(updatedTransfer);
    } catch (error: any) {
      setError(error.message);
    }
  };

  //HANDLE COMPLETE LOGIC
  const handleComplete = async () => {
    try {
      const updatedTransfer = await handleTransferStatus(
        id,
        "Completed",
        undefined,
        state.token || ""
      );
      setTransferRequest(updatedTransfer);
    } catch (error: any) {
      setError(error.message);
    }
  };

  //HANDLE FAILED TRANSFER LOGIC
  const handleFailedTransfer = async () => {
    try {
      const updatedTransfer = await handleTransferStatus(
        id,
        "Failed Transfer Request",
        undefined,
        state.token || ""
      );
      setTransferRequest(updatedTransfer);
    } catch (error: any) {
      console.error("Failed Transfer Request Error:", error.message);
      setError(error.message);
    }
  };

  //HANDLE TRANSFER PRODUCT LOGIC
  const handleTransferProducts = async () => {
    try {
      const updatedTransfer = await handleTransferStatus(
        id,
        "Transferred",
        undefined,
        state.token || ""
      );
      setTransferRequest(updatedTransfer);
    } catch (error: any) {
      setError(error.message);
    }
  };

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    setIsDeleting(true);

    if (!isAdmin) {
      setError("You are not authorized to delete this transfer request");
      return;
    }
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transfer-request/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
      });
      alert("Transfer Request deleted successfully!");
      router.push("/transfer-request");
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting transfer request:", error);
      alert(`Error deleting transfer request: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Declined":
        return "bg-red-100 text-red-800";
      case "In Transit":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Failed Transfer Request":
        return "bg-red-100 text-red-800";
      case "Transferred":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  //DISPLAY ERROR MESSAGE
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md max-w-md mx-auto relative"
          role="alert"
        >
          <strong className="font-bold text-lg">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
          <button
            className="absolute top-2 right-2 text-red-500 hover:text-red-700 focus:outline-none"
            onClick={() => {
              /* Add your close handler here */
            }}
            aria-label="Close error message"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 10-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 101.414 1.414L10 11.414l2.934 2.934a1 1 0 001.414-1.414L11.414 10l2.934-2.934a1 1 0 000-1.414z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  //LOGIC TO DISPLAY NOT-FOUND IS CATEGORY DATA RETURN NULL
  if (!transferRequest) {
    return <NotFound />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gray-50 p-4 md:p-6 border-b">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Transfer Request Details
              </h1>
              <p className="text-gray-500 mt-2">
                Transfer ID: {transferRequest._id}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                transferRequest.status
              )}`}
            >
              {transferRequest.status}
            </div>
            <div className="mt-6 flex justify-end">
              {isAdmin && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Delete Transfer Request
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Add ActionButtons */}
        <ActionButtons
          transferRequest={transferRequest}
          isFromWarehouseManager={isFromWarehouseManager}
          isToWarehouseManager={isToWarehouseManager}
          onAction={{
            onApprove: handleApprove,
            onDecline: handleDecline,
            onCancel: handleCancel,
            onMarkInTransit: handleMarkInTransit,
            onComplete: handleComplete,
            onFailedTransfer: handleFailedTransfer,
            onTransferProducts: handleTransferProducts,
          }}
        />

        {/* Transfer Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 p-4 md:p-6">
          {/* Source Warehouse */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-4">
              <MapPinIcon />
              <h2 className="text-lg font-semibold text-gray-900 ml-2">
                Source Warehouse
              </h2>
            </div>
            <div className="space-y-2">
              <p>
                <strong className="text-gray-700">Name:</strong>{" "}
                {transferRequest?.fromWarehouseId?.name}
              </p>
              <p>
                <strong className="text-gray-700">Location:</strong>{" "}
                {transferRequest?.fromWarehouseId?.location}
              </p>
              <p>
                <strong className="text-gray-700">Total Quantity:</strong>{" "}
                {transferRequest?.fromWarehouseId?.totalQuantity}
              </p>
            </div>
          </div>

          {/* Destination Warehouse */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-4">
              <MapPinIcon />
              <h2 className="text-lg font-semibold text-gray-900 ml-2">
                Destination Warehouse
              </h2>
            </div>
            <div className="space-y-2">
              <p>
                <strong className="text-gray-700">Name:</strong>{" "}
                {transferRequest?.toWarehouseId?.name}
              </p>
              <p>
                <strong className="text-gray-700">Location:</strong>{" "}
                {transferRequest?.toWarehouseId?.location}
              </p>
              <p>
                <strong className="text-gray-700">Total Quantity:</strong>{" "}
                {transferRequest?.toWarehouseId?.totalQuantity}
              </p>
            </div>
          </div>

          {/* Transfer Metadata */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-4">
              <CalendarIcon />
              <h2 className="text-lg font-semibold text-gray-900 ml-2">
                Transfer Dates
              </h2>
            </div>
            <div className="space-y-2">
              <p>
                <strong className="text-gray-700">Request Date:</strong>{" "}
                {formatDate(transferRequest?.requestDate)}
              </p>
              <p>
                <strong className="text-gray-700">Approval Date:</strong>{" "}
                {transferRequest.approvalDate
                  ? formatDate(transferRequest?.approvalDate)
                  : "Not Approved Yet"}
              </p>
            </div>
          </div>

          {/* Initiator & Approver */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-4">
              <UserIcon />
              <h2 className="text-lg font-semibold text-gray-900 ml-2">
                Transfer Participants
              </h2>
            </div>
            <div className="space-y-2">
              <p>
                <strong className="text-gray-700">Requested By:</strong>{" "}
                {transferRequest.requestedBy?.username}
              </p>
              <p>
                <strong className="text-gray-700">Approved By:</strong>{" "}
                {transferRequest.approvedBy?.username}
              </p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="p-4 md:p-6">
          <div className="flex items-center mb-4">
            <PackageIcon />
            <h2 className="text-lg font-semibold text-gray-900 ml-2">
              Transferred Products
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left hidden sm:table">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-gray-900">Product</th>
                  <th className="p-3 text-gray-900">Quantity</th>
                  <th className="p-3 text-gray-900">Price</th>
                  <th className="p-3 text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {transferRequest?.products.map((product: any) => (
                  <tr key={product.productId._id} className="border-b">
                    <td className="p-3">{product.name}</td>
                    <td className="p-3">{product.quantity}</td>
                    <td className="p-3">${product.price.toFixed(2)}</td>
                    <td className="p-3">
                      {product.status === "Accepted" ? (
                        <span className="flex items-center text-green-600">
                          <CheckIcon /> Accepted
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <XIcon /> Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile View: Stack items in cards */}
            <div className="sm:hidden space-y-3">
              {transferRequest.products.map((product: any) => (
                <div
                  key={product.productId._id}
                  className="bg-white p-3 rounded-md shadow"
                >
                  <p className="text-gray-900 font-semibold">{product.name}</p>
                  <p className="text-gray-600 text-sm">
                    Quantity: {product.quantity}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Price: ${product.price.toFixed(2)}
                  </p>
                  <p className="text-sm flex items-center">
                    {product.status === "Accepted" ? (
                      <span className="text-green-600 flex items-center">
                        <CheckIcon /> Accepted
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <XIcon /> Rejected
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-gray-50 p-4 md:p-6 border-t">
          <div className="flex items-center mb-4">
            <DollarIcon />
            <h2 className="text-lg font-semibold text-gray-900 ml-2">
              Financial Summary
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Total Quantity</p>
              <p className="text-xl font-bold">
                {transferRequest?.totalQuantity}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Value</p>
              <p className="text-xl font-bold">
                ${transferRequest?.totalPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Product Approval Modal */}
      {showProductApprovalModal && transferRequest && (
        <ProductApprovalModal
          isOpen={showProductApprovalModal}
          onClose={() => setShowProductApprovalModal(false)}
          products={transferRequest.products}
          onSubmit={handleProductStatusSubmit}
          isLoading={isLoading}
        />
      )}
      {showModal && (
        <Modal
          confirmDelete={handleDelete}
          closeModal={() => setShowModal(false)}
        >
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Confirm Deletion</h2>
            <p>Are you sure you want to delete this transfer request?</p>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

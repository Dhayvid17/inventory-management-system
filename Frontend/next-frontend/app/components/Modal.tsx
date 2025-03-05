import { ReactNode } from "react";

type ModalProps = {
  closeModal: () => void;
  confirmDelete: () => void;
  children: ReactNode;
};

//LOGIC FOR DELETE MODAL
export default function Modal({ closeModal, confirmDelete }: ModalProps) {
  return (
    //Modal
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-semibold text-gray-800">
          Confirm Deletion
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete this transfer request? This action
          cannot be undone.
        </p>
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring focus:ring-red-300 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

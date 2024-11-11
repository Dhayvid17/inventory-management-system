//LOGIC FOR DELETE MODAL
export default function modal() {
  return (
    // Modal
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded shadow-md">
        <h2 className="text-xl mb-4">Confirm Deletion</h2>
        <button className="bg-red-500 text-white py-2 px-4 rounded">
          Confirm
        </button>
      </div>
    </div>
  );
}

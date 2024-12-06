import TransferRequestForm from "@/app/components/transfer-request/TransferRequestForm";

//DISPLAY CREATE PAGE
const CreateTransferRequestPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold my-4">Transfer Request</h1>
      <TransferRequestForm />
    </div>
  );
};

export default CreateTransferRequestPage;

export interface Warehouse {
  _id: string;
  name: string;
  location: string;
  managedBy: string;
  totalQuantity: number;
}

export interface User {
  _id: string;
  username: string;
}

export interface Product {
  productId: {
    _id: string;
  };
  name: string;
  quantity: number;
  price: number;
  status: string;
}

export interface TransferRequest {
  _id: string;
  fromWarehouseId: Warehouse;
  toWarehouseId: Warehouse;
  products: Product[];
  status: string;
  transferType: "SuperToRegular" | "RegularToRegular" | "RegularToSuper";
  totalQuantity: number;
  totalPrice: number;
  requestDate: string;
  approvalDate?: string;
  requestedBy: User;
  approvedBy?: User;
  note?: string;
}

export interface TransferRequestEditFormProps {
  transferRequest: TransferRequest;
}

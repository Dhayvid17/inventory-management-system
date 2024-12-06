export interface Product {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Warehouse {
  _id: string;
  name: string;
  managedBy: string[];
  products: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface TransferRequestPayload {
  fromWarehouseId: string;
  toWarehouseId: string;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
  transferType: "SuperToRegular" | "RegularToRegular" | "RegularToSuper";
  note?: string;
}

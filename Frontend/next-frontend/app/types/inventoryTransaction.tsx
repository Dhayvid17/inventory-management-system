type Product = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export interface InventoryTransaction {
  _id: string;
  action?: string;
  transactionType: string;
  fromWarehouseId?: {
    _id: string;
    name: string;
    location: string;
    capacity: number;
  };
  toWarehouseId?: {
    _id: string;
    name: string;
    location: string;
    capacity: number;
  };
  warehouseId?: {
    _id: string;
    name: string;
    location: string;
    capacity: number;
  };
  products: {
    productId: Product;
    quantity: number;
  }[];
  quantity?: number;
  totalValue: number;
  transactionDate: Date;
  adminId?: {
    _id: string;
    username: string;
  };
  customerId?: {
    _id: string;
    username: string;
  };
  staffId: {
    _id: string;
    username: string;
  };
  supplierId?: {
    _id: string;
    name: string;
  };
  interWarehouseTransferStatus?: string;
  note?: string;
}

export interface InventoryTransactionEditFormProps {
  inventoryTransaction: InventoryTransaction;
}

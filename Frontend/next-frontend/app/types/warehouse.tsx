type ManagedBy = {
  _id: string;
  username: string;
};

type Products = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export interface Warehouse {
  _id: string;
  name: string;
  type: string;
  managedBy: ManagedBy[];
  location: string;
  capacity: number;
  totalQuantity: number;
  totalValue: number;
  products: Products[];
  description: string;
}

export interface WarehouseEditFormProps {
  warehouse: Warehouse;
}

export interface InventoryDetails {
  openingStock: { quantity: number; value: number };
  inflow: { quantity: number; value: number };
  outflow: { quantity: number; value: number };
  closingStock: { quantity: number; value: number };
}

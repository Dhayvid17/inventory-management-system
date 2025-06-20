type Category = {
  _id: string;
  name: string;
};

type Warehouse = {
  _id: string;
  name: string;
  location: string;
};

type Supplier = {
  _id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
};

export interface Product {
  _id: string;
  name: string;
  category: Category;
  price: number;
  quantity: number;
  availableQuantity?: number;
  warehouse: Warehouse;
  supplier: Supplier;
}

export interface ProductEditFormProps {
  product: Product;
}

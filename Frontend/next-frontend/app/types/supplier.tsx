export interface Supplier {
  _id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
}

export interface SupplierEditFormProps {
  supplier: Supplier;
}

type Product = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

type User = {
  _id: string;
  username: string;
};

export interface Order {
  _id: string;
  totalPrice: number;
  totalQuantity: number;
  orderNumber: number;
  products: Product[];
  status: string;
  user: User;
}

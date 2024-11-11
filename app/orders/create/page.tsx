import OrderForm from "@/app/components/order/OrderForm";

//LOGIC TO FETCH PRODUCTS FROM BACKEND API
async function getProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
    next: {
      revalidate: 60,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch orders");
  }
  const data = await res.json();
  return data;
}

//LOGIC TO DISPLAY CREATE ORDER FORM
const OrderPage = async () => {
  const products = await getProducts();
  return (
    <div className="container mx-auto py-8">
      <OrderForm availableProducts={products} />
    </div>
  );
};

export default OrderPage;

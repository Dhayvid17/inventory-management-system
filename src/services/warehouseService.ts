import Product from "../models/productModel";
import Warehouse from "../models/warehouseModel";

//ADD A PRODUCT TO WAREHOUSE AND UPDATE
const addProductToWarehouse = async (
  productId: string,
  warehouseId: string
) => {
  try {
    //Find warehouse by Id
    const warehouse = await Warehouse.findById(warehouseId).populate(
      "products"
    );
    if (!warehouse) {
      throw new Error("Warehouse not found.");
    }
    //Check current total quantity in the warehouse
    const currentTotalQuantity = warehouse.products.reduce(
      (acc: number, product: any) => acc + product.quantity,
      0
    );

    //Check if Product is actually in the warehouse
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    if (currentTotalQuantity + product.quantity > warehouse.capacity) {
      throw new Error("Adding this product would exceed warehouse capacity.");
    }

    //Check if the product's warehouse field matches the warehouseId
    if (product.warehouse?.toString() === warehouseId) {
      throw new Error("Product is already added to this warehouse");
    }
    // First, find the product and update its warehouse reference
    await Product.findByIdAndUpdate(productId, { warehouse: warehouseId });

    //Add product to warehouse
    await Warehouse.findByIdAndUpdate(warehouseId, {
      $addToSet: { products: productId },
    });
  } catch (error: any) {
    console.log("Error adding product to warehouse", error.message);
    throw new Error(error.message || "Could not add product to warehouse...");
  }
};

//REMOVE A PRODUCT FROM THE WAREHOUSE
const removeProductFromWarehouse = async (
  productId: string,
  warehouseId: string
) => {
  try {
    //Check if Product is actually in the warehouse
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    //Check if the product's warehouse field matches the warehouseId
    if (product.warehouse?.toString() !== warehouseId) {
      throw new Error("Product is not in this warehouse");
    }
    //Remove the product reference from the warehouse's products array
    await Warehouse.findByIdAndUpdate(warehouseId, {
      $pull: { products: productId }, // Remove the product from the array
    });

    //Remove the warehouse reference from the product
    await Product.findByIdAndUpdate(productId, {
      $unset: { warehouse: "" },
    });
  } catch (error: any) {
    console.log("Error removing product from warehouse", error.message);
    throw new Error(
      error.message || "Could not remove product from warehouse..."
    );
  }
};

export { addProductToWarehouse, removeProductFromWarehouse };

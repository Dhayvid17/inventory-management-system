import Product from "../models/productModel";
import Warehouse from "../models/warehouseModel";

//ADD A PRODUCT TO WAREHOUSE AND UPDATE
const addProductToWarehouse = async (
  warehouseId: string,
  productId: string
) => {
  try {
    //Add product to warehouse
    await Warehouse.findByIdAndUpdate(warehouseId, {
      $addToSet: { products: productId },
    });

    //Update product to reference warehouse
    await Product.findByIdAndUpdate(productId, {
      $addToSet: { warehouse: warehouseId },
    });
  } catch (error) {
    console.log("Error adding product to warehouse");
    throw new Error("Could not add product to warehouse...");
  }
};

//REMOVE A PRODUCT FROM THE WAREHOUSE
const removeProductFromWarehouse = async (
  warehouseId: string,
  productId: string
) => {
  try {
    //Remove product from warehouse
    await Warehouse.findByIdAndUpdate(warehouseId, {
      $pull: { products: productId },
    });

    //Update product to remove this warehouse reference
    await Product.findByIdAndUpdate(productId, {
      $pull: { warehouse: warehouseId },
    });
  } catch (error) {
    console.log("Error removing product from warehouse");
    throw new Error("Could not remove product from warehouse...");
  }
};

export { addProductToWarehouse, removeProductFromWarehouse };

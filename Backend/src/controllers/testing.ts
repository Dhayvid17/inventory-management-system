// //CREATE TRANSFER REQUEST
// const transferRequest = async (
//     req: Request,
//     res: Response
//   ): Promise<Response | undefined> => {
//     const { fromWarehouseId, toWarehouseId, products, transferType, note } =
//       req.body;
//     const requestedBy = (req as any).user.id; // Automatically populate the user field.
//     if (!fromWarehouseId || !toWarehouseId || !products || !transferType) {
//       return res.status(400).json({ error: "Missing required fields." });
//     }

//     // //Verify if requestedBy is a valid mongoose.Types.ObjectId
//     // if (
//     //   !mongoose.Types.ObjectId.isValid(fromWarehouseId) ||
//     //   !mongoose.Types.ObjectId.isValid(toWarehouseId)
//     // ) {
//     //   return res.status(400).json({ error: "Invalid requestedBy ID" });
//     // }

//     // //Verify if requestedBy user is managed by toWarehouseId
//     // const toWarehouse = await Warehouse.findById(toWarehouseId);
//     // const fromWarehouse = await Warehouse.findById(fromWarehouseId);
//     // if (!toWarehouse || !toWarehouse.managedBy.includes(requestedBy)) {
//     //   return res
//     //     .status(400)
//     //     .json({ error: "User is not managed by the specified toWarehouse." });
//     // }

//     // if (!fromWarehouse) {
//     //   return res.status(400).json({ error: "fromWarehouse not found." });
//     // }

//     // //Verify if requestedBy is a valid mongoose.Types.ObjectId
//     // if (!mongoose.Types.ObjectId.isValid(requestedBy)) {
//     //   return res.status(400).json({ error: "Invalid requestedBy ID" });
//     // }

//     // //Check if User is valid
//     // const user = await User.findById(requestedBy);
//     // if (!user) {
//     //   return res.status(404).json({ error: "User not found" });
//     // }

//     //Verify if each productId is in the database and is a mongoose.Types.ObjectId
//     for (const product of products) {
//       if (!mongoose.Types.ObjectId.isValid(product.productId)) {
//         return res
//           .status(400)
//           .json({ error: `Invalid productId: ${product.productId}` });
//       }
//       const productExists = await Product.findById(product.productId);
//       if (!productExists) {
//         return res
//           .status(400)
//           .json({ error: `Product with ID ${product.productId} does not exist` });
//       }
//     }

//     //Verify transferType
//     const validTransferTypes = [
//       "SuperToRegular",
//       "RegularToRegular",
//       "RegularToSuper",
//     ];
//     if (!validTransferTypes.includes(transferType)) {
//       return res.status(400).json({ error: "Invalid transfer type." });
//     }

//     try {
//       const newRequest = await createTransferRequest(
//         mongoose.Types.ObjectId.createFromHexString(fromWarehouseId),
//         mongoose.Types.ObjectId.createFromHexString(toWarehouseId),
//         products,
//         "Pending",
//         mongoose.Types.ObjectId.createFromHexString(requestedBy),
//         transferType,
//         note
//       );
//       if (!newRequest) {
//         return res
//           .status(400)
//           .json({ error: "Failed to create transfer request." });
//       }
//       return res.status(201).json(newRequest);
//     } catch (error: any) {
//       return res.status(500).json({
//         error: "Error creating Transfer Request",
//         details: error.message,
//       });
//     }
//   };

// //GET ALL WAREHOUSES
// const getWarehouses = async (
//     req: Request,
//     res: Response
//   ): Promise<Response | undefined> => {
//     try {
//       //Fetch all warehouses with their products
//       const warehouses = await Warehouse.aggregate([
//         {
//           $lookup: {
//             from: "products", // Collection to join with
//             localField: "_id", // Field from Warehouse
//             foreignField: "warehouse", // Field from Product
//             as: "products", // Alias for the result
//           },
//         },
//         {
//           $project: {
//             name: 1,
//             location: 1,
//             capacity: 1,
//             type: 1,
//             managedBy: 1,
//             products: {
//               _id: 1,
//               name: 1,
//               quantity: 1,
//               price: 1,
//             },
//             totalQuantity: {
//               $cond: {
//                 if: { $gt: [{ $size: "$products" }, 0] },
//                 then: { $sum: "$products.quantity" },
//                 else: 0,
//               },
//             }, // Sum all product quantities only if
//             totalValue: {
//               // Calculate total value
//               $cond: {
//                 if: { $gt: [{ $size: "$products" }, 0] },
//                 then: {
//                   $sum: {
//                     $map: {
//                       input: "$products",
//                       as: "product",
//                       in: {
//                         $multiply: ["$$product.quantity", "$$product.price"],
//                       },
//                     },
//                   },
//                 },
//                 else: 0,
//               },
//             },
//           },
//         },
//       ]);

//       console.log("Fetched warehouses with products");
//       return res.status(200).json(warehouses);
//     } catch (error: any) {
//       return res.status(500).json({ error: error.message });
//     }
//   };

//   // GET A SINGLE WAREHOUSE
//   const getWarehouse = async (
//     req: Request,
//     res: Response
//   ): Promise<Response | undefined> => {
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(404).json({ error: "Invalid warehouse id" });
//     }

//     try {
//       const { id } = req.params;

//       // Fetch the warehouse by ID with its products
//       const warehouse = await Warehouse.aggregate([
//         { $match: { _id: new mongoose.Types.ObjectId(id) } },
//         {
//           $lookup: {
//             from: "products",
//             localField: "_id",
//             foreignField: "warehouse",
//             as: "products",
//           },
//         },
//         {
//           $project: {
//             name: 1,
//             location: 1,
//             capacity: 1,
//             products: {
//               productId: 1,
//               name: 1,
//               quantity: 1,
//               price: 1,
//             },
//             totalQuantity: { $sum: "$products.quantity" },
//             totalValue: {
//               $sum: {
//                 $map: {
//                   input: "$products",
//                   as: "product",
//                   in: { $multiply: ["$$product.price", "$$product.quantity"] },
//                 },
//               },
//             },
//           },
//         },
//       ]);

//       if (!warehouse || warehouse.length === 0) {
//         return res.status(404).json({ error: "Warehouse not found" });
//       }

//       console.log(`Fetched warehouse with ID: ${id}`);
//       return res.status(200).json(warehouse[0]);
//     } catch (error) {
//       return res.status(500).json({ error: "Could not fetch warehouse" });
//     }
//   };

//  //Fetch warehouses associated with the products
//  const warehouseIds = validProducts.map((product) => product.warehouse);
//  const warehouses = await Warehouse.find({
//    _id: { $in: warehouseIds },
//  }).session(session);

//  if (warehouses.length === 0) {
//    return res
//      .status(404)
//      .json({ error: "Warehouse(s) associated with product(s) not found" });
//  }

//  // Map products to their respective warehouse
//  const warehouseProductMap: any = {};

//  validProducts.forEach((product) => {
//    const warehouseId = product.warehouse.toString();
//    if (!warehouseProductMap[warehouseId]) {
//      warehouseProductMap[warehouseId] = [];
//    }
//    warehouseProductMap[warehouseId].push(product);
//  });

// //Update totalQuantity and totalValue in the warehouse
// for (const warehouse of warehouses) {
//     const updatedProducts = warehouse.products.map((product: any) => ({
//       // Ensure both quantity and price are valid numbers, otherwise default to 0
//   let quantity = product.quantity || 0;
//   let price = product.price || 0;

//       return{
//       ...product,
//       totalValue: quantity * price,
//     }
//     }));

//     const newTotalQuantity = updatedProducts.reduce(
//       (acc: number, product) => acc + product.quantity,
//       0
//     );

//     const newTotalValue = updatedProducts.reduce(
//       (acc: number, product) => acc + (product.totalValue || 0),
//       0
//     );

//     await Warehouse.updateOne(
//       { _id: warehouse._id },
//       {
//         $set: {
//           totalQuantity: newTotalQuantity,
//           totalValue: newTotalValue,
//         },
//       },
//       { session }
//     );
//   }

//THIS IS WHERE THE LOGIC STARTED FROM//

// await Promise.all(
//     acceptedProducts.map(async ({ productId, quantity }) => {
//       // Convert productId to ObjectId
//       const productObjectId = new mongoose.Types.ObjectId(productId);

//       // Deduct products from Warehouse B
//       await Warehouse.findOneAndUpdate(
//         { _id: transferRequest.fromWarehouseId, "products.productId": productObjectId },
//         { $inc: { "products.$.quantity": -quantity } }
//       );

//       // Check if Warehouse A already has the product
//       const existingProductInWarehouseA = await Warehouse.findOne({
//         _id: transferRequest.toWarehouseId,
//         "products.productId": productObjectId,
//       });

//       if (existingProductInWarehouseA) {
//         // If product exists in Warehouse A, increase the quantity
//         await Warehouse.findOneAndUpdate(
//           { _id: transferRequest.toWarehouseId, "products.productId": productObjectId },
//           { $inc: { "products.$.quantity": quantity } }
//         );
//       } else {
//         // If product does not exist in Warehouse A, add the product entry
//         await Warehouse.findOneAndUpdate(
//           { _id: transferRequest.toWarehouseId },
//           { $push: { products: { productId: productObjectId, quantity } } }
//         );
//       }

//       // Deduct products from the Products collection overall
//       const product = await Product.findById(productId);
//       product.quantity -= quantity;
//       await product.save();
//     })
//   );

//I have a project I am working on currently, i want to use the aggregation method on the inventory to get the opening stock, inflow, outflow, closing stock of a warehouse, it will be the products quantity * product price, then when i input the warehouse, i want to get these information

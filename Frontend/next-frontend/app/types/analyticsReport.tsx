export interface InventoryStatus {
  name: string;
  price: number;
  quantity: number;
  warehouseName: string;
  categoryName: string;
  supplierName: string;
  totalValue: number;
}

export interface InventoryMovement {
  transactionType: string;
  action?: string;
  products: Array<{
    productId: string;
    name: string;
    quantity: number;
  }>;
  totalValue: number;
  transactionDate: string;
  warehouseName?: string;
  fromWarehouseName?: string;
  toWarehouseName?: string;
  staffName: string;
  interWarehouseTransferStatus?: string;
}

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  categoryId?: string;
  productId?: string;
  transactionType?: string;
  page: number;
  limit: number;
}

export interface InventoryAging {
  productId: string;
  productName: string;
  warehouseName: string;
  quantity: number;
  lastMovementDate: string;
  ageInDays: number;
  ageCategory: string;
}

export interface LowStockProduct {
  name: string;
  price: number;
  quantity: number;
  warehouseName: string;
  categoryName: string;
  supplierName: string;
  stockStatus: "Out of Stock" | "Low Stock";
}

export interface TransferEfficiencyMetrics {
  summary: {
    totalTransfers: number;
    completedTransfers: number;
    failedTransfers: number;
    pendingTransfers: number;
    successRate: string;
  };
  warehousePairs: Array<{
    fromWarehouse: string;
    toWarehouse: string;
    totalTransfers: number;
    completedTransfers: number;
    failedTransfers: number;
    pendingTransfers: number;
    totalValue: number;
    successRate: string;
  }>;
}

export interface DashboardSummary {
  warehouseCount: number;
  inventoryValue: number;
  inventoryQuantity: number;
  recentTransactions: number;
  lowStockProducts: Array<{
    name: string;
    quantity: number;
  }>;
  transactionsByType: Array<{
    _id: string;
    count: number;
  }>;
  productsByCategory: Array<{
    _id: string;
    count: number;
    totalValue: number;
  }>;
}

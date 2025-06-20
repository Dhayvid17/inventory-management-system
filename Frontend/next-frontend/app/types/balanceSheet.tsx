export interface BalanceSheetData {
  timeRange: string;
  dateRange: {
    start: string;
    end: string;
  };
  warehouseInfo: {
    name: string;
    _id?: string;
  };
  summary: {
    startingInventoryValue: number;
    endingInventoryValue: number;
    totalInflow: number;
    totalOutflow: number;
    productMovement: {
      [key: string]: {
        productId: string;
        name: string;
        startQty: number;
        endQty: number;
        totalInflow: number;
        totalOutflow: number;
        currentValue: number;
      };
    };
  };
}

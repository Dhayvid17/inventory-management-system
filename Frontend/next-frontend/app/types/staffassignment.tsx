export interface User {
  _id: string;
  username: string;
}

export interface IStaffAssignment {
  _id: string;
  staffId: {
    _id: string;
    username: string;
  };
  warehouseId: {
    _id: string;
    name: string;
    location: string;
    capacity: number;
  };
  employmentDate: string;
  terminationDate?: string;
}

export interface StaffAssignmentEditFormProps {
  staffAssignment: IStaffAssignment;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
}

export interface CategoryEditFormProps {
  category: Category;
}

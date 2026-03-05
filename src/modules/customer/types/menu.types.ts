export interface MenuItemExtra {
  name: string;
  price: number;
}

export interface MenuItemSource {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice: number | null;
  costPrice: number | null;
  imageUrl: string | null;
  ingredients: string[];
  extras: MenuItemExtra[];
  preparationTime: string | null;
  rating: number | null;
  size: string | null;
  tags: string[];
  active: boolean;
}

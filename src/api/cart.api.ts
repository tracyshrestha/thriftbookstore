import { apiRequest } from "./client";
import { API_PATHS } from "./paths";

export interface CartItem {
  id: string;
  userId: string;
  bookId: string;
  quantity: number;
  addedAt: string;
}

export interface CartResponse {
  items: CartItem[];
}

/** GET /mock-api/cart/list.json */
export async function getCart(): Promise<CartItem[]> {
  const data = await apiRequest<CartResponse>(API_PATHS.CART_LIST);
  return data.items;
}

export async function getCartByUser(userId: string): Promise<CartItem[]> {
  const items = await getCart();
  return items.filter((item) => item.userId === userId);
}

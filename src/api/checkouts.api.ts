import { apiRequest } from "./client";
import { API_PATHS } from "./paths";

export interface Checkout {
  id: string;
  userId: string;
  bookId: string;
  checkoutDate: string;
  dueDate: string;
  isOverdue: boolean;
  renewalCount: number;
  maxRenewals: number;
}

/** GET /mock-api/checkouts/list.json */
export async function getCheckouts(): Promise<Checkout[]> {
  return apiRequest<Checkout[]>(API_PATHS.CHECKOUTS_LIST);
}

export async function getCheckoutsByUser(userId: string): Promise<Checkout[]> {
  const all = await getCheckouts();
  return all.filter((c) => c.userId === userId);
}

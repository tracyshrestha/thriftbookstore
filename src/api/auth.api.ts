import { apiRequest } from "./client";
import { API_PATHS } from "./paths";
import type { User, UserRole } from "@/features/auth/types/user";
import { DEFAULT_CREDITS_CENTS } from "@/lib/credits";

export interface CredentialAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  label: string;
  /** Starting thrift credits in cents */
  credits?: number;
}

export interface CredentialsResponse {
  accounts: CredentialAccount[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  user: User | null;
  message?: string;
}

export interface RechargeCreditsPayload {
  userId: string;
  amountCents: number;
  balanceAfter: number;
}

function toPublicUser(account: CredentialAccount): User {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    credits:
      typeof account.credits === "number" && Number.isFinite(account.credits)
        ? Math.max(0, Math.round(account.credits))
        : DEFAULT_CREDITS_CENTS,
  };
}

/** GET /mock-api/auth/credentials.json — demo accounts (login creds) */
export async function fetchCredentials(): Promise<CredentialAccount[]> {
  const data = await apiRequest<CredentialsResponse>(API_PATHS.AUTH_CREDENTIALS);
  return data.accounts;
}

/**
 * Simulated login POST — loads credentials.json over the network,
 * validates email + password, returns public user (no password).
 */
export async function loginRequest(
  payload: LoginPayload,
): Promise<LoginResult> {
  const data = await apiRequest<CredentialsResponse>(
    API_PATHS.AUTH_CREDENTIALS,
    {
      method: "POST",
      body: { email: payload.email, password: "***" },
    },
  );

  const account = data.accounts.find(
    (a) => a.email.toLowerCase() === payload.email.trim().toLowerCase(),
  );

  if (!account) {
    return { success: false, user: null, message: "Invalid email or password." };
  }

  if (account.password !== payload.password) {
    return { success: false, user: null, message: "Invalid email or password." };
  }

  return { success: true, user: toPublicUser(account) };
}

/**
 * Simulated credit recharge against credentials endpoint.
 * Network tab shows credentials.json?_method=POST with recharge payload.
 */
export async function rechargeCreditsRequest(
  payload: RechargeCreditsPayload,
): Promise<{ success: boolean; balance: number }> {
  await apiRequest<CredentialsResponse>(API_PATHS.AUTH_CREDENTIALS, {
    method: "POST",
    body: {
      _action: "rechargeCredits",
      userId: payload.userId,
      amountCents: payload.amountCents,
      balanceAfter: payload.balanceAfter,
    },
  });

  return { success: true, balance: payload.balanceAfter };
}

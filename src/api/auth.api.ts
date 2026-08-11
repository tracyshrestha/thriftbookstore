import { apiRequest } from "./client";
import { API_PATHS } from "./paths";
import type { User, UserRole } from "@/features/auth/types/user";

export interface CredentialAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  label: string;
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

function toPublicUser(account: CredentialAccount): User {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
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

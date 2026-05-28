const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8181'
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? 'fitness-app'
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'fitness-frontend'

const ACCESS_TOKEN_KEY = 'fitness_access_token'
const REFRESH_TOKEN_KEY = 'fitness_refresh_token'

export interface TokenUser {
  sub: string
  email?: string
  preferredUsername?: string
}

function parseJwt(token: string): TokenUser {
  const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  return {
    sub: payload.sub as string,
    email: payload.email as string | undefined,
    preferredUsername: payload.preferred_username as string | undefined,
  }
}

function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    const exp = payload.exp as number
    return Date.now() >= exp * 1000 - 30_000
  } catch {
    return true
  }
}

function friendlyAuthError(status: number, body: string): string {
  try {
    const json = JSON.parse(body) as { message?: string; error?: string }
    const msg = json.message ?? json.error ?? body
    if (msg.includes('invalid_client')) {
      return 'Keycloak client is not set up. In Keycloak Admin: create client "fitness-frontend", turn ON "Direct access grants", save. Then restart the gateway.'
    }
    if (msg.includes('Invalid user credentials') || msg.includes('invalid_grant')) {
      return 'Wrong username or password. Use the Keycloak username (e.g. user2) and password from Credentials tab.'
    }
    if (msg.includes('not allowed for direct access')) {
      return 'Enable "Direct access grants" on the fitness-frontend client in Keycloak.'
    }
    return msg
  } catch {
    return status === 401 ? 'Wrong username or password' : body || `Sign in failed (${status})`
  }
}

export function getStoredUser(): TokenUser | null {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  if (!token || isExpired(token)) return null
  return parseJwt(token)
}

export function getAccessToken(): string | null {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  if (!token || isExpired(token)) return null
  return token
}

function saveTokens(data: {
  accessToken?: string
  access_token?: string
  refreshToken?: string
  refresh_token?: string
}): TokenUser {
  const accessToken = data.accessToken ?? data.access_token
  const refreshToken = data.refreshToken ?? data.refresh_token
  if (!accessToken) throw new Error('No access token returned')
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  return parseJwt(accessToken)
}

async function loginViaKeycloak(username: string, password: string): Promise<TokenUser> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: KEYCLOAK_CLIENT_ID,
    username: username.trim(),
    password,
  })
  const response = await fetch(
    `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    },
  )
  const text = await response.text()
  if (!response.ok) throw new Error(friendlyAuthError(response.status, text))
  return saveTokens(JSON.parse(text))
}

async function loginViaGateway(username: string, password: string): Promise<TokenUser> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim(), password }),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(friendlyAuthError(response.status, text))
  return saveTokens(JSON.parse(text))
}

export async function loginWithPassword(
  username: string,
  password: string,
): Promise<TokenUser> {
  try {
    return await loginViaGateway(username, password)
  } catch {
    return loginViaKeycloak(username, password)
  }
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) {
    clearSession()
    throw new Error('Session expired. Please sign in again.')
  }

  // Re-login path: gateway refresh not implemented; user re-signs in
  clearSession()
  throw new Error('Session expired. Please sign in again.')
}

export async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken()
  return token
}

export function clearSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

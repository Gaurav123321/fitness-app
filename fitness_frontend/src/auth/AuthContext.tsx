import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearSession,
  getStoredUser,
  getValidAccessToken,
  loginWithPassword,
  type TokenUser,
} from './tokenService'

interface AuthContextValue {
  initialized: boolean
  authenticated: boolean
  token: string | undefined
  userId: string | undefined
  email: string | undefined
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false)
  const [user, setUser] = useState<TokenUser | null>(null)
  const [token, setToken] = useState<string | undefined>()

  useEffect(() => {
    async function restore() {
      const stored = getStoredUser()
      if (stored) {
        const accessToken = await getValidAccessToken()
        if (accessToken) {
          setUser(stored)
          setToken(accessToken)
        } else {
          clearSession()
        }
      }
      setInitialized(true)
    }
    restore()
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const loggedInUser = await loginWithPassword(username, password)
    const accessToken = await getValidAccessToken()
    setUser(loggedInUser)
    setToken(accessToken ?? undefined)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    setToken(undefined)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      authenticated: !!user && !!token,
      token,
      userId: user?.sub,
      email: user?.email ?? user?.preferredUsername,
      login,
      logout,
    }),
    [initialized, user, token, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

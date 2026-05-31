/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react'

export interface User {
  id: number
  username: string
  email: string
  createdAt: string
  updatedAt: string
}

interface AuthResponse {
  token: string
  user: User
}

interface AuthContextType {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = 'https://movies-api-silk-phi.vercel.app'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('cafeverse_auth_token')
    } catch {
      return null
    }
  })
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('cafeverse_auth_user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials or login failed')
      }

      const { token: receivedToken, user: receivedUser } = data as AuthResponse
      setToken(receivedToken)
      setUser(receivedUser)
      localStorage.setItem('cafeverse_auth_token', receivedToken)
      localStorage.setItem('cafeverse_auth_user', JSON.stringify(receivedUser))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message || 'Something went wrong during login')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      const { token: receivedToken, user: receivedUser } = data as AuthResponse
      setToken(receivedToken)
      setUser(receivedUser)
      localStorage.setItem('cafeverse_auth_token', receivedToken)
      localStorage.setItem('cafeverse_auth_user', JSON.stringify(receivedUser))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message || 'Something went wrong during registration')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = (): void => {
    setToken(null)
    setUser(null)
    setError(null)
    localStorage.removeItem('cafeverse_auth_token')
    localStorage.removeItem('cafeverse_auth_user')
  }

  const clearError = (): void => {
    setError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

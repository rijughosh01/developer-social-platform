'use client'

import { Provider } from 'react-redux'
import { store } from '@/store'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch'
import { getProfile } from '@/store/slices/authSlice'

function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const { token, isAuthenticated } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (token) {
      dispatch(getProfile())
    }
  }, [token, dispatch])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>{children}</AuthProvider>
    </Provider>
  )
} 
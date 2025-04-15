// /store/sessionContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Session = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
};

type SessionContextType = {
  session: Session | null;
  loading: boolean;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await AsyncStorage.setItem('session', JSON.stringify(session))
        setSession(session as Session)
      } else {
        await AsyncStorage.removeItem('session')
        setSession(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function checkSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error

      if (session) {
        await AsyncStorage.setItem('session', JSON.stringify(session))
        setSession(session as Session)
      } else {
        await AsyncStorage.removeItem('session')
        setSession(null)
      }
    } catch (error) {
      console.error('Error checking session:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}

import React, { useEffect } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router' // Import the router to programmatically navigate
import { supabase } from '@/lib/supabase'
import Auth from './components/Auth'
import Account from './components/Account'
import { SessionProvider, useSession } from './session/sessionContext' // Import the session context and provider
import './global.css'

const Main = () => {
  const { session } = useSession() // Access session from context
  const router = useRouter() // Initialize the router

  useEffect(() => {
    // Listen for changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        router.replace('/(tabs)/home')
      }
    })

    return () => subscription?.unsubscribe()
  }, [router])

  return (
    <View>
      <Auth />
    </View>
  )
}

const App = () => {
  return (
    <SessionProvider>
      <Main />
    </SessionProvider>
  )
}

export default App

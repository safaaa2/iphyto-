import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://qmcbspkauhvufodbbwdn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtY2JzcGthdWh2dWZvZGJid2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzODk4OTksImV4cCI6MjA1Nzk2NTg5OX0.vY9M45YxaKZZ0vBFD8WGgbE6s8TP3Bf7PhJZfWao_qA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
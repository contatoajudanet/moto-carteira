import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jkxpxshumcfvlzuveefc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpreHB4c2h1bWNmdmx6dXZlZWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0ODIxMTgsImV4cCI6MjA3NDA1ODExOH0.EgfoKr0WURR5QqUb6DHPNvFeyFUFAr4-ieJ8IJ2bVDQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

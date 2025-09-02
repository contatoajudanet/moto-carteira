import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lryrgsrgvkixrkyjtqeu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyeXJnc3JndmtpeHJreWp0cWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNTQ3ODcsImV4cCI6MjA2NzczMDc4N30.Y-M7QWhq42dE6APf7cXB-nIFYx-Y8FkleF4vwFgJVaA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

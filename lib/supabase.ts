import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ggzpibdvcycpdkajlfhf.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_lou-ZGvofNCCGUPXMnDm7A_Z8AB8SxG'

export const hasSupabase = true
export const supabase = createClient(url, key)

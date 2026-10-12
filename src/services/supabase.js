// src/services/supabase.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kckrosrvzpekmamscysi.supabase.co'
const SUPABASE_KEY = 'sb_publishable_BZW8WfmB0b6Nh4YiO7jJSA_CMYXuNTV'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
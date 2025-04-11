import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { data, error } = await supabase
      .from('beaches')
      .select('beach_name, lat, lon, region')

    if (error) throw error

    return res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching beaches:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
} 
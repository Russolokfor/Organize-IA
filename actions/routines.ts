'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function saveRoutine(routines: { category: string, start: string, end: string }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false }

  // Remove rotinas antigas para salvar as novas (simplificação)
  await supabase.from('routines').delete().eq('user_id', user.id)

  const insertData = routines.map(r => ({
    user_id: user.id,
    category: r.category,
    start_time: r.start,
    end_time: r.end
  }))

  const { error } = await supabase.from('routines').insert(insertData)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/')
  return { success: true }
}

export async function getRoutines() {
  const supabase = await createClient()
  const { data } = await supabase.from('routines').select('*')
  return data || []
}
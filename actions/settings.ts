'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// Buscar dados atuais do usuário
export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false }

  return { 
    success: true, 
    data: {
      email: user.email,
      fullName: user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || ''
    }
  }
}

// Atualizar Nome e Telefone
export async function updateUserProfile(fullName: string, phone: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName, phone: phone }
  })

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/')
  return { success: true }
}

// Alterar Senha
export async function changeUserPassword(newPassword: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) return { success: false, error: error.message }
  
  return { success: true }
}
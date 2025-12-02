'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// 1. Alternar status (Concluído/Pendente)
export async function toggleTask(taskId: string, isCompleted: boolean) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tasks')
    .update({ status: isCompleted ? 'concluido' : 'pendente' })
    .eq('id', taskId)

  if (error) return { success: false }
  revalidatePath('/')
  return { success: true }
}

// 2. Deletar Tarefa
export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) return { success: false }
  revalidatePath('/')
  return { success: true }
}

// 3. Criar Tarefa (Simples ou Subtarefa)
export async function createTask(task: any, parentId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const newTask = {
    ...task,
    user_id: user.id,
    parent_id: parentId || null,
    status: 'pending'
  }

  const { data, error } = await supabase.from('tasks').insert(newTask).select().single()

  if (error) return { success: false }
  revalidatePath('/')
  return { success: true, data }
}

// 4. Atualizar Tarefa (Edição - A função que estava faltando)
export async function updateTask(taskId: string, updates: any) {
  const supabase = await createClient()
  
  // Filtra campos permitidos para evitar quebra
  const safeUpdates = {
    title: updates.title,
    category: updates.category,
    priority: updates.priority,
    due_date: updates.due_date
  }

  const { error } = await supabase
    .from('tasks')
    .update(safeUpdates)
    .eq('id', taskId)

  if (error) return { success: false }
  revalidatePath('/')
  return { success: true }
}
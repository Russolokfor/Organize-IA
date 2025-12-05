'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// 1. Alternar status
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
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) return { success: false }
  revalidatePath('/')
  return { success: true }
}

// 3. Criar Tarefa Única
export async function createTask(task: any, parentId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const newTask = { ...task, user_id: user.id, parent_id: parentId || null, status: 'pending' }
  const { data, error } = await supabase.from('tasks').insert(newTask).select().single()

  if (error) return { success: false }
  revalidatePath('/')
  return { success: true, data }
}

// 4. Atualizar Tarefa
export async function updateTask(taskId: string, updates: any) {
  const supabase = await createClient()
  const safeUpdates = {
    title: updates.title, category: updates.category,
    priority: updates.priority, due_date: updates.due_date
  }
  const { error } = await supabase.from('tasks').update(safeUpdates).eq('id', taskId)

  if (error) return { success: false }
  revalidatePath('/')
  return { success: true }
}

// 5. NOVA FUNÇÃO: Criar Várias Tarefas (Para as Stacks/Rotinas)
export async function createBatchTasks(tasks: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  // Prepara as tarefas com o ID do usuário
  const tasksToInsert = tasks.map(t => ({
    ...t,
    user_id: user.id,
    status: 'pending',
    // Se não tiver data, define para hoje para aparecer na timeline
    due_date: t.due_date || new Date().toISOString() 
  }))

  const { data, error } = await supabase.from('tasks').insert(tasksToInsert).select()

  if (error) {
    console.error("Erro no lote:", error)
    return { success: false }
  }
  
  revalidatePath('/')
  return { success: true, data }
}
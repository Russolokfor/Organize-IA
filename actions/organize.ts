'use server'

import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { SYSTEM_PROMPT } from '@/lib/ai-prompt'

type RecurrenceSettings = { type: string, interval: number } | undefined
type UserContext = { localTime: string, timezone: string }

export async function organizeTasks(
  userInput: string, 
  userContext: UserContext,
  manualRecurrence?: RecurrenceSettings,
  manualDate?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Usuário não logado.' }

    // 1. Buscar a Rotina do Usuário
    const { data: routines } = await supabase.from('routines').select('*')
    
    // Formata a rotina para a IA ler
    const routineString = routines && routines.length > 0
      ? routines.map(r => `- ${r.category}: ${r.start_time} às ${r.end_time}`).join('\n')
      : "Sem rotina definida (horário livre)."

    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

    // 2. Montar o Prompt com Contexto de Rotina
    const finalSystemPrompt = `
      ${SYSTEM_PROMPT}

      --- CONTEXTO DE ROTINA E HORÁRIOS ---
      Hora Atual: ${userContext.localTime}
      Fuso Horário: ${userContext.timezone}
      
      DISPONIBILIDADE DO USUÁRIO (RESPEITE ISSO):
      ${routineString}

      REGRAS DE AGENDAMENTO:
      1. Se a tarefa for de uma categoria específica (ex: Trabalho), AGENDE DENTRO do horário dessa categoria.
      2. Se o horário da categoria já passou hoje, agende para o próximo dia útil nesse horário.
      3. "due_date" deve ser uma DATA ISO COMPLETA (YYYY-MM-DDTHH:mm:ss).
      4. Se o usuário definir data manual, respeite a data mas tente ajustar a hora conforme a rotina.
    `

    const userPrompt = `
      ${manualDate ? `FORÇAR DATA: ${manualDate}.` : ''}
      ${manualRecurrence ? `FORÇAR RECORRÊNCIA: Tipo ${manualRecurrence.type}, Intervalo ${manualRecurrence.interval}.` : ''}
      TAREFA PARA PROCESSAR: "${userInput}"
    `

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: finalSystemPrompt,
      prompt: userPrompt,
    })

    console.log("Resposta IA:", text)

    const startIndex = text.indexOf('{')
    const endIndex = text.lastIndexOf('}')
    
    if (startIndex === -1 || endIndex === -1) throw new Error('A IA não conseguiu estruturar o pedido.')
    
    const jsonString = text.substring(startIndex, endIndex + 1)
    const object = JSON.parse(jsonString)

    const tasksToInsert = object.tasks.map((t: any) => ({
      user_id: user.id,
      title: t.title,
      category: t.category,
      estimated_time: t.estimated_time,
      priority: t.priority,
      due_date: t.due_date,
      recurrence_type: manualRecurrence?.type || t.recurrence_type,
      recurrence_interval: manualRecurrence ? manualRecurrence.interval : (t.recurrence_interval || 1),
      status: 'pending'
    }))

    const { data: savedTasks, error } = await supabase.from('tasks').insert(tasksToInsert).select()

    if (error) throw error

    revalidatePath('/')
    return { success: true, data: savedTasks }

  } catch (error: any) {
    console.error("Erro no organize:", error)
    return { success: false, error: error.message || 'Erro ao processar tarefas.' }
  }
}
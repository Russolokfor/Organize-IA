'use server'

import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

type RecurrenceSettings = {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  interval: number
}

export async function organizeTasks(
  userInput: string, 
  userContext: { localTime: string, timezone: string },
  manualRecurrence?: RecurrenceSettings,
  manualDate?: string // <--- NOVO PARÂMETRO
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Usuário não logado.' }

    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: `Você é um assistente pessoal especialista em TDAH.
      CONTEXTO: ${userContext.localTime}.
      
      REGRAS:
      1. Retorne APENAS JSON válido.
      2. Identifique datas no texto e converta para ISO 8601.
      3. Se "recurrence_type" for identificado no texto, preencha.
      
      ${manualDate ? `IMPORTANTE: O usuário forçou a data para ${manualDate}. Use essa data no campo due_date.` : ''}
      ${manualRecurrence ? `IMPORTANTE: Use recorrência tipo ${manualRecurrence.type} com intervalo ${manualRecurrence.interval}.` : ''}

      JSON FORMAT:
      {
        "tasks": [
          {
            "title": "string",
            "category": "Casa" | "Trabalho" | "Estudos" | "Pessoal" | "Saúde",
            "estimated_time": number,
            "priority": "alta" | "media" | "baixa",
            "due_date": "ISO-DATE" or null,
            "recurrence_type": "daily" | "weekly" | "monthly" | "yearly" | null,
            "recurrence_interval": number | null
          }
        ]
      }`,
      prompt: `Tarefa: "${userInput}"`,
    })

    const startIndex = text.indexOf('{')
    const endIndex = text.lastIndexOf('}')
    if (startIndex === -1) throw new Error('JSON inválido')
    const object = JSON.parse(text.substring(startIndex, endIndex + 1))

    const tasksToInsert = object.tasks.map((t: any) => ({
      user_id: user.id,
      title: t.title,
      category: t.category,
      estimated_time: t.estimated_time,
      priority: t.priority,
      // Prioridade: Data Manual > Data IA
      due_date: manualDate || t.due_date,
      recurrence_type: manualRecurrence?.type || t.recurrence_type,
      recurrence_interval: manualRecurrence?.type ? manualRecurrence.interval : (t.recurrence_interval || 1),
      status: 'pending'
    }))

    const { data: savedTasks, error } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select()

    if (error) throw error
    revalidatePath('/')
    return { success: true, data: savedTasks }

  } catch (error: any) {
    console.error("Erro:", error)
    return { success: false, error: error.message }
  }
}
'use server'

import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { SYSTEM_PROMPT } from '@/lib/ai-prompt' // <--- Importamos o novo cérebro

type RecurrenceSettings = {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  interval: number
}

type UserContext = {
  localTime: string
  timezone: string
}

export async function organizeTasks(
  userInput: string, 
  userContext: UserContext,
  manualRecurrence?: RecurrenceSettings,
  manualDate?: string
) {
  try {
    const supabase = await createClient()
    
    // 1. Verificar Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Usuário não logado.' }

    // 2. Configurar Groq
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    })

    // 3. Montar o Prompt com Contexto Real
    const finalPrompt = `
      CONTEXTO DE TEMPO ATUAL:
      - Data/Hora Local: ${userContext.localTime}
      - Fuso Horário: ${userContext.timezone}

      ${manualDate ? `FORÇAR DATA: O usuário selecionou manualmente a data: ${manualDate}. Aplique a TODAS as tarefas.` : ''}
      ${manualRecurrence?.type ? `FORÇAR RECORRÊNCIA: Tipo ${manualRecurrence.type}, Intervalo ${manualRecurrence.interval}. Aplique a TODAS.` : ''}

      ENTRADA DO USUÁRIO (BRAIN DUMP):
      "${userInput}"
    `

    // 4. Chamar a IA (Llama 3.3 Versatile - O mais inteligente para contexto)
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: SYSTEM_PROMPT, // Usando as regras do arquivo separado
      prompt: finalPrompt,
    })

    console.log("Resposta IA:", text) // Para debug

    // 5. Limpeza e Parse do JSON
    const startIndex = text.indexOf('{')
    const endIndex = text.lastIndexOf('}')
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('A IA não conseguiu estruturar o pedido.')
    }

    const jsonString = text.substring(startIndex, endIndex + 1)
    const object = JSON.parse(jsonString)

    // 6. Preparar dados para o Banco
    const tasksToInsert = object.tasks.map((t: any) => ({
      user_id: user.id,
      title: t.title,
      category: t.category,
      estimated_time: t.estimated_time,
      priority: t.priority,
      // Se tiver manualDate, usa ela. Senão, usa a que a IA inferiu do texto.
      due_date: manualDate || t.due_date,
      // Se tiver manualRecurrence, usa ela. Senão, usa a da IA.
      recurrence_type: manualRecurrence?.type || t.recurrence_type,
      recurrence_interval: manualRecurrence?.type ? manualRecurrence.interval : (t.recurrence_interval || 1),
      status: 'pending'
    }))

    // 7. Salvar no Supabase
    const { data: savedTasks, error } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select()

    if (error) throw error

    revalidatePath('/')
    return { success: true, data: savedTasks }

  } catch (error: any) {
    console.error("Erro no organize:", error)
    return { success: false, error: error.message || 'Erro ao processar tarefas.' }
  }
}
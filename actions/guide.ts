'use server'

import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'

export async function generateGuide(taskTitle: string) {
  try {
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    })

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: `Você é um assistente especialista em quebrar tarefas (Chunking) para TDAH.
      Sua resposta deve ser ESTRITAMENTE um JSON válido.
      Retorne uma lista de 3 a 5 sub-tarefas práticas e necessárias para completar a tarefa principal.
      Formato JSON esperado:
      {
        "suggestions": [
          {
            "title": "Ação curta",
            "category": "Casa" | "Trabalho" | "Estudos" | "Pessoal" | "Saúde",
            "estimated_time": 15,
            "priority": "alta" | "media" | "baixa"
          }
        ]
      }`,
      prompt: `Tarefa principal: "${taskTitle}". Gere as sugestões.`,
    })

    // Limpeza cirúrgica do JSON
    const startIndex = text.indexOf('{')
    const endIndex = text.lastIndexOf('}')
    if (startIndex === -1 || endIndex === -1) throw new Error('JSON não encontrado')
    
    const jsonString = text.substring(startIndex, endIndex + 1)
    const data = JSON.parse(jsonString)

    return { success: true, suggestions: data.suggestions }

  } catch (error: any) {
    console.error("Erro na Sugestão:", error)
    return { success: false, error: 'Não consegui gerar sugestões.' }
  }
}
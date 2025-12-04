import { OrganizeForm } from '@/components/organize-form'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function Home() {
  // 1. Conecta no Banco
  const supabase = await createClient()
  
  // 2. Verifica Segurança (Se não tiver logado, manda pro Login)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login') 
  }

  // 3. Busca as Tarefas do usuário
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[#0f1115] text-zinc-100">
      <OrganizeForm initialTasks={tasks || []} />
    </main>
  )
}
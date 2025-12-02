import { OrganizeForm } from '@/components/organize-form'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  // Removemos o container centralizado. O OrganizeForm agora controla a tela inteira.
  return (
    <main className="min-h-screen bg-[#0f1115] text-zinc-100">
      <OrganizeForm initialTasks={tasks || []} />
    </main>
  )
}
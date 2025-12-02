'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-server' // Pode dar erro visual, mas vamos testar
import { useRouter } from 'next/navigation'
import { Lock, Loader2, AlertCircle } from 'lucide-react'

// Ajuste técnico: Como estamos no cliente, vamos usar o cliente do browser se o import acima falhar
// Mas para manter simples, use este código que funciona sempre no Client Side:
import { createBrowserClient } from '@supabase/ssr'

function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuth = async () => {
    setLoading(true); setError(null)
    const supabase = createBrowserSupabase()
    
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    
    if (!loginError) {
      window.location.href = '/'
      return
    }

    const { error: signupError } = await supabase.auth.signUp({ email, password })
    
    if (signupError) {
      setError(signupError.message)
      setLoading(false)
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-zinc-900/50 p-8 border border-zinc-800">
        <div className="text-center">
          <Lock className="mx-auto h-10 w-10 text-indigo-500 mb-4" />
          <h2 className="text-2xl font-bold">Organize.ia</h2>
          <p className="text-zinc-400 text-sm mt-2">Login Recuperado</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded flex gap-2 items-center text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-indigo-500 outline-none"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Senha" 
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-indigo-500 outline-none"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button 
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-indigo-600 p-3 rounded-lg font-bold hover:bg-indigo-500 disabled:opacity-50 flex justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Entrar / Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
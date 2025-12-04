'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, AlertCircle, Mail, UserPlus, LogIn, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  
  // Estados
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    const supabase = createClient()

    try {
      if (isSignUp) {
        // CADASTRO
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        
        if (data.session) {
           window.location.href = '/'
        } else {
           setSuccessMsg("Conta criada! Verifique seu e-mail para confirmar.")
        }

      } else {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw new Error("E-mail ou senha incorretos.")
        
        window.location.href = '/'
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1115] p-4 text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Fundo decorativo (MANTIDO) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-3xl bg-[#161920]/80 backdrop-blur-xl p-8 shadow-2xl border border-[#23262f] relative z-10"
      >
        
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <AnimatePresence mode="wait">
              {isSignUp ? (
                <motion.div key="signup" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                  <UserPlus className="h-8 w-8 text-indigo-400" />
                </motion.div>
              ) : (
                <motion.div key="login" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                  <Lock className="h-8 w-8 text-indigo-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}
          </h2>
          <p className="text-sm text-zinc-500">
            {isSignUp ? 'Comece a organizar sua vida com IA.' : 'Acesse seu dashboard para continuar.'}
          </p>
        </div>

        {/* Alertas de Feedback */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                {successMsg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-4 h-5 w-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#2A2E37] bg-[#0F1115] p-3.5 pl-12 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#2A2E37] bg-[#0F1115] p-3.5 pl-12 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-4 font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                {isSignUp ? 'Criar Conta Grátis' : 'Entrar na Plataforma'}
                {!loading && (isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />)}
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setSuccessMsg(null)
              setEmail('')
              setPassword('')
            }}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {isSignUp ? (
              <>Já tem uma conta? <span className="font-semibold text-indigo-400 hover:underline">Faça Login</span></>
            ) : (
              <>Não tem conta? <span className="font-semibold text-indigo-400 hover:underline">Cadastre-se agora</span></>
            )}
          </button>
        </div>

      </motion.div>
    </div>
  )
}
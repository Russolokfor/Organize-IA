'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, AlertCircle, Mail, UserPlus, LogIn, CheckCircle2, User, Phone, RefreshCw, ArrowLeft, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Tipos de estado
type AuthMode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const router = useRouter()
  
  const [mode, setMode] = useState<AuthMode>('login')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  
  const [captchaNum1, setCaptchaNum1] = useState(0)
  const [captchaNum2, setCaptchaNum2] = useState(0)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'signup') generateCaptcha()
  }, [mode])

  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 10))
    setCaptchaNum2(Math.floor(Math.random() * 10))
    setCaptchaAnswer('')
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    const supabase = createClient()

    try {
      if (mode === 'signup') {
        // Fluxo de Cadastro
        if (parseInt(captchaAnswer) !== captchaNum1 + captchaNum2) {
          throw new Error("Captcha incorreto.")
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, phone: phone } }
        })

        if (error) throw error
        if (data.session) window.location.href = '/'
        else {
           setSuccessMsg("Conta criada! Verifique seu e-mail.")
           setTimeout(() => setMode('login'), 3000)
        }

      } else if (mode === 'login') {
        // Fluxo de Login
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error("E-mail ou senha incorretos.")
        window.location.href = '/'

      } else if (mode === 'forgot') {
        // Fluxo de Recuperação
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
        })
        if (error) throw error
        setSuccessMsg("Link de recuperação enviado para o e-mail!")
      }

    } catch (err: any) {
      setError(err.message)
      if (mode === 'signup') generateCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1115] p-4 text-zinc-100 font-sans selection:bg-indigo-500/30">
      
      {/* Fundo Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 rounded-3xl bg-[#161920]/80 backdrop-blur-xl p-8 shadow-2xl border border-[#23262f] relative z-10"
      >
        
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-4 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div key="signup" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                  <UserPlus className="h-8 w-8 text-indigo-400" />
                </motion.div>
              )}
              {mode === 'login' && (
                <motion.div key="login" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                  <Lock className="h-8 w-8 text-indigo-400" />
                </motion.div>
              )}
              {mode === 'forgot' && (
                <motion.div key="forgot" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                  <RefreshCw className="h-8 w-8 text-indigo-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'signup' && 'Crie sua conta'}
            {mode === 'login' && 'Bem-vindo de volta'}
            {mode === 'forgot' && 'Recuperar Senha'}
          </h2>
          <p className="text-sm text-zinc-500">
            {mode === 'signup' && 'Preencha seus dados para começar.'}
            {mode === 'login' && 'Acesse seu dashboard para continuar.'}
            {mode === 'forgot' && 'Digite seu e-mail para receber o link.'}
          </p>
        </div>

        {/* Alertas de Erro/Sucesso */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 mb-4">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-400 border border-emerald-500/20 mb-4">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                {successMsg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulário */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Campos Extras (Só no Cadastro) */}
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    required // AQUI A CORREÇÃO: Simplificado
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-[#2A2E37] bg-[#0F1115] p-3 pl-12 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                    placeholder="Nome Completo"
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="tel"
                    required // AQUI A CORREÇÃO: Simplificado
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-[#2A2E37] bg-[#0F1115] p-3 pl-12 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                    placeholder="WhatsApp (com DDD)"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* E-mail (Sempre visível) */}
          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#2A2E37] bg-[#0F1115] p-3 pl-12 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>

          {/* Senha (Escondida no 'Esqueci a Senha') */}
          {mode !== 'forgot' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative group">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="password"
                required // AQUI A CORREÇÃO: Simplificado (já está num bloco condicional)
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#2A2E37] bg-[#0F1115] p-3 pl-12 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                placeholder="Senha secreta"
              />
            </motion.div>
          )}

          {/* Captcha (Só no Cadastro) */}
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} 
                className="overflow-hidden"
              >
                <div className="bg-[#1A1D24] rounded-xl p-3 border border-[#2A2E37] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm pl-2">
                    <ShieldCheck size={18} className="text-indigo-400"/>
                    <span>Quanto é <strong>{captchaNum1} + {captchaNum2}</strong> ?</span>
                  </div>
                  <input
                    type="number"
                    required // AQUI A CORREÇÃO: Simplificado
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="w-16 rounded-lg border border-[#2A2E37] bg-[#0F1115] p-2 text-center text-white focus:border-indigo-500 outline-none"
                    placeholder="?"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Link Esqueci a Senha */}
          {mode === 'login' && (
            <div className="flex justify-end">
              <button type="button" onClick={() => setMode('forgot')} className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors">
                Esqueceu a senha?
              </button>
            </div>
          )}

          {/* Botão Principal */}
          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-3.5 font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                {mode === 'signup' && 'Criar Conta Grátis'}
                {mode === 'login' && 'Entrar na Plataforma'}
                {mode === 'forgot' && 'Enviar Link'}
                {!loading && mode !== 'forgot' && <LogIn className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />}
              </>
            )}
          </button>
        </form>

        {/* Footer Alternador */}
        <div className="text-center border-t border-white/5 pt-4">
          {mode === 'login' && (
            <button onClick={() => setMode('signup')} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Não tem conta? <span className="font-semibold text-indigo-400 hover:underline">Cadastre-se</span>
            </button>
          )}
          
          {mode === 'signup' && (
            <button onClick={() => setMode('login')} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Já tem uma conta? <span className="font-semibold text-indigo-400 hover:underline">Faça Login</span>
            </button>
          )}

          {mode === 'forgot' && (
            <button onClick={() => setMode('login')} className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto">
              <ArrowLeft size={14} /> Voltar para Login
            </button>
          )}
        </div>

      </motion.div>
    </div>
  )
}
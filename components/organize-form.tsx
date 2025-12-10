'use client'

/**
 * ORGANIZE.IA - COMPONENTE PRINCIPAL (GOLD MASTER)
 * ------------------------------------------------
 * Este arquivo contém toda a lógica de interface do usuário, gerenciamento de estado,
 * animações e interações com as Server Actions.
 * * Funcionalidades:
 * - Kanban Board & Calendar View
 * - Gestão de Tarefas (CRUD) + Subtarefas
 * - Inteligência Artificial (Groq/Llama 3)
 * - Gamificação e Foco
 * - Responsividade Total (Mobile/Desktop)
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { organizeTasks } from '@/actions/organize'
import { toggleTask, deleteTask, createTask, updateTask, createBatchTasks } from '@/actions/tasks'
import { saveRoutine, getRoutines } from '@/actions/routines'
import { getUserProfile, updateUserProfile, changeUserPassword } from '@/actions/settings'
import { generateGuide } from '@/actions/guide'
import { 
  Sparkles, Loader2, Clock, CheckCircle2, Circle, Trash2, Zap, X, Plus, Check,
  LayoutGrid, Briefcase, Home, GraduationCap, User, Heart, LogOut, PanelLeftClose, PanelLeftOpen,
  CornerDownRight, Settings, Calendar, Repeat, ChevronDown, Pencil, Save, 
  CalendarDays, Layers, Target, Trophy, Lock, Smartphone, UserCircle, AlertTriangle, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ==========================================
// 1. CONFIGURAÇÕES E CONSTANTES
// ==========================================

const MENU_ITEMS = [
  { id: 'all', label: 'Visão Geral', icon: LayoutGrid },
  { id: 'Trabalho', label: 'Trabalho', icon: Briefcase },
  { id: 'Casa', label: 'Casa', icon: Home },
  { id: 'Estudos', label: 'Estudos', icon: GraduationCap },
  { id: 'Pessoal', label: 'Pessoal', icon: User },
  { id: 'Saúde', label: 'Saúde', icon: Heart },
]

// Rotinas pré-definidas para acesso rápido (Stacks)
const ROUTINE_STACKS = [
  {
    title: "🌅 Início do Dia",
    description: "Ative seu cérebro e prepare o terreno.",
    icon: "☀️",
    tasks: [
      { title: "Beber 500ml de água", category: "Saúde", priority: "alta", estimated_time: 2 },
      { title: "Arrumar a cama", category: "Casa", priority: "media", estimated_time: 5 },
      { title: "Planejar as 3 vitórias do dia", category: "Pessoal", priority: "alta", estimated_time: 5 },
    ]
  },
  {
    title: "🚀 Modo Foco",
    description: "Bloco de trabalho intenso (Deep Work).",
    icon: "🔥",
    tasks: [
      { title: "Esconder o celular em outra sala", category: "Trabalho", priority: "alta", estimated_time: 2 },
      { title: "Definir tarefa única prioritária", category: "Trabalho", priority: "alta", estimated_time: 5 },
      { title: "Executar bloco de 50min", category: "Trabalho", priority: "alta", estimated_time: 50 },
    ]
  },
  {
    title: "🌙 Descompressão",
    description: "Desligar o sistema para dormir bem.",
    icon: "💤",
    tasks: [
      { title: "Preparar roupa/mochila de amanhã", category: "Casa", priority: "media", estimated_time: 10 },
      { title: "Higiene do sono (sem telas)", category: "Saúde", priority: "alta", estimated_time: 30 },
    ]
  }
]

const RECURRENCE_OPTIONS = [
  { label: 'Não repetir', type: null, interval: 0 },
  { label: 'Diariamente', type: 'daily', interval: 1 },
  { label: 'Semanalmente', type: 'weekly', interval: 1 },
  { label: 'Quinzenalmente', type: 'weekly', interval: 2 },
  { label: 'Mensalmente', type: 'monthly', interval: 1 },
]

const COLUMNS = [
  { id: 'alta', label: 'Alta Prioridade', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', gradient: 'from-rose-500/10 to-transparent' },
  { id: 'media', label: 'Média Prioridade', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', gradient: 'from-amber-500/10 to-transparent' },
  { id: 'baixa', label: 'Baixa Prioridade', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', gradient: 'from-emerald-500/10 to-transparent' },
]

const PRIORITY_STYLES: Record<string, string> = {
  alta: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  media: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  baixa: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
}

const PRIORITY_ORDER: Record<string, number> = { 'alta': 1, 'media': 2, 'baixa': 3 }

// --- UTILITÁRIOS ---

const formatDate = (dateString: string) => {
  if (!dateString) return null
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
  }).format(date)
}

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================

export function OrganizeForm({ initialTasks }: { initialTasks: any[] }) {
  
  // --- ESTADOS ---

  // Dados Principais
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<any[]>(initialTasks || [])
  
  // Navegação e Layout
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban')
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [isMobile, setIsMobile] = useState(false)

  // Configurações do Usuário (Rotina e Perfil)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'profile' | 'routine'>('profile')
  const [routineConfig, setRoutineConfig] = useState([
    { category: 'Trabalho', start: '09:00', end: '18:00' },
    { category: 'Casa', start: '18:00', end: '22:00' },
    { category: 'Estudos', start: '20:00', end: '21:00' }
  ])
  const [profileData, setProfileData] = useState({ fullName: '', phone: '', newPassword: '' })

  // Modais de Interação com Tarefa
  const [guideOpen, setGuideOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [guideLoading, setGuideLoading] = useState(false)
  const [activeTask, setActiveTask] = useState<{id: string, title: string} | null>(null)
  const [addedSuggestions, setAddedSuggestions] = useState<number[]>([])
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [stackModalOpen, setStackModalOpen] = useState(false)
  
  // Inputs do Formulário (Recorrência e Data)
  const [recurrenceMenuOpen, setRecurrenceMenuOpen] = useState(false)
  const [selectedRecurrence, setSelectedRecurrence] = useState(RECURRENCE_OPTIONS[0])
  const [selectedDate, setSelectedDate] = useState('')

  // --- EFEITOS (INITIALIZATION) ---

  useEffect(() => {
    const init = async () => {
      // Detecção Mobile
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
      
      // Carregar Rotina do Banco
      const routines = await getRoutines()
      if (!routines || routines.length === 0) setShowOnboarding(true)
      else setRoutineConfig(routines.map((r: any) => ({ category: r.category, start: r.start_time, end: r.end_time })))

      // Carregar Perfil do Usuário
      const userProfile = await getUserProfile()
      if (userProfile.success && userProfile.data) {
        setProfileData(prev => ({ ...prev, fullName: userProfile.data.fullName, phone: userProfile.data.phone }))
      }
    }
    init()
    
    const handleResize = () => {
        const mobile = window.innerWidth < 768
        setIsMobile(mobile)
        if (mobile) setSidebarOpen(false)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // --- ACTIONS HANDLERS (CONTROLLER) ---

  // 1. Processar Input com IA
  async function handleSubmit() {
    if (!input.trim()) return
    setLoading(true)
    
    const userContext = { 
      localTime: new Date().toLocaleString('pt-BR'), 
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone 
    }
    
    const recurrencePayload = selectedRecurrence.type ? { 
      type: selectedRecurrence.type as any, 
      interval: selectedRecurrence.interval 
    } : undefined
    
    const result = await organizeTasks(input, userContext, recurrencePayload, selectedDate)
    
    if (result.success && result.data) {
      setTasks(prev => [...result.data, ...prev])
      // Reset inputs
      setInput('')
      setSelectedRecurrence(RECURRENCE_OPTIONS[0])
      setSelectedDate('')
    } else {
      alert("Erro ao processar: " + result.error)
    }
    setLoading(false)
  }

  // 2. Aplicar Rotina Pronta (Stack)
  const handleApplyStack = async (stack: any) => {
    setStackModalOpen(false)
    setLoading(true)
    // Define data para hoje para aparecer na timeline imediata
    const tasksWithDate = stack.tasks.map((t: any) => ({ ...t, due_date: new Date().toISOString() }))
    const result = await createBatchTasks(tasksWithDate)
    if (result.success && result.data) {
      setTasks(prev => [...result.data, ...prev])
    }
    setLoading(false)
  }

  // 3. Alternar Status (Concluir/Pendente)
  const handleToggle = async (id: string, s: string) => {
    const ns = s === 'concluido' ? 'pendente' : 'concluido'
    // Optimistic Update
    setTasks(p => p.map(t => t.id === id ? { ...t, status: ns } : t))
    await toggleTask(id, ns === 'concluido')
  }

  // 4. Exclusão Segura
  const requestDelete = (id: string) => setTaskToDelete(id)
  
  const confirmDelete = async () => {
    if (!taskToDelete) return
    const id = taskToDelete
    setTaskToDelete(null)
    setTasks(p => p.filter(t => t.id !== id && t.parent_id !== id))
    await deleteTask(id)
  }

  // 5. Salvar Edição
  const handleSaveEdit = async () => {
    if (!editingTask) return
    setTasks(p => p.map(t => t.id === editingTask.id ? editingTask : t))
    const taskToSave = { ...editingTask }
    setEditingTask(null)
    await updateTask(taskToSave.id, taskToSave)
  }

  // 6. Configurações (Rotina e Perfil)
  const handleSaveRoutine = async () => {
    await saveRoutine(routineConfig)
    setShowOnboarding(false)
    setSettingsOpen(false)
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    await updateUserProfile(profileData.fullName, profileData.phone)
    if (profileData.newPassword) {
      await changeUserPassword(profileData.newPassword)
      setProfileData(p => ({ ...p, newPassword: '' }))
    }
    setLoading(false)
    setSettingsOpen(false)
  }

  // 7. IA Sugestões
  const handleGuide = async (task: {id: string, title: string}) => {
    setActiveTask(task)
    setGuideOpen(true)
    setSuggestions([])
    setAddedSuggestions([])
    setGuideLoading(true)
    const result = await generateGuide(task.title)
    if (result.success && result.suggestions) setSuggestions(result.suggestions)
    setGuideLoading(false)
  }

  const handleAddSuggestion = async (sug: any, idx: number) => {
    setAddedSuggestions(p => [...p, idx])
    if (activeTask) {
      const result = await createTask(sug, activeTask.id)
      if (result.success && result.data) setTasks(p => [result.data, ...p])
    }
  }

  // --- FILTROS E CÁLCULOS (MEMOIZED) ---

  const filteredTasks = useMemo(() => activeCategory === 'all' ? tasks : tasks.filter(t => t.category === activeCategory), [tasks, activeCategory])
  const rootTasks = useMemo(() => filteredTasks.filter(t => !t.parent_id), [filteredTasks])
  const activeRootTasks = useMemo(() => rootTasks.filter(t => t.status !== 'concluido'), [rootTasks])
  const completedRootTasks = useMemo(() => rootTasks.filter(t => t.status === 'concluido'), [rootTasks])

  // Lógica de Subtarefas
  const getSubtasks = useCallback((parentId: string) => {
    if (!parentId) return []
    return tasks
      .filter(t => t.parent_id === parentId)
      .sort((a, b) => {
        if (a.status === 'concluido' && b.status !== 'concluido') return 1
        if (a.status !== 'concluido' && b.status === 'concluido') return -1
        return (PRIORITY_ORDER[a.priority?.toLowerCase()] || 2) - (PRIORITY_ORDER[b.priority?.toLowerCase()] || 2)
      })
  }, [tasks])

  // Dados para Gamificação (Hero Section)
  const mainFocusTask = useMemo(() => activeRootTasks.find(t => t.priority === 'alta'), [activeRootTasks])
  const totalTasksCount = tasks.filter(t => !t.parent_id).length
  const completedCount = tasks.filter(t => t.status === 'concluido' && !t.parent_id).length
  const progressPercentage = totalTasksCount === 0 ? 0 : Math.round((completedCount / totalTasksCount) * 100)

  // --- SUB-COMPONENTES DE RENDERIZAÇÃO ---

  const renderCalendarView = () => {
    const todayTasks = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString())
    const sortedTasks = todayTasks.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
        <h3 className="text-xl font-bold text-white flex items-center gap-2"><CalendarDays className="text-indigo-400" /> Agenda de Hoje</h3>
        <div className="relative border-l-2 border-white/10 ml-4 space-y-8 pb-10">
          {sortedTasks.length > 0 ? sortedTasks.map((task) => {
            const time = new Date(task.due_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
            return (
              <div key={task.id} className="relative pl-8">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-[#0f1115]" />
                <span className="absolute -left-16 top-[-4px] text-xs font-mono text-zinc-500">{time}</span>
                <div className="bg-[#161920] border border-white/10 p-4 rounded-xl hover:border-indigo-500/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-zinc-200">{task.title}</h4>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-400">{task.category}</span>
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-400">{task.estimated_time}min</span>
                      </div>
                    </div>
                    {task.status === 'concluido' ? <CheckCircle2 className="text-emerald-500" size={20}/> : <Circle className="text-zinc-600" size={20}/>}
                  </div>
                </div>
              </div>
            )
          }) : <div className="pl-8 text-zinc-500 italic">Nenhuma tarefa agendada para hoje.</div>}
        </div>
      </div>
    )
  }

  const renderSettingsModal = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setSettingsOpen(false)}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#161920]/95 backdrop-blur-2xl border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col max-h-[85vh] ring-1 ring-white/5">
         <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="text-indigo-400"/> Configurações</h2>
            <button onClick={() => setSettingsOpen(false)}><X className="text-zinc-500 hover:text-white" /></button>
         </div>
         <div className="flex border-b border-white/5">
            <button onClick={() => setSettingsTab('profile')} className={`flex-1 py-4 text-sm font-medium transition-colors ${settingsTab === 'profile' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-zinc-500 hover:text-white'}`}>Meu Perfil</button>
            <button onClick={() => setSettingsTab('routine')} className={`flex-1 py-4 text-sm font-medium transition-colors ${settingsTab === 'routine' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-zinc-500 hover:text-white'}`}>Minha Rotina</button>
         </div>
         <div className="p-8 overflow-y-auto custom-scrollbar">
            {settingsTab === 'profile' ? (
              <div className="space-y-6">
                 <div className="space-y-4">
                    <div><label className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-1 block">Nome Completo</label><div className="relative"><UserCircle className="absolute left-3 top-3.5 text-zinc-500" size={18}/><input value={profileData.fullName} onChange={(e) => setProfileData({...profileData, fullName: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 pl-10 text-white outline-none focus:border-indigo-500 transition-colors"/></div></div>
                    <div><label className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-1 block">WhatsApp</label><div className="relative"><Smartphone className="absolute left-3 top-3.5 text-zinc-500" size={18}/><input value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 pl-10 text-white outline-none focus:border-indigo-500 transition-colors"/></div></div>
                 </div>
                 <div className="space-y-4 pt-6 border-t border-white/5">
                    <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-1 block">Segurança</label>
                    <div className="relative"><Lock className="absolute left-3 top-3.5 text-zinc-500" size={18}/><input type="password" value={profileData.newPassword} onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})} placeholder="Nova senha (opcional)" className="w-full bg-black/30 border border-white/10 rounded-xl p-3 pl-10 text-white outline-none focus:border-indigo-500 transition-colors"/></div>
                 </div>
                 <button onClick={handleSaveProfile} disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'Salvar Alterações'}</button>
              </div>
            ) : (
              <div className="space-y-6">
                 <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex gap-3"><AlertCircle className="text-indigo-400 shrink-0"/><p className="text-sm text-indigo-200">A IA usará esses horários para agendar suas tarefas automaticamente.</p></div>
                 <div className="space-y-3">
                   {routineConfig.map((r, idx) => (
                     <div key={idx} className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <span className="font-medium text-zinc-200 w-24 flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${r.category === 'Trabalho' ? 'bg-amber-500' : r.category === 'Casa' ? 'bg-rose-500' : 'bg-emerald-500'}`}/> {r.category}</span>
                        <div className="flex items-center gap-3">
                          <input type="time" value={r.start} onChange={e => { const n = [...routineConfig]; n[idx].start = e.target.value; setRoutineConfig(n) }} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500 [color-scheme:dark]" />
                          <span className="text-zinc-500">até</span>
                          <input type="time" value={r.end} onChange={e => { const n = [...routineConfig]; n[idx].end = e.target.value; setRoutineConfig(n) }} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500 [color-scheme:dark]" />
                        </div>
                     </div>
                   ))}
                 </div>
                 <button onClick={handleSaveRoutine} className="w-full bg-white text-black hover:bg-zinc-200 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95">Salvar Rotina</button>
              </div>
            )}
         </div>
      </motion.div>
    </motion.div>
  )

  // ==========================================
  // 3. RENDERIZAÇÃO (JSX)
  // ==========================================

  return (
    <div className="flex h-screen bg-[#0f1115] overflow-hidden text-slate-200 font-sans selection:bg-indigo-500/30 relative">
      
      {/* FUNDO ATMOSFÉRICO */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* --- SIDEBAR --- */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen && !isMobile ? 280 : 0, opacity: isSidebarOpen && !isMobile ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full flex flex-col shrink-0 overflow-hidden whitespace-nowrap z-20 border-r border-white/5 bg-[#0f1115]/60 backdrop-blur-xl relative shadow-2xl"
      >
        <div className="w-[280px] flex flex-col h-full">
            {/* Header Sidebar */}
            <div className="p-6 flex justify-between items-center">
              <div className="flex items-center gap-3 pl-2">
                <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                  <Sparkles size={18} className="text-white" fill="currentColor" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">Organize.ia</span>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="text-zinc-500 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-md"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">
              
              {/* Botão de Rotinas (Stacks) */}
              <div>
                 <p className="text-[10px] font-bold text-zinc-500 px-3 mb-3 uppercase tracking-widest">Ações Rápidas</p>
                 <button onClick={() => setStackModalOpen(true)} className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/10 transition-all border border-transparent hover:border-indigo-500/30">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:text-indigo-300"><Layers size={16} /></div>
                    <span>Ativar Rotina</span>
                 </button>
              </div>

              {/* Categorias */}
              <div>
                <p className="text-[10px] font-bold text-zinc-500 px-3 mb-3 uppercase tracking-widest">Categorias</p>
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = activeCategory === item.id
                  const count = item.id === 'all' 
                    ? tasks.filter(t => t.status !== 'concluido').length 
                    : tasks.filter(t => t.category === item.id && t.status !== 'concluido').length

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveCategory(item.id)}
                      className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out relative overflow-hidden ${
                        isActive 
                          ? 'text-white shadow-lg shadow-indigo-500/10' 
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border-l-2 border-indigo-500"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <div className="flex items-center gap-3 relative z-10 pl-1">
                        <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'} />
                        {item.label}
                      </div>
                      {count > 0 && (
                        <span className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isActive 
                            ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' 
                            : 'bg-[#23262f]/50 border-white/5 text-zinc-500'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </nav>

            {/* Footer Sidebar */}
            <div className="p-4 border-t border-white/5 space-y-1">
              <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all group">
                <Settings size={18} className="text-zinc-500 group-hover:text-zinc-300" />
                <span>Configurações</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group">
                <LogOut size={18} className="text-zinc-500 group-hover:text-rose-400 transition-transform" /> 
                <span>Sair da conta</span>
              </button>
            </div>
        </div>
      </motion.aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <motion.main 
        animate={{ marginLeft: 0 }} 
        className="flex-1 h-full overflow-y-auto relative flex flex-col w-full z-10 no-scrollbar"
      >
        
        {/* Header (Top Bar) */}
        <AnimatePresence>
          {(!isSidebarOpen || isMobile) && (
            <motion.header 
              initial={{ y: -20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              className="sticky top-0 z-30 w-full bg-[#0f1115]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                 {!isMobile && <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"><PanelLeftOpen size={20} /></button>}
                 <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                   <Sparkles size={18} className="text-indigo-400" /> Organize.ia
                 </h1>
              </div>
              {/* Botão de Timeline no Header (Desktop) ou Config (Mobile) */}
              {isMobile ? (
                <button onClick={() => setSettingsOpen(true)} className="p-2 text-zinc-400"><Settings size={20}/></button>
              ) : (
                <button onClick={() => setViewMode(viewMode === 'calendar' ? 'kanban' : 'calendar')} className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${viewMode === 'calendar' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-[#161920] text-zinc-400 border-white/10 hover:border-white/20'}`}>
                   {viewMode === 'calendar' ? <LayoutGrid size={18} /> : <CalendarDays size={18} />} 
                   <span>{viewMode === 'calendar' ? 'Voltar ao Quadro' : 'Calendário'}</span>
                </button>
              )}
            </motion.header>
          )}
        </AnimatePresence>

        {/* --- MODAIS DE SOBREPOSIÇÃO --- */}
        <AnimatePresence>{showOnboarding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#161920] border border-indigo-500/30 w-full max-w-lg rounded-3xl shadow-2xl p-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
               <div className="text-center mb-8"><div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Clock size={32} className="text-indigo-400" /></div><h2 className="text-2xl font-bold text-white">Configurar sua Rotina</h2><p className="text-zinc-400 text-sm mt-2">Para a IA agendar suas tarefas nos horários certos, precisamos saber sua disponibilidade.</p></div>
               <div className="space-y-4 mb-8">{routineConfig.map((r, idx) => (<div key={idx} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5"><span className="font-medium text-zinc-300 w-24">{r.category}</span><div className="flex items-center gap-2"><input type="time" value={r.start} onChange={e => { const n = [...routineConfig]; n[idx].start = e.target.value; setRoutineConfig(n) }} className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 [color-scheme:dark]" /><span className="text-zinc-600">-</span><input type="time" value={r.end} onChange={e => { const n = [...routineConfig]; n[idx].end = e.target.value; setRoutineConfig(n) }} className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 [color-scheme:dark]" /></div></div>))}</div>
               <div className="flex gap-3"><button onClick={() => setShowOnboarding(false)} className="flex-1 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition font-medium">Pular</button><button onClick={handleSaveRoutine} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20">Salvar Rotina</button></div>
            </div>
          </motion.div>
        )}</AnimatePresence>

        <AnimatePresence>{settingsOpen && renderSettingsModal()}</AnimatePresence>

        <AnimatePresence>{editingTask && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setEditingTask(null)}>
              <motion.div onClick={(e) => e.stopPropagation()} className="bg-[#161920]/90 backdrop-blur-xl border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 ring-1 ring-white/5">
                <div className="flex justify-between items-center mb-2"><h3 className="text-lg font-bold text-white">Editar Tarefa</h3><button onClick={() => setEditingTask(null)}><X size={20} className="text-zinc-500 hover:text-white"/></button></div>
                <div className="space-y-1"><label className="text-xs text-zinc-500">Título</label><input value={editingTask.title} onChange={(e) => setEditingTask({...editingTask, title: e.target.value})} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-indigo-500 outline-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-xs text-zinc-500">Prioridade</label><select value={editingTask.priority} onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select></div>
                  <div className="space-y-1"><label className="text-xs text-zinc-500">Categoria</label><select value={editingTask.category} onChange={(e) => setEditingTask({...editingTask, category: e.target.value})} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"><option value="Trabalho">Trabalho</option><option value="Casa">Casa</option><option value="Estudos">Estudos</option><option value="Pessoal">Pessoal</option><option value="Saúde">Saúde</option></select></div>
                </div>
                <div className="space-y-1"><label className="text-xs text-zinc-500">Data de Vencimento</label><input type="datetime-local" value={editingTask.due_date ? new Date(editingTask.due_date).toISOString().slice(0, 16) : ''} onChange={(e) => setEditingTask({...editingTask, due_date: e.target.value ? new Date(e.target.value).toISOString() : null})} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none [color-scheme:dark]" /></div>
                <button onClick={handleSaveEdit} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-2 shadow-lg shadow-indigo-500/20"><Save size={18} /> Salvar Alterações</button>
              </motion.div>
            </motion.div>
        )}</AnimatePresence>

        <AnimatePresence>{stackModalOpen && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setStackModalOpen(false)}>
               <motion.div onClick={(e) => e.stopPropagation()} className="bg-[#161920] border border-white/10 w-full max-w-3xl rounded-3xl shadow-2xl p-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6"><button onClick={() => setStackModalOpen(false)}><X size={24} className="text-zinc-500 hover:text-white"/></button></div>
                 <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><Layers className="text-indigo-400" /> Rotinas Prontas</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ROUTINE_STACKS.map((stack, idx) => (
                       <div key={idx} className="group p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 hover:border-indigo-500/30 hover:shadow-2xl transition-all cursor-pointer" onClick={() => handleApplyStack(stack)}>
                          <div className="text-4xl mb-4">{stack.icon}</div>
                          <h3 className="text-lg font-bold text-white mb-2">{stack.title}</h3>
                          <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{stack.description}</p>
                          <button className="w-full py-2 bg-white/5 hover:bg-indigo-600 text-zinc-300 hover:text-white rounded-lg text-sm font-bold transition-colors">Ativar Rotina</button>
                       </div>
                    ))}
                 </div>
               </motion.div>
             </motion.div>
        )}</AnimatePresence>

        <AnimatePresence>{taskToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setTaskToDelete(null)}>
             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="bg-[#161920] border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl ring-1 ring-rose-500/20">
                <div className="flex flex-col items-center text-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20"><AlertTriangle className="text-rose-500" size={24}/></div>
                   <div><h3 className="text-lg font-bold text-white">Excluir Tarefa?</h3><p className="text-sm text-zinc-400 mt-1">Essa ação não pode ser desfeita.</p></div>
                   <div className="flex gap-3 w-full mt-2">
                      <button onClick={() => setTaskToDelete(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-medium transition-colors">Cancelar</button>
                      <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-900/20 transition-colors">Excluir</button>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}</AnimatePresence>

        <AnimatePresence>{guideOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setGuideOpen(false)}>
              <motion.div onClick={(e) => e.stopPropagation()} className="bg-[#161920]/90 backdrop-blur-xl border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ring-1 ring-white/5">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <div className="flex items-center gap-3"><div className="bg-indigo-500/20 p-2 rounded-lg"><Zap size={20} className="text-indigo-400" fill="currentColor" /></div><div><h3 className="font-bold text-gray-200">Sugestões</h3><p className="text-xs text-gray-500 truncate max-w-[250px]">{activeTask?.title}</p></div></div>
                  <button onClick={() => setGuideOpen(false)} className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                  {guideLoading ? (<div className="flex flex-col items-center justify-center py-12 gap-4"><Loader2 className="animate-spin text-indigo-500" size={36} /><p className="text-sm text-gray-500 animate-pulse">A IA está pensando...</p></div>) : suggestions.length > 0 ? (<div className="space-y-3">{suggestions.map((sug, idx) => {const isAdded = addedSuggestions.includes(idx); return (<div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isAdded ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-black/20 border-white/5 hover:border-white/10'}`}><div className="flex-1"><h4 className={`font-medium text-sm ${isAdded ? 'text-indigo-400' : 'text-gray-200'}`}>{sug.title}</h4><div className="flex gap-2 mt-1"><span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_STYLES[sug.priority?.toLowerCase()] || 'bg-zinc-800 text-zinc-400'}`}>{sug.priority}</span><span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500">{sug.estimated_time}m</span></div></div><button onClick={() => !isAdded && handleAddSuggestion(sug, idx)} disabled={isAdded} className={`p-2 rounded-lg text-xs font-bold transition-all ${isAdded ? 'bg-indigo-500/20 text-indigo-400 cursor-default' : 'bg-white text-black hover:bg-zinc-200'}`}>{isAdded ? <Check size={16}/> : <Plus size={16}/>}</button></div>)})}</div>) : <div className="text-center py-10 text-gray-500">Nenhuma sugestão encontrada.</div>}
                </div>
              </motion.div>
            </motion.div>
        )}</AnimatePresence>

        {/* --- ÁREA PRINCIPAL (SCROLL) --- */}
        <div className="max-w-7xl mx-auto w-full p-4 md:p-6 pb-28 md:pb-24 space-y-8 md:space-y-12">
          
          {/* Hero Widget (Gamificação) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
             {/* Foco Principal */}
             <div className="md:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 p-6 shadow-2xl">
                 <div className="absolute top-0 right-0 p-4 opacity-20"><Target size={120} className="text-indigo-400" /></div>
                 <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white mb-2">Vamos focar no que importa?</h2>
                    {activeRootTasks.find(t => t.priority === 'alta') ? (
                       <div className="mt-4 bg-[#0F1115]/60 backdrop-blur-md border border-white/10 p-4 rounded-xl inline-flex items-center gap-4">
                          <div className="bg-rose-500/20 p-2 rounded-lg"><Zap size={24} className="text-rose-400" /></div>
                          <div><p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Sua Prioridade #1</p><p className="text-lg font-medium text-white">{activeRootTasks.find(t => t.priority === 'alta').title}</p></div>
                       </div>
                    ) : <p className="text-zinc-400 mt-2">Você não tem tarefas de alta prioridade pendentes. Aproveite o dia! 🎉</p>}
                 </div>
             </div>
             {/* Stats */}
             <div className="rounded-2xl bg-[#161920]/60 border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden">
                 <div className="flex justify-between items-start">
                    <div><p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Produtividade</p><h3 className="text-3xl font-bold text-white mt-1">{completedRootTasks.length} <span className="text-base font-normal text-zinc-500">/ {tasks.filter(t => !t.parent_id).length}</span></h3></div>
                    <Trophy size={24} className="text-yellow-500" />
                 </div>
                 <div className="mt-6">
                    <div className="flex justify-between text-xs text-zinc-400 mb-2"><span>Progresso</span><span>{tasks.length > 0 ? Math.round((completedRootTasks.length / tasks.filter(t => !t.parent_id).length) * 100) : 0}%</span></div>
                    <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${tasks.length > 0 ? Math.round((completedRootTasks.length / tasks.filter(t => !t.parent_id).length) * 100) : 0}%` }} className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" /></div>
                 </div>
             </div>
          </div>

          <div className="flex justify-between items-end mt-4">
            <div><h2 className="text-3xl font-bold text-white tracking-tight">{activeCategory === 'all' ? 'Dashboard' : activeCategory}</h2></div>
          </div>

          {viewMode === 'kanban' && (
            <div className="space-y-8">
               {/* Input */}
               <div className="group relative bg-[#161920]/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl z-10">
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} placeholder="Digite sua tarefa (ex: Comprar marmita pro serviço amanhã)..." className="w-full h-24 p-4 rounded-xl bg-transparent text-white resize-none outline-none placeholder:text-zinc-600 text-lg" />
                  <div className="flex justify-between items-center px-2 pb-2">
                    <div className="flex gap-2 items-center overflow-x-auto no-scrollbar">
                       <div className="flex shrink-0 gap-2 items-center bg-black/30 px-2 py-1 rounded-md border border-white/5"><div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" /><span className="text-[10px] text-zinc-400 font-medium tracking-wide">IA ATIVA</span></div>
                       <button onClick={() => setRecurrenceMenuOpen(!recurrenceMenuOpen)} className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md border border-white/10 bg-black/30 text-zinc-400 hover:bg-white/10 whitespace-nowrap"><Repeat size={12} /> {selectedRecurrence.label}</button>
                       <AnimatePresence>{recurrenceMenuOpen && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-12 left-20 mt-2 w-40 bg-[#1A1D24] border border-[#2A2E37] rounded-xl shadow-xl overflow-hidden z-50">{RECURRENCE_OPTIONS.map((opt) => (<button key={opt.label} onClick={() => { setSelectedRecurrence(opt); setRecurrenceMenuOpen(false) }} className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">{opt.label}</button>))}</motion.div>)}</AnimatePresence>
                       <label className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md border border-white/10 bg-black/30 text-zinc-400 hover:bg-white/10 cursor-pointer whitespace-nowrap relative"><Calendar size={12}/> {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) : 'Data'}<input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={e => setSelectedDate(e.target.value)}/></label>
                    </div>
                    <button onClick={handleSubmit} disabled={loading || !input.trim()} className="shrink-0 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20">{loading ? <Loader2 className="animate-spin"/> : 'Organizar'}</button>
                  </div>
               </div>

               {/* Kanban Columns */}
               <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-3 md:gap-8 md:pb-0 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                 {COLUMNS.map(col => (
                   <div key={col.id} className="min-w-[85vw] snap-center md:min-w-0 flex flex-col gap-4">
                     <div className={`flex items-center justify-between pb-3 border-b border-white/5 px-2 pt-2 rounded-t-xl bg-gradient-to-b ${col.gradient} to-transparent`}>
                        <h3 className={`text-xs font-bold uppercase tracking-widest ${col.color}`}>{col.label}</h3>
                        <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">{activeRootTasks.filter(t => t.priority === col.id).length}</span>
                     </div>
                     <div className="flex flex-col gap-3 min-h-[150px]">
                       <AnimatePresence mode="popLayout">
                         {activeRootTasks.filter(t => t.priority === col.id).map(task => {
                             const subtasks = getSubtasks(task.id)
                             const dateDisplay = formatDate(task.due_date)
                             return (
                               <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#161920]/40 border border-white/5 p-4 rounded-xl hover:border-indigo-500/30 transition-colors group relative">
                                  <div className="flex gap-3 items-start">
                                     <button onClick={() => handleToggle(task.id, task.status)} className="mt-1 text-zinc-600 hover:text-emerald-400 shrink-0"><Circle size={18}/></button>
                                     <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-200 break-words">{task.title}</p>
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                           <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-500">{task.category}</span>
                                           {dateDisplay && <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">{dateDisplay}</span>}
                                        </div>
                                        {/* Subtarefas */}
                                        {subtasks.length > 0 && (
                                          <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                                            {subtasks.map((sub, idx) => (
                                              <div key={sub.id || idx} className="flex gap-2 items-center pl-1 group/sub">
                                                <CornerDownRight size={12} className="text-zinc-600 shrink-0"/>
                                                <span className={`text-[9px] px-1 rounded font-bold ${PRIORITY_STYLES[sub.priority?.toLowerCase()] || 'text-zinc-500'}`}>{sub.priority?.slice(0,1)}</span>
                                                <button onClick={() => handleToggle(sub.id, sub.status)} className={`text-xs text-left truncate flex-1 ${sub.status === 'concluido' ? 'text-zinc-600 line-through' : 'text-zinc-400 hover:text-white'}`}>{sub.title}</button>
                                                <div className="flex items-center opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                  <button onClick={() => setEditingTask(sub)} className="p-1 text-zinc-600 hover:text-yellow-500"><Pencil size={10}/></button>
                                                  <button onClick={() => requestDelete(sub.id)} className="p-1 text-zinc-600 hover:text-red-500"><Trash2 size={10}/></button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                     </div>
                                  </div>
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-[#161920] p-1 rounded-lg shadow-sm">
                                     <button onClick={() => handleGuide({id: task.id, title: task.title})} className="p-1.5 text-indigo-400 hover:bg-white/5 rounded"><Zap size={12}/></button>
                                     <button onClick={() => setEditingTask(task)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded"><Pencil size={12}/></button>
                                     <button onClick={() => requestDelete(task.id)} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-white/5 rounded"><Trash2 size={12}/></button>
                                  </div>
                               </motion.div>
                             )
                           })}
                       </AnimatePresence>
                     </div>
                   </div>
                 ))}
               </div>

               {/* Concluídas (Agora com certeza aqui!) */}
               <AnimatePresence>
                 {completedRootTasks.length > 0 && (
                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-white/5 pt-8 mt-8">
                      <h3 className="text-sm font-bold text-zinc-500 mb-4 flex items-center gap-2 px-1"><CheckCircle2 size={16}/> Concluídas ({completedRootTasks.length})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-60 hover:opacity-100 transition-opacity">
                         {completedRootTasks.map(task => (
                           <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#0F1115]/40 border border-white/5">
                              <button onClick={() => handleToggle(task.id, task.status)} className="text-emerald-500 shrink-0"><CheckCircle2 size={18}/></button>
                              <p className="text-sm text-zinc-600 line-through truncate flex-1">{task.title}</p>
                              <button onClick={() => requestDelete(task.id)} className="text-zinc-700 hover:text-rose-500"><Trash2 size={14}/></button>
                           </div>
                         ))}
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
           )}

           {viewMode === 'calendar' && renderCalendarView()}
        </div>
      </motion.main>

      {/* Menu Mobile */}
      {isMobile && (
         <nav className="fixed bottom-0 left-0 right-0 bg-[#161920]/95 backdrop-blur-xl border-t border-white/10 p-2 flex justify-around z-50 pb-safe">
            <button onClick={() => setViewMode('kanban')} className={`flex flex-col items-center p-2 rounded-lg ${viewMode === 'kanban' ? 'text-indigo-400' : 'text-zinc-500'}`}><LayoutGrid size={20}/><span className="text-[10px]">Kanban</span></button>
            <button onClick={() => setViewMode('calendar')} className={`flex flex-col items-center p-2 rounded-lg ${viewMode === 'calendar' ? 'text-indigo-400' : 'text-zinc-500'}`}><CalendarDays size={20}/><span className="text-[10px]">Agenda</span></button>
            <button onClick={() => setSettingsOpen(true)} className="flex flex-col items-center p-2 rounded-lg text-zinc-500"><Settings size={20}/><span className="text-[10px]">Config</span></button>
         </nav>
      )}
    </div>
  )
}
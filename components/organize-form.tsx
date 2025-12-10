'use client'

import { useState, useEffect, useMemo } from 'react'
import { organizeTasks } from '@/actions/organize'
import { toggleTask, deleteTask, createTask, updateTask, createBatchTasks } from '@/actions/tasks'
import { saveRoutine, getRoutines } from '@/actions/routines'
import { getUserProfile, updateUserProfile, changeUserPassword } from '@/actions/settings'
import { generateGuide } from '@/actions/guide'
import { 
  Sparkles, Loader2, Clock, CheckCircle2, Circle, Trash2, Zap, X, Plus, Check,
  LayoutGrid, Briefcase, Home, GraduationCap, User, Heart, LogOut, PanelLeftClose, PanelLeftOpen,
  CornerDownRight, Settings, Calendar, Repeat, ChevronDown, Pencil, Save, CalendarDays, 
  Layers, Target, Trophy, Lock, Smartphone, UserCircle, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// --- CONFIGURAÇÃO VISUAL ---

const MENU_ITEMS = [
  { id: 'all', label: 'Visão Geral', icon: LayoutGrid },
  { id: 'Trabalho', label: 'Trabalho', icon: Briefcase },
  { id: 'Casa', label: 'Casa', icon: Home },
  { id: 'Estudos', label: 'Estudos', icon: GraduationCap },
  { id: 'Pessoal', label: 'Pessoal', icon: User },
  { id: 'Saúde', label: 'Saúde', icon: Heart },
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

// --- COMPONENTE PRINCIPAL ---

export function OrganizeForm({ initialTasks }: { initialTasks: any[] }) {
  // Estados Gerais
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<any[]>(initialTasks || [])
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban')
  
  // Navegação
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [isMobile, setIsMobile] = useState(false)

  // Configurações e Modais
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'profile' | 'routine'>('profile')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [routineConfig, setRoutineConfig] = useState([
    { category: 'Trabalho', start: '09:00', end: '18:00' },
    { category: 'Casa', start: '18:00', end: '22:00' },
    { category: 'Estudos', start: '20:00', end: '21:00' }
  ])
  const [profileData, setProfileData] = useState({ fullName: '', phone: '', newPassword: '' })

  // Modais de Tarefa
  const [guideOpen, setGuideOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [guideLoading, setGuideLoading] = useState(false)
  const [activeTask, setActiveTask] = useState<{id: string, title: string} | null>(null)
  const [addedSuggestions, setAddedSuggestions] = useState<number[]>([])
  const [editingTask, setEditingTask] = useState<any | null>(null)
  
  // Inputs Extras
  const [recurrenceMenuOpen, setRecurrenceMenuOpen] = useState(false)
  const [selectedRecurrence, setSelectedRecurrence] = useState(RECURRENCE_OPTIONS[0])
  const [selectedDate, setSelectedDate] = useState('')

  // Inicialização
  useEffect(() => {
    const init = async () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
      
      const routines = await getRoutines()
      if (!routines || routines.length === 0) setShowOnboarding(true)
      else setRoutineConfig(routines.map((r: any) => ({ category: r.category, start: r.start_time, end: r.end_time })))

      const userProfile = await getUserProfile()
      if (userProfile.success && userProfile.data) {
        setProfileData(prev => ({ ...prev, fullName: userProfile.data.fullName, phone: userProfile.data.phone }))
      }
    }
    init()
    window.addEventListener('resize', () => setIsMobile(window.innerWidth < 768))
    return () => window.removeEventListener('resize', () => {})
  }, [])

  // --- ACTIONS ---

  async function handleSubmit() {
    if (!input.trim()) return
    setLoading(true)
    const userContext = { localTime: new Date().toLocaleString('pt-BR'), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    const recurrencePayload = selectedRecurrence.type ? { type: selectedRecurrence.type as any, interval: selectedRecurrence.interval } : undefined
    const result = await organizeTasks(input, userContext, recurrencePayload, selectedDate)
    if (result.success && result.data) {
      setTasks(prev => [...result.data, ...prev])
      setInput(''); setSelectedRecurrence(RECURRENCE_OPTIONS[0]); setSelectedDate('')
    } else {
      alert("Erro: " + result.error)
    }
    setLoading(false)
  }

  const handleToggle = async (id: string, s: string) => {
    const ns = s === 'concluido' ? 'pendente' : 'concluido'
    setTasks(p => p.map(t => t.id === id ? { ...t, status: ns } : t))
    await toggleTask(id, ns === 'concluido')
  }

  const handleDelete = async (id: string) => {
    if(confirm("Excluir tarefa?")) {
      setTasks(p => p.filter(t => t.id !== id && t.parent_id !== id))
      await deleteTask(id)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingTask) return
    setTasks(p => p.map(t => t.id === editingTask.id ? editingTask : t))
    await updateTask(editingTask.id, editingTask)
    setEditingTask(null)
  }

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

  const handleGuide = async (task: {id: string, title: string}) => {
    setActiveTask(task); setGuideOpen(true); setSuggestions([]); setAddedSuggestions([]); setGuideLoading(true)
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

  // --- FILTROS ---
  const filteredTasks = activeCategory === 'all' ? tasks : tasks.filter(t => t.category === activeCategory)
  const rootTasks = filteredTasks.filter(t => !t.parent_id)
  const activeRootTasks = rootTasks.filter(t => t.status !== 'concluido')
  const completedRootTasks = rootTasks.filter(t => t.status === 'concluido')

  const getSubtasks = (parentId: string) => {
    return tasks.filter(t => t.parent_id === parentId).sort((a, b) => {
      if (a.status === 'concluido' && b.status !== 'concluido') return 1
      if (a.status !== 'concluido' && b.status === 'concluido') return -1
      return (PRIORITY_ORDER[a.priority?.toLowerCase()] || 2) - (PRIORITY_ORDER[b.priority?.toLowerCase()] || 2)
    })
  }

  const renderCalendarView = () => {
    const todayTasks = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString())
    const sortedTasks = todayTasks.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
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
                    <div><h4 className="font-medium text-zinc-200">{task.title}</h4><div className="flex gap-2 mt-2"><span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-400">{task.category}</span><span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-400">{task.estimated_time}min</span></div></div>
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

  // --- RENDER DO PAINEL DE CONFIGURAÇÕES (PREMIUM) ---
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

  return (
    <div className="flex h-screen bg-[#0f1115] overflow-hidden text-slate-200 font-sans selection:bg-indigo-500/30 relative">
      
      {/* Onboarding */}
      <AnimatePresence>{showOnboarding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#161920] border border-indigo-500/30 w-full max-w-lg rounded-3xl shadow-2xl p-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
               <div className="text-center mb-8"><div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Clock size={32} className="text-indigo-400" /></div><h2 className="text-2xl font-bold text-white">Bem-vindo ao Organize.ia</h2><p className="text-zinc-400 text-sm mt-2">Vamos configurar sua rotina para a IA trabalhar melhor.</p></div>
               <div className="space-y-4 mb-8">{routineConfig.map((r, idx) => (<div key={idx} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5"><span className="font-medium text-zinc-300 w-24">{r.category}</span><div className="flex items-center gap-2"><input type="time" value={r.start} onChange={e => { const n = [...routineConfig]; n[idx].start = e.target.value; setRoutineConfig(n) }} className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 [color-scheme:dark]" /><span className="text-zinc-600">-</span><input type="time" value={r.end} onChange={e => { const n = [...routineConfig]; n[idx].end = e.target.value; setRoutineConfig(n) }} className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 [color-scheme:dark]" /></div></div>))}</div>
               <div className="flex gap-3"><button onClick={() => setShowOnboarding(false)} className="flex-1 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition font-medium">Pular</button><button onClick={handleSaveRoutine} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20">Começar</button></div>
            </div>
          </motion.div>
      )}</AnimatePresence>

      {/* Configurações */}
      <AnimatePresence>{settingsOpen && renderSettingsModal()}</AnimatePresence>

      {/* Sidebar */}
      <motion.aside initial={false} animate={{ width: isSidebarOpen && !isMobile ? 280 : 0, opacity: isSidebarOpen && !isMobile ? 1 : 0 }} className="hidden md:flex h-full flex-col shrink-0 overflow-hidden border-r border-white/5 bg-[#0f1115]/60 backdrop-blur-xl z-20">
        <div className="w-[280px] p-6 flex flex-col h-full">
           <div className="flex justify-between items-center mb-8"><h1 className="text-lg font-bold flex items-center gap-2 text-white"><Sparkles className="text-indigo-400"/> Organize.ia</h1><button onClick={() => setSidebarOpen(false)}><PanelLeftClose className="text-zinc-500 hover:text-white"/></button></div>
           <nav className="space-y-2 flex-1">{MENU_ITEMS.map(item => (<button key={item.id} onClick={() => setViewMode(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === item.id ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-white/5'}`}><item.icon size={18} /> {item.label}</button>))}</nav>
           <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"><Settings size={18}/> Configurações</button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 h-full overflow-y-auto relative flex flex-col w-full z-10">
        <header className="sticky top-0 z-30 bg-[#0f1115]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
           <div className="flex items-center gap-4">{(!isSidebarOpen || isMobile) && <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"><PanelLeftOpen size={20}/></button>}<h2 className="text-xl font-bold text-white">{viewMode === 'kanban' ? 'Quadro' : 'Calendário Inteligente'}</h2></div>
           {isMobile && <button onClick={() => setSettingsOpen(true)} className="p-2 text-zinc-400"><Settings size={20}/></button>}
        </header>

        <div className="p-4 md:p-8 pb-24 max-w-7xl mx-auto w-full">
           {viewMode === 'kanban' && (
             <div className="space-y-8">
               {/* Input */}
               <div className="group relative bg-[#161920]/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl z-10">
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} placeholder="Digite sua tarefa..." className="w-full h-24 p-4 rounded-xl bg-transparent text-white resize-none outline-none placeholder:text-zinc-600 text-lg" />
                  <div className="flex justify-between items-center px-2 pb-2">
                    <div className="flex gap-2">
                       <button onClick={() => setRecurrenceMenuOpen(!recurrenceMenuOpen)} className="text-xs text-zinc-400 hover:text-white flex gap-1 items-center bg-black/20 px-2 py-1 rounded border border-white/5"><Repeat size={12}/> {selectedRecurrence.label}</button>
                       <label className="text-xs text-zinc-400 hover:text-white flex gap-1 items-center bg-black/20 px-2 py-1 rounded border border-white/5 cursor-pointer"><Calendar size={12}/> {selectedDate || 'Data'}<input type="date" className="hidden" onChange={e => setSelectedDate(e.target.value)}/></label>
                    </div>
                    <button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20">{loading ? <Loader2 className="animate-spin"/> : 'Organizar'}</button>
                  </div>
               </div>

               {/* Kanban */}
               <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-3 md:gap-8 md:pb-0 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                 {COLUMNS.map(col => (
                   <div key={col.id} className="min-w-[85vw] snap-center md:min-w-0 flex flex-col gap-4">
                     <h3 className={`text-xs font-bold uppercase tracking-widest ${col.color} px-2`}>{col.label}</h3>
                     <div className="space-y-3">
                       {activeRootTasks.filter(t => t.priority === col.id).map(task => {
                         const subtasks = getSubtasks(task.id)
                         return (
                           <div key={task.id} className="bg-[#161920]/40 border border-white/5 p-4 rounded-xl hover:border-indigo-500/30 transition-colors group relative">
                              <div className="flex gap-3 items-start">
                                 <button onClick={() => handleToggle(task.id, task.status)} className="mt-1 text-zinc-600 hover:text-emerald-400 shrink-0"><Circle size={18}/></button>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm text-zinc-200 break-words">{task.title}</p>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                       <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-500">{task.category}</span>
                                       {task.due_date && <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">{formatDate(task.due_date)}</span>}
                                    </div>
                                    {subtasks.length > 0 && <div className="mt-3 pt-3 border-t border-white/5 space-y-2">{subtasks.map(sub => (<div key={sub.id} className="flex gap-2 items-center pl-1"><CornerDownRight size={12} className="text-zinc-600"/><button onClick={() => handleToggle(sub.id, sub.status)} className="text-xs text-zinc-400 hover:text-white truncate flex-1 text-left">{sub.title}</button></div>))}</div>}
                                 </div>
                              </div>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-[#161920] p-1 rounded-lg shadow-sm">
                                 <button onClick={() => handleGuide({id: task.id, title: task.title})} className="p-1.5 text-indigo-400 hover:bg-white/5 rounded"><Zap size={12}/></button>
                                 <button onClick={() => setEditingTask(task)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded"><Pencil size={12}/></button>
                                 <button onClick={() => handleDelete(task.id)} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-white/5 rounded"><Trash2 size={12}/></button>
                              </div>
                           </div>
                         )
                       })}
                     </div>
                   </div>
                 ))}
               </div>

               {/* Concluídas */}
               {completedRootTasks.length > 0 && (
                 <div className="border-t border-white/5 pt-8 opacity-60 hover:opacity-100 transition-opacity">
                    <h3 className="text-sm font-bold text-zinc-500 mb-4 flex items-center gap-2"><CheckCircle2 size={16}/> Concluídas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {completedRootTasks.map(task => (
                         <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#0F1115]/40 border border-white/5">
                            <button onClick={() => handleToggle(task.id, task.status)} className="text-emerald-500 shrink-0"><CheckCircle2 size={18}/></button>
                            <p className="text-sm text-zinc-600 line-through truncate flex-1">{task.title}</p>
                            <button onClick={() => handleDelete(task.id)} className="text-zinc-700 hover:text-rose-500"><Trash2 size={14}/></button>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
             </div>
           )}

           {viewMode === 'calendar' && renderCalendarView()}
        </div>
      </main>

      {/* Menu Mobile */}
      {isMobile && (
         <nav className="fixed bottom-0 left-0 right-0 bg-[#161920]/95 backdrop-blur-xl border-t border-white/10 p-2 flex justify-around z-50 pb-safe">
            <button onClick={() => setViewMode('kanban')} className={`flex flex-col items-center p-2 rounded-lg ${viewMode === 'kanban' ? 'text-indigo-400' : 'text-zinc-500'}`}><LayoutGrid size={20}/><span className="text-[10px]">Kanban</span></button>
            <button onClick={() => setViewMode('calendar')} className={`flex flex-col items-center p-2 rounded-lg ${viewMode === 'calendar' ? 'text-indigo-400' : 'text-zinc-500'}`}><CalendarDays size={20}/><span className="text-[10px]">Agenda</span></button>
            <button onClick={() => setSettingsOpen(true)} className="flex flex-col items-center p-2 rounded-lg text-zinc-500"><Settings size={20}/><span className="text-[10px]">Config</span></button>
         </nav>
      )}

      {/* Modal Edição (Simplificado para manter o arquivo único, mas com estilo novo) */}
      <AnimatePresence>{editingTask && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setEditingTask(null)}>
           <motion.div onClick={e => e.stopPropagation()} className="bg-[#161920] border border-white/10 w-full max-w-md rounded-2xl p-6 space-y-4 relative shadow-2xl">
              <h3 className="text-lg font-bold text-white">Editar</h3>
              <input value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none"/>
              <div className="flex gap-2">
                 <select value={editingTask.priority} onChange={e => setEditingTask({...editingTask, priority: e.target.value})} className="flex-1 bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none"><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select>
                 <input type="datetime-local" value={editingTask.due_date ? new Date(editingTask.due_date).toISOString().slice(0,16) : ''} onChange={e => setEditingTask({...editingTask, due_date: e.target.value})} className="flex-1 bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none [color-scheme:dark]"/>
              </div>
              <button onClick={handleSaveEdit} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Salvar</button>
           </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Modal Guide (IA) */}
      <AnimatePresence>{guideOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setGuideOpen(false)}>
           <motion.div onClick={e => e.stopPropagation()} className="bg-[#161920] border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl h-[70vh] flex flex-col relative">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white flex items-center gap-2"><Zap className="text-indigo-400"/> Sugestões</h3><button onClick={() => setGuideOpen(false)}><X className="text-zinc-500"/></button></div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                 {guideLoading ? <div className="text-center text-zinc-500 py-10"><Loader2 className="animate-spin mx-auto mb-2"/>Gerando...</div> : suggestions.map((sug, i) => (
                    <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                       <div><p className="font-medium text-white">{sug.title}</p><span className="text-xs text-zinc-500">{sug.estimated_time}m • {sug.priority}</span></div>
                       <button onClick={() => !addedSuggestions.includes(i) && handleAddSuggestion(sug, i)} disabled={addedSuggestions.includes(i)} className={`p-2 rounded-lg ${addedSuggestions.includes(i) ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-black'}`}>{addedSuggestions.includes(i) ? <Check size={16}/> : <Plus size={16}/>}</button>
                    </div>
                 ))}
              </div>
           </motion.div>
        </motion.div>
      )}</AnimatePresence>

    </div>
  )
}
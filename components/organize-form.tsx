'use client'

import { useState, useEffect } from 'react'
import { organizeTasks } from '@/actions/organize'
import { toggleTask, deleteTask, createTask, updateTask } from '@/actions/tasks'
import { saveRoutine, getRoutines } from '@/actions/routines' // Import novo
import { generateGuide } from '@/actions/guide'
import { 
  Sparkles, Loader2, Clock, CheckCircle2, Circle, Trash2, Zap, X, Plus, Check,
  LayoutGrid, Briefcase, Home, GraduationCap, User, Heart, LogOut, PanelLeftClose, PanelLeftOpen,
  CornerDownRight, Settings, Calendar, Repeat, ChevronDown, Pencil, Save, CalendarDays
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// --- DADOS ---
const MENU_ITEMS = [
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'calendar', label: 'Calendário', icon: CalendarDays }, // Novo item
]

// Mantivemos as outras constantes...
const RECURRENCE_OPTIONS = [
  { label: 'Não repetir', type: null, interval: 0 },
  { label: 'Diariamente', type: 'daily', interval: 1 },
  { label: 'Semanalmente', type: 'weekly', interval: 1 },
  { label: 'Quinzenalmente', type: 'weekly', interval: 2 },
  { label: 'Mensalmente', type: 'monthly', interval: 1 },
]

const COLUMNS = [
  { id: 'alta', label: 'Alta Prioridade', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  { id: 'media', label: 'Média Prioridade', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'baixa', label: 'Baixa Prioridade', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
]

const PRIORITY_STYLES: Record<string, string> = {
  alta: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  media: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  baixa: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
}

const PRIORITY_ORDER: Record<string, number> = { 'alta': 1, 'media': 2, 'baixa': 3 }

const formatDate = (dateString: string) => {
  if (!dateString) return null
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

export function OrganizeForm({ initialTasks }: { initialTasks: any[] }) {
  // Estados
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<any[]>(initialTasks || [])
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban') // Estado da Visualização
  
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Onboarding (Rotina)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [routineConfig, setRoutineConfig] = useState([
    { category: 'Trabalho', start: '09:00', end: '18:00' },
    { category: 'Casa', start: '18:00', end: '22:00' },
    { category: 'Estudos', start: '20:00', end: '21:00' }
  ])

  // Modais
  const [guideOpen, setGuideOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [guideLoading, setGuideLoading] = useState(false)
  const [activeTask, setActiveTask] = useState<{id: string, title: string} | null>(null)
  const [addedSuggestions, setAddedSuggestions] = useState<number[]>([])
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [recurrenceMenuOpen, setRecurrenceMenuOpen] = useState(false)
  const [selectedRecurrence, setSelectedRecurrence] = useState(RECURRENCE_OPTIONS[0])
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    const init = async () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)

      // Verifica se já tem rotina salva
      const routines = await getRoutines()
      if (!routines || routines.length === 0) {
        setShowOnboarding(true)
      }
    }
    init()
    window.addEventListener('resize', () => {
        const mobile = window.innerWidth < 768
        setIsMobile(mobile)
        if (mobile) setSidebarOpen(false)
    })
    return () => window.removeEventListener('resize', () => {})
  }, [])

  // Actions
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

  const handleSaveRoutine = async () => {
    await saveRoutine(routineConfig)
    setShowOnboarding(false)
  }

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'concluido' ? 'pendente' : 'concluido'
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    await toggleTask(id, newStatus === 'concluido')
  }

  const handleDelete = async (id: string) => {
    if(confirm("Excluir tarefa?")) {
      setTasks(prev => prev.filter(t => t.id !== id && t.parent_id !== id))
      await deleteTask(id)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingTask) return
    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t))
    const taskToSave = { ...editingTask }
    setEditingTask(null)
    await updateTask(taskToSave.id, taskToSave)
  }

  const handleGuide = async (task: {id: string, title: string}) => {
    setActiveTask(task); setGuideOpen(true); setSuggestions([]); setAddedSuggestions([]); setGuideLoading(true)
    const result = await generateGuide(task.title)
    if (result.success && result.suggestions) setSuggestions(result.suggestions)
    setGuideLoading(false)
  }

  const handleAddSuggestion = async (suggestion: any, index: number) => {
    setAddedSuggestions(prev => [...prev, index])
    if (activeTask) {
      const result = await createTask(suggestion, activeTask.id)
      if (result.success && result.data) setTasks(prev => [result.data, ...prev])
    }
  }

  // Filtros Kanban
  const activeRootTasks = tasks.filter(t => t.status !== 'concluido' && !t.parent_id)
  const completedRootTasks = tasks.filter(t => t.status === 'concluido')

  const getSubtasks = (parentId: string) => {
    return tasks.filter(t => t.parent_id === parentId).sort((a, b) => {
        if (a.status === 'concluido' && b.status !== 'concluido') return 1
        if (a.status !== 'concluido' && b.status === 'concluido') return -1
        const pA = PRIORITY_ORDER[a.priority?.toLowerCase()] || 99
        const pB = PRIORITY_ORDER[b.priority?.toLowerCase()] || 99
        return pA - pB
    })
  }

  // Renderização do Calendário
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
          }) : (
            <div className="pl-8 text-zinc-500 italic">Nenhuma tarefa agendada para hoje.</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0f1115] overflow-hidden text-slate-200 font-sans selection:bg-indigo-500/30 relative">
      
      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#161920] border border-indigo-500/30 w-full max-w-lg rounded-3xl shadow-2xl p-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
               <div className="text-center mb-8">
                 <div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Clock size={32} className="text-indigo-400" /></div>
                 <h2 className="text-2xl font-bold text-white">Configurar sua Rotina</h2>
                 <p className="text-zinc-400 text-sm mt-2">Para a IA agendar suas tarefas nos horários certos, precisamos saber sua disponibilidade.</p>
               </div>
               
               <div className="space-y-4 mb-8">
                 {routineConfig.map((r, idx) => (
                   <div key={idx} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                      <span className="font-medium text-zinc-300 w-24">{r.category}</span>
                      <div className="flex items-center gap-2">
                        <input type="time" value={r.start} onChange={e => { const n = [...routineConfig]; n[idx].start = e.target.value; setRoutineConfig(n) }} className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500" />
                        <span className="text-zinc-600">-</span>
                        <input type="time" value={r.end} onChange={e => { const n = [...routineConfig]; n[idx].end = e.target.value; setRoutineConfig(n) }} className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500" />
                      </div>
                   </div>
                 ))}
               </div>

               <div className="flex gap-3">
                 <button onClick={() => setShowOnboarding(false)} className="flex-1 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition font-medium">Pular</button>
                 <button onClick={handleSaveRoutine} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20">Salvar Rotina</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen && !isMobile ? 280 : 0, opacity: isSidebarOpen && !isMobile ? 1 : 0 }}
        className="hidden md:flex h-full flex-col shrink-0 overflow-hidden whitespace-nowrap z-20 border-r border-white/5 bg-[#0f1115]/95 backdrop-blur-xl relative shadow-2xl"
      >
        <div className="w-[280px] flex flex-col h-full">
            <div className="p-6 flex justify-between items-center">
              <div className="flex items-center gap-3 pl-2">
                <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                  <Sparkles size={18} className="text-white" fill="currentColor" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">Organize.ia</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-zinc-500 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-md"><PanelLeftClose size={18} /></button>
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = viewMode === item.id
                return (
                  <button key={item.id} onClick={() => setViewMode(item.id as any)} className={`group w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${isActive ? 'text-white shadow-lg shadow-indigo-500/10' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'}`}>
                    {isActive && <motion.div layoutId="activeTab" className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border-l-2 border-indigo-500" initial={false} />}
                    <div className="flex items-center gap-3 relative z-10 pl-1"><Icon size={18} className={isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'} />{item.label}</div>
                  </button>
                )
              })}
            </nav>
            <div className="p-4 border-t border-white/5 space-y-1"><button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all group"><Settings size={18} className="text-zinc-500 group-hover:text-zinc-300" /><span>Configurações</span></button><button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group"><LogOut size={18} className="text-zinc-500 group-hover:text-rose-400" /><span>Sair da conta</span></button></div>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT --- */}
      <motion.main animate={{ marginLeft: 0 }} className="flex-1 h-full overflow-y-auto relative flex flex-col w-full z-10 no-scrollbar">
        
        {/* Header */}
        <AnimatePresence>
          {(!isSidebarOpen || isMobile) && (
            <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-30 w-full bg-[#0f1115]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center gap-4">
              {!isMobile && <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"><PanelLeftOpen size={20} /></button>}
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2"><Sparkles size={18} className="text-indigo-400" /> Organize.ia</h1>
            </motion.header>
          )}
        </AnimatePresence>

        {/* --- MODAIS (Edição e Sugestão) --- */}
        <AnimatePresence>{editingTask && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setEditingTask(null)}><motion.div onClick={(e) => e.stopPropagation()} className="bg-[#161920]/90 backdrop-blur-xl border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 ring-1 ring-white/5"><div className="flex justify-between items-center mb-2"><h3 className="text-lg font-bold text-white">Editar</h3><button onClick={() => setEditingTask(null)}><X size={20} className="text-zinc-500 hover:text-white"/></button></div><div className="space-y-1"><label className="text-xs text-zinc-500">Título</label><input value={editingTask.title} onChange={(e) => setEditingTask({...editingTask, title: e.target.value})} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-indigo-500 outline-none" /></div><button onClick={handleSaveEdit} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-2">Salvar</button></motion.div></motion.div>}</AnimatePresence>
        <AnimatePresence>{guideOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setGuideOpen(false)}><motion.div onClick={(e) => e.stopPropagation()} className="bg-[#161920]/90 backdrop-blur-xl border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ring-1 ring-white/5"><div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5"><div className="flex items-center gap-3"><div className="bg-indigo-500/20 p-2 rounded-lg"><Zap size={20} className="text-indigo-400" fill="currentColor" /></div><div><h3 className="font-bold text-gray-200">Sugestões</h3><p className="text-xs text-gray-500 truncate max-w-[250px]">{activeTask?.title}</p></div></div><button onClick={() => setGuideOpen(false)} className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition"><X size={20}/></button></div><div className="p-6 overflow-y-auto custom-scrollbar">{guideLoading ? <div className="flex flex-col items-center justify-center py-12 gap-4"><Loader2 className="animate-spin text-indigo-500" size={36} /><p className="text-sm text-gray-500 animate-pulse">Pensando...</p></div> : suggestions.length > 0 ? <div className="space-y-3">{suggestions.map((sug, idx) => {const isAdded = addedSuggestions.includes(idx); return <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isAdded ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-black/20 border-white/5 hover:border-white/10'}`}><div className="flex-1"><h4 className={`font-medium text-sm ${isAdded ? 'text-indigo-400' : 'text-gray-200'}`}>{sug.title}</h4><div className="flex gap-2 mt-1"><span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_STYLES[sug.priority?.toLowerCase()] || 'bg-zinc-800 text-zinc-400'}`}>{sug.priority}</span><span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500">{sug.estimated_time}m</span></div></div><button onClick={() => !isAdded && handleAddSuggestion(sug, idx)} disabled={isAdded} className={`p-2 rounded-lg text-xs font-bold transition-all ${isAdded ? 'bg-indigo-500/20 text-indigo-400 cursor-default' : 'bg-white text-black hover:bg-zinc-200'}`}>{isAdded ? <Check size={16}/> : <Plus size={16}/>}</button></div>})}</div> : <div className="text-center py-10 text-gray-500">Sem sugestões.</div>}</div></motion.div></motion.div>}</AnimatePresence>

        <div className="max-w-7xl mx-auto w-full p-4 md:p-6 pb-28 md:pb-24 space-y-8 md:space-y-12">
          
          <div className="flex justify-between items-end mt-4">
            <div><h2 className="text-3xl font-bold text-white tracking-tight">{viewMode === 'kanban' ? 'Dashboard' : 'Calendário Inteligente'}</h2></div>
          </div>

          {/* VIEW: KANBAN */}
          {viewMode === 'kanban' && (
            <>
              {/* Input */}
              <div className="group relative bg-[#161920]/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl max-w-3xl mx-auto z-10 transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} placeholder="O que vamos organizar hoje?" className="w-full h-24 p-4 rounded-xl bg-transparent text-white resize-none outline-none placeholder:text-zinc-600 text-lg font-light" />
                <div className="flex justify-between items-center px-2 pb-2">
                  <div className="flex gap-3 items-center overflow-x-auto no-scrollbar">
                     <div className="flex shrink-0 gap-2 items-center bg-black/30 px-2 py-1 rounded-md border border-white/5"><div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" /><span className="text-[10px] text-zinc-400 font-medium tracking-wide">IA ATIVA</span></div>
                     <div className="relative shrink-0">
                        <button onClick={() => setRecurrenceMenuOpen(!recurrenceMenuOpen)} className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md border transition-all ${selectedRecurrence.type ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-black/30 text-zinc-400 border-white/5 hover:bg-white/10'}`}><Repeat size={12} /> {selectedRecurrence.label} <ChevronDown size={10} /></button>
                        <AnimatePresence>{recurrenceMenuOpen && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 mt-2 w-40 bg-[#1A1D24] border border-[#2A2E37] rounded-xl shadow-xl overflow-hidden z-50">{RECURRENCE_OPTIONS.map((opt) => (<button key={opt.label} onClick={() => { setSelectedRecurrence(opt); setRecurrenceMenuOpen(false) }} className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">{opt.label}</button>))}</motion.div>)}</AnimatePresence>
                     </div>
                     <div className="relative group shrink-0">
                        <label className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md border cursor-pointer transition-all ${selectedDate ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-black/30 text-zinc-400 border-white/5 hover:bg-white/10'}`}><Calendar size={12} /> {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) : 'Data'}<input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setSelectedDate(e.target.value)} /></label>
                     </div>
                  </div>
                  <button onClick={handleSubmit} disabled={loading || !input.trim()} className="shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-95">{loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Sparkles className="w-4 h-4 text-white" /> <span className="hidden md:inline">Organizar</span></>}</button>
                </div>
              </div>

              {/* Grid Kanban */}
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-3 md:gap-8 md:pb-0 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {COLUMNS.map((col) => (
                  <div key={col.id} className="min-w-[85vw] snap-center md:min-w-0 flex flex-col gap-5">
                    <div className={`flex items-center justify-between pb-3 border-b border-white/5 px-2 pt-2 rounded-t-xl bg-gradient-to-b ${col.id === 'alta' ? 'from-rose-500/10' : col.id === 'media' ? 'from-amber-500/10' : 'from-emerald-500/10'} to-transparent`}>
                      <div className="flex items-center gap-2.5"><span className={`w-1.5 h-1.5 rounded-full ${col.color.replace('text', 'bg')}`} /><h3 className={`text-xs font-bold uppercase tracking-widest ${col.color.replace('text-', 'text-opacity-80 text-')}`}>{col.label}</h3></div>
                      <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">{activeRootTasks.filter(t => t.priority === col.id).length}</span>
                    </div>
                    <div className="flex flex-col gap-3 min-h-[150px]">
                      <AnimatePresence mode="popLayout">
                        {activeRootTasks.filter(t => t.priority === col.id).map((task) => {
                            const subtasks = getSubtasks(task.id)
                            const dateDisplay = formatDate(task.due_date)
                            return (
                              <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="group p-5 rounded-2xl bg-[#161920]/40 border border-white/5 hover:border-white/10 hover:bg-[#161920]/80 hover:shadow-xl transition-all relative overflow-hidden backdrop-blur-sm">
                                <div className="flex items-start gap-3 relative z-10">
                                  <button onClick={() => handleToggle(task.id, task.status)} className="mt-0.5 text-zinc-600 hover:text-emerald-400 transition-colors shrink-0"><Circle size={20} strokeWidth={1.5} /></button>
                                  <div className="flex-1 space-y-3 min-w-0">
                                    <div className="flex justify-between items-start gap-3">
                                      <p className="text-sm text-zinc-200 font-medium leading-relaxed break-words flex-1">{task.title}</p>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => handleGuide({id: task.id, title: task.title})} className="text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 p-1.5 rounded-md transition-colors"><Zap size={14} fill="currentColor" /></button>
                                        <button onClick={() => setEditingTask(task)} className="text-zinc-600 hover:text-yellow-500 p-1.5 rounded-md hover:bg-yellow-500/10 transition-colors"><Pencil size={14} /></button>
                                        <button onClick={() => handleDelete(task.id)} className="text-zinc-600 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors"><Trash2 size={14} /></button>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                                       <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">{task.category}</span>
                                       <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock size={10} /> {task.estimated_time}m</span>
                                       {dateDisplay && <span className="text-[10px] text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/10"><Calendar size={10} /> {dateDisplay}</span>}
                                    </div>
                                    {subtasks.length > 0 && (
                                      <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                                        {subtasks.map((sub, idx) => (
                                          <div key={sub.id || `sub-${idx}`} className="flex items-start gap-2 pl-1 group/sub">
                                            <CornerDownRight size={12} className="text-zinc-600 shrink-0 mt-1" />
                                            <span className={`text-[9px] px-1 rounded uppercase tracking-wider font-bold shrink-0 h-fit mt-0.5 ${PRIORITY_STYLES[sub.priority?.toLowerCase()] || 'text-zinc-500 bg-zinc-800'}`}>{sub.priority?.slice(0,1)}</span>
                                            <button onClick={() => handleToggle(sub.id, sub.status)} className={`flex-1 text-xs text-left leading-tight break-words hover:underline ${sub.status === 'concluido' ? 'text-zinc-600 line-through' : 'text-zinc-400 hover:text-emerald-400'}`}>{sub.title}</button>
                                            <div className="flex items-center opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                              <button onClick={() => setEditingTask(sub)} className="text-zinc-600 hover:text-yellow-500 p-1"><Pencil size={10} /></button>
                                              <button onClick={() => handleDelete(sub.id)} className="text-zinc-600 hover:text-red-500 p-1"><Trash2 size={10} /></button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                      </AnimatePresence>
                      {activeRootTasks.filter(t => t.priority === col.id).length === 0 && <div className="h-24 rounded-xl border border-dashed border-white/5 flex items-center justify-center text-zinc-800 text-xs">Vazio</div>}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Concluídas */}
              {completedRootTasks.length > 0 && (
                <div className="border-t border-white/5 pt-12 mt-12 opacity-60 hover:opacity-100 transition-opacity duration-500">
                  <div className="flex items-center gap-3 mb-6 px-1">
                    <h3 className="text-lg font-bold text-zinc-500 flex items-center gap-2"><CheckCircle2 size={20} className="text-emerald-600" /> Concluídas ({completedRootTasks.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {completedRootTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#0F1115]/40 border border-white/5">
                        <button onClick={() => handleToggle(task.id, task.status)} className="text-emerald-500 hover:text-yellow-400 shrink-0"><CheckCircle2 size={20} /></button>
                        <div className="flex-1 min-w-0"><p className="text-sm text-zinc-600 line-through truncate">{task.title}</p></div>
                        <button onClick={() => handleDelete(task.id)} className="text-zinc-800 hover:text-rose-500 shrink-0"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* VIEW: CALENDAR */}
          {viewMode === 'calendar' && renderCalendarView()}

        </div>
      </motion.main>

      {/* BOTTOM BAR MOBILE */}
      {isMobile && (
         <nav className="fixed bottom-0 left-0 right-0 bg-[#161920]/95 backdrop-blur-xl border-t border-white/10 p-2 flex justify-around z-50 pb-safe">
            <button onClick={() => setViewMode('kanban')} className={`flex flex-col items-center justify-center p-2 rounded-lg w-full transition-colors ${viewMode === 'kanban' ? 'text-indigo-400' : 'text-zinc-500'}`}><LayoutGrid size={20} /><span className="text-[10px] mt-1">Kanban</span></button>
            <button onClick={() => setViewMode('calendar')} className={`flex flex-col items-center justify-center p-2 rounded-lg w-full transition-colors ${viewMode === 'calendar' ? 'text-indigo-400' : 'text-zinc-500'}`}><CalendarDays size={20} /><span className="text-[10px] mt-1">Agenda</span></button>
         </nav>
      )}

    </div>
  )
}
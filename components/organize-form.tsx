'use client'

import { useState, useEffect } from 'react'
import { organizeTasks } from '@/actions/organize'
import { toggleTask, deleteTask, createTask, updateTask, createBatchTasks } from '@/actions/tasks'
import { generateGuide } from '@/actions/guide'
import { 
  Sparkles, Loader2, Clock, CheckCircle2, Circle, Trash2, Zap, X, Plus, Check,
  LayoutGrid, Briefcase, Home, GraduationCap, User, Heart, LogOut, PanelLeftClose, PanelLeftOpen,
  CornerDownRight, Settings, Calendar, Repeat, ChevronDown, Pencil, Save, Layers, CalendarClock, Play
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// --- DADOS E CONSTANTES ---

const MENU_ITEMS = [
  { id: 'all', label: 'Visão Geral', icon: LayoutGrid },
  { id: 'Trabalho', label: 'Trabalho', icon: Briefcase },
  { id: 'Casa', label: 'Casa', icon: Home },
  { id: 'Estudos', label: 'Estudos', icon: GraduationCap },
  { id: 'Pessoal', label: 'Pessoal', icon: User },
  { id: 'Saúde', label: 'Saúde', icon: Heart },
]

// STACKS (ROTINAS PRONTAS)
const ROUTINE_STACKS = [
  {
    title: "🌅 Início do Dia",
    description: "Ative seu cérebro e prepare o terreno.",
    icon: "☀️",
    tasks: [
      { title: "Beber 500ml de água", category: "Saúde", priority: "alta", estimated_time: 2 },
      { title: "Arrurmar a cama", category: "Casa", priority: "media", estimated_time: 5 },
      { title: "Listar 3 metas de hoje", category: "Pessoal", priority: "alta", estimated_time: 5 },
    ]
  },
  {
    title: "🚀 Foco Profundo",
    description: "Bloco de trabalho intenso sem distrações.",
    icon: "🔥",
    tasks: [
      { title: "Esconder o celular", category: "Trabalho", priority: "alta", estimated_time: 2 },
      { title: "Definir tarefa única", category: "Trabalho", priority: "alta", estimated_time: 5 },
      { title: "Trabalhar 50min focado", category: "Trabalho", priority: "alta", estimated_time: 50 },
    ]
  },
  {
    title: "🌙 Descompressão",
    description: "Desligar o sistema para dormir bem.",
    icon: "💤",
    tasks: [
      { title: "Preparar roupa de amanhã", category: "Casa", priority: "media", estimated_time: 10 },
      { title: "Higiene do sono (sem telas)", category: "Saúde", priority: "alta", estimated_time: 30 },
    ]
  }
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
  // --- ESTADOS ---
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<any[]>(initialTasks || [])
  
  // Navegação
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [isTimelineOpen, setIsTimelineOpen] = useState(false) // Nova Timeline
  const [isMobile, setIsMobile] = useState(false)

  // Modais
  const [guideOpen, setGuideOpen] = useState(false)
  const [stackModalOpen, setStackModalOpen] = useState(false) // Novo Modal de Stacks
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [guideLoading, setGuideLoading] = useState(false)
  const [activeTask, setActiveTask] = useState<{id: string, title: string} | null>(null)
  const [addedSuggestions, setAddedSuggestions] = useState<number[]>([])
  const [editingTask, setEditingTask] = useState<any | null>(null)
  
  // Inputs
  const [recurrenceMenuOpen, setRecurrenceMenuOpen] = useState(false)
  const [selectedRecurrence, setSelectedRecurrence] = useState({ label: 'Não repetir', type: null, interval: 0 })
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024 // Tablet/Mobile considera tela menor
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
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
      setInput(''); setSelectedDate('')
    } else {
      alert("Erro: " + result.error)
    }
    setLoading(false)
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

  // --- NOVO: APLICAR STACK (ROTINA) ---
  const handleApplyStack = async (stack: any) => {
    setStackModalOpen(false)
    setLoading(true)
    // Adiciona data de hoje para aparecer na timeline
    const tasksWithDate = stack.tasks.map((t: any) => ({ ...t, due_date: new Date().toISOString() }))
    const result = await createBatchTasks(tasksWithDate)
    if (result.success && result.data) {
      setTasks(prev => [...result.data, ...prev])
    }
    setLoading(false)
  }

  // Filtros
  const categoryTasks = activeCategory === 'all' ? tasks : tasks.filter(t => t.category === activeCategory)
  const rootTasks = categoryTasks.filter(t => !t.parent_id)
  const activeRootTasks = rootTasks.filter(t => t.status !== 'concluido')
  const completedRootTasks = rootTasks.filter(t => t.status === 'concluido')

  const getSubtasks = (parentId: string) => {
    return tasks.filter(t => t.parent_id === parentId).sort((a, b) => {
        if (a.status === 'concluido' && b.status !== 'concluido') return 1
        if (a.status !== 'concluido' && b.status === 'concluido') return -1
        return (PRIORITY_ORDER[a.priority?.toLowerCase()] || 2) - (PRIORITY_ORDER[b.priority?.toLowerCase()] || 2)
    })
  }

  // --- LÓGICA TIMELINE ---
  const timelineTasks = activeRootTasks
    .filter(t => t.due_date) // Só os que tem data
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  return (
    <div className="flex h-screen bg-[#0f1115] overflow-hidden text-slate-200 font-sans selection:bg-indigo-500/30 relative">
      
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* ESQUERDA: SIDEBAR */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="h-full flex flex-col shrink-0 overflow-hidden whitespace-nowrap z-20 border-r border-white/5 bg-[#0f1115]/95 backdrop-blur-xl relative"
      >
        <div className="w-[280px] flex flex-col h-full">
            <div className="p-6 flex justify-between items-center">
              <div className="flex items-center gap-3 pl-2">
                <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                  <Sparkles size={18} className="text-white" fill="currentColor" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">Organize.ia</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-md"><PanelLeftClose size={18} /></button>
            </div>

            <nav className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar">
               {/* Botão de Stacks (NOVO) */}
               <div>
                 <p className="text-[10px] font-bold text-zinc-500 px-4 mb-3 uppercase tracking-widest">Ações Rápidas</p>
                 <button onClick={() => setStackModalOpen(true)} className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/10 transition-all border border-transparent hover:border-indigo-500/30">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:text-indigo-300"><Layers size={16} /></div>
                    <span>Ativar Rotina</span>
                 </button>
               </div>

               {/* Categorias */}
               <div>
                  <p className="text-[10px] font-bold text-zinc-500 px-4 mb-3 uppercase tracking-widest">Categorias</p>
                  <div className="space-y-1">
                    {MENU_ITEMS.map((item) => {
                      const Icon = item.icon
                      const isActive = activeCategory === item.id
                      const count = item.id === 'all' ? tasks.filter(t => t.status !== 'concluido').length : tasks.filter(t => t.category === item.id && t.status !== 'concluido').length
                      return (
                        <button key={item.id} onClick={() => setActiveCategory(item.id)} className={`group w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${isActive ? 'text-white shadow-lg shadow-indigo-500/10' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'}`}>
                          {isActive && <motion.div layoutId="activeTab" className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border-l-2 border-indigo-500" initial={false} />}
                          <div className="flex items-center gap-3 relative z-10 pl-1"><Icon size={18} className={isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'} />{item.label}</div>
                          {count > 0 && <span className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full border ${isActive ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-[#23262f]/50 border-white/5 text-zinc-500'}`}>{count}</span>}
                        </button>
                      )
                    })}
                  </div>
               </div>
            </nav>
            
            <div className="p-4 border-t border-white/5 space-y-1">
               <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group"><LogOut size={18} className="text-zinc-500 group-hover:text-rose-400" /><span>Sair da conta</span></button>
            </div>
        </div>
      </motion.aside>

      {/* CENTRO: MAIN */}
      <motion.main animate={{ marginLeft: 0 }} className="flex-1 h-full overflow-y-auto relative flex flex-col w-full z-10 no-scrollbar">
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="sticky top-0 z-30 w-full bg-[#0f1115]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"><PanelLeftOpen size={20} /></button>
                 <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2"><Sparkles size={18} className="text-indigo-400" /> Organize.ia</h1>
              </div>
              {/* Botão Timeline Header */}
              <button onClick={() => setIsTimelineOpen(!isTimelineOpen)} className={`p-2 rounded-lg transition-all ${isTimelineOpen ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-white'}`}><CalendarClock size={20} /></button>
            </motion.header>
          )}
        </AnimatePresence>

        {/* --- MODAIS --- */}
        
        {/* Modal Edição */}
        <AnimatePresence>
          {editingTask && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setEditingTask(null)}>
               <motion.div onClick={(e) => e.stopPropagation()} className="bg-[#161920] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
                 {/* ... Conteúdo do Form de Edição (Igual ao anterior) ... */}
                 <div className="flex justify-between items-center mb-2"><h3 className="text-lg font-bold text-white">Editar</h3><button onClick={() => setEditingTask(null)}><X size={20} className="text-zinc-500 hover:text-white"/></button></div>
                 <div className="space-y-1"><label className="text-xs text-zinc-500">Título</label><input value={editingTask.title} onChange={(e) => setEditingTask({...editingTask, title: e.target.value})} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-indigo-500 outline-none" /></div>
                 <div className="space-y-1"><label className="text-xs text-zinc-500">Data</label><input type="datetime-local" value={editingTask.due_date ? new Date(editingTask.due_date).toISOString().slice(0, 16) : ''} onChange={(e) => setEditingTask({...editingTask, due_date: e.target.value ? new Date(e.target.value).toISOString() : null})} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none [color-scheme:dark]" /></div>
                 <button onClick={handleSaveEdit} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-2">Salvar</button>
               </motion.div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Stacks (NOVO) */}
        <AnimatePresence>
          {stackModalOpen && (
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
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto w-full p-6 pb-24 space-y-12">
          <div className="flex justify-between items-center mt-4">
             <div><h2 className="text-3xl font-bold text-white tracking-tight">{activeCategory === 'all' ? 'Dashboard' : activeCategory}</h2></div>
             {/* Botão Timeline no Header Desktop */}
             <button onClick={() => setIsTimelineOpen(!isTimelineOpen)} className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isTimelineOpen ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-[#161920] text-zinc-400 border-white/10 hover:border-white/20'}`}>
                <CalendarClock size={18} /> <span>Timeline</span>
             </button>
          </div>

          {/* INPUT */}
          <div className="group relative bg-[#161920]/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl max-w-3xl mx-auto z-10">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} placeholder="O que vamos organizar hoje?" className="w-full h-24 p-4 rounded-xl bg-transparent text-white resize-none outline-none placeholder:text-zinc-600 text-lg font-light" />
            <div className="flex justify-between items-center px-2 pb-2">
              <div className="flex gap-3 items-center">
                 <div className="relative group">
                    <label className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md border cursor-pointer transition-all ${selectedDate ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-black/30 text-zinc-400 border-white/5 hover:bg-white/10'}`}>
                       <Calendar size={12} /> {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) : 'Data'}
                       <input type="date" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" onChange={(e) => setSelectedDate(e.target.value)} />
                    </label>
                 </div>
              </div>
              <button onClick={handleSubmit} disabled={loading || !input.trim()} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg active:scale-95">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Sparkles className="w-4 h-4 text-white" /> Organizar</>}
              </button>
            </div>
          </div>

          {/* GRID KANBAN (Igual ao anterior) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex flex-col gap-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                   <div className="flex items-center gap-2.5"><span className={`w-1.5 h-1.5 rounded-full ${col.color.replace('text', 'bg')}`} /><h3 className={`text-xs font-bold uppercase tracking-widest ${col.color.replace('text-', 'text-opacity-80 text-')}`}>{col.label}</h3></div>
                   <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">{activeRootTasks.filter(t => t.priority === col.id).length}</span>
                </div>
                <div className="flex flex-col gap-3 min-h-[150px]">
                  <AnimatePresence mode="popLayout">
                    {activeRootTasks.filter(t => t.priority === col.id).map((task) => (
                        <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="group p-5 rounded-2xl bg-[#161920]/40 border border-white/5 hover:border-white/10 hover:bg-[#161920]/80 hover:shadow-xl transition-all relative overflow-hidden backdrop-blur-sm">
                           <div className="flex items-start gap-3 relative z-10">
                              <button onClick={() => handleToggle(task.id, task.status)} className="mt-0.5 text-zinc-600 hover:text-emerald-400 transition-colors"><Circle size={20} strokeWidth={1.5} /></button>
                              <div className="flex-1 space-y-3 min-w-0">
                                <div className="flex justify-between items-start gap-3">
                                  <p className="text-sm text-zinc-200 font-medium leading-relaxed break-words flex-1">{task.title}</p>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => handleGuide({id: task.id, title: task.title})} className="text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 p-1.5 rounded-md"><Zap size={14} /></button>
                                    <button onClick={() => setEditingTask(task)} className="text-zinc-600 hover:text-yellow-500 p-1.5"><Pencil size={14} /></button>
                                    <button onClick={() => handleDelete(task.id)} className="text-zinc-600 hover:text-rose-500 p-1.5"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 pt-1 flex-wrap">
                                   <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">{task.category}</span>
                                   <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock size={10} /> {task.estimated_time}m</span>
                                   {formatDate(task.due_date) && <span className="text-[10px] text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/10"><Calendar size={10} /> {formatDate(task.due_date)}</span>}
                                </div>
                              </div>
                           </div>
                        </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.main>

      {/* DIREITA: TIMELINE (NOVA) */}
      <motion.aside
        initial={false}
        animate={{ width: isTimelineOpen ? 320 : 0, opacity: isTimelineOpen ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full flex flex-col shrink-0 overflow-hidden whitespace-nowrap z-20 border-l border-white/5 bg-[#0f1115]/95 backdrop-blur-xl relative"
      >
         <div className="w-[320px] flex flex-col h-full p-6">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-bold text-lg text-white flex items-center gap-2"><CalendarClock className="text-amber-400" size={20}/> Timeline</h3>
               <button onClick={() => setIsTimelineOpen(false)}><X size={20} className="text-zinc-500 hover:text-white"/></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 relative">
               {/* Linha do Tempo Vertical */}
               <div className="absolute left-[19px] top-2 bottom-0 w-[2px] bg-white/5"></div>
               
               {timelineTasks.length > 0 ? timelineTasks.map((task, i) => (
                 <div key={i} className="relative flex gap-4 items-start group">
                    <div className="z-10 w-10 h-10 rounded-full bg-[#1A1D24] border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0 shadow-lg">
                       {new Date(task.due_date).getHours()}h
                    </div>
                    <div className="flex-1 bg-[#1A1D24]/50 p-3 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                       <p className="text-sm font-medium text-zinc-200 line-clamp-2">{task.title}</p>
                       <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-zinc-500">{task.category}</span>
                          <span className={`text-[10px] uppercase font-bold ${task.priority === 'alta' ? 'text-rose-400' : 'text-zinc-600'}`}>{task.priority}</span>
                       </div>
                    </div>
                 </div>
               )) : (
                 <div className="text-center text-zinc-600 mt-10 text-sm">Nenhuma tarefa agendada.</div>
               )}
            </div>
         </div>
      </motion.aside>

    </div>
  )
}
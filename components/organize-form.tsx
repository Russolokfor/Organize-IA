'use client'

import { useState, useEffect } from 'react'
import { organizeTasks } from '@/actions/organize'
import { toggleTask, deleteTask, createTask, updateTask } from '@/actions/tasks'
import { generateGuide } from '@/actions/guide'
import { 
  Sparkles, Loader2, Clock, CheckCircle2, Circle, Trash2, Zap, X, Plus, Check,
  LayoutGrid, Briefcase, Home, GraduationCap, User, Heart, LogOut, PanelLeftClose, PanelLeftOpen,
  CornerDownRight, Settings, Calendar, Repeat, ChevronDown, Pencil, Save
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// --- DADOS ---
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
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [guideOpen, setGuideOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [guideLoading, setGuideLoading] = useState(false)
  const [activeTask, setActiveTask] = useState<{id: string, title: string} | null>(null)
  const [addedSuggestions, setAddedSuggestions] = useState<number[]>([])
  const [recurrenceMenuOpen, setRecurrenceMenuOpen] = useState(false)
  const [selectedRecurrence, setSelectedRecurrence] = useState(RECURRENCE_OPTIONS[0])
  const [selectedDate, setSelectedDate] = useState('')
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar Mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
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

  const categoryTasks = activeCategory === 'all' ? tasks : tasks.filter(t => t.category === activeCategory)
  const rootTasks = categoryTasks.filter(t => !t.parent_id)
  const activeRootTasks = rootTasks.filter(t => t.status !== 'concluido')
  const completedRootTasks = rootTasks.filter(t => t.status === 'concluido')

  const getSubtasks = (parentId: string) => {
    return tasks.filter(t => t.parent_id === parentId).sort((a, b) => {
        if (a.status === 'concluido' && b.status !== 'concluido') return 1
        if (a.status !== 'concluido' && b.status === 'concluido') return -1
        const pA = PRIORITY_ORDER[a.priority?.toLowerCase()] || 99
        const pB = PRIORITY_ORDER[b.priority?.toLowerCase()] || 99
        return pA - pB
    })
  }

  return (
    <div className="flex h-screen bg-[#0f1115] overflow-hidden text-slate-200 font-sans selection:bg-indigo-500/30 relative">
      
      {/* --- SIDEBAR (Desktop Only) --- */}
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
                const isActive = activeCategory === item.id
                return (
                  <button key={item.id} onClick={() => setActiveCategory(item.id)} className={`group w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${isActive ? 'text-white shadow-lg shadow-indigo-500/10' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'}`}>
                    {isActive && <motion.div layoutId="activeTab" className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border-l-2 border-indigo-500" initial={false} />}
                    <div className="flex items-center gap-3 relative z-10 pl-1"><Icon size={18} className={isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'} />{item.label}</div>
                  </button>
                )
              })}
            </nav>
            <div className="p-4 border-t border-white/5 space-y-1"><button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all group pl-4"><Settings size={18} className="text-zinc-500 group-hover:text-zinc-300" /><span>Configurações</span></button><button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group pl-4"><LogOut size={18} className="text-zinc-500 group-hover:text-rose-400 transition-transform" /><span>Sair da conta</span></button></div>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT --- */}
      <motion.main animate={{ marginLeft: 0 }} className="flex-1 h-full overflow-y-auto relative flex flex-col w-full z-10 no-scrollbar">
        
        {/* Header Mobile/Desktop */}
        <header className="sticky top-0 z-30 w-full bg-[#0f1115]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center gap-4">
           {(!isSidebarOpen || isMobile) && <button onClick={() => setSidebarOpen(true)} className="hidden md:block p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"><PanelLeftOpen size={20} /></button>}
           <div className="flex items-center gap-2 md:hidden"><Sparkles size={20} className="text-indigo-400" /><span className="font-bold text-lg">Organize.ia</span></div>
           <div className="ml-auto md:hidden"><button className="p-2 text-zinc-400"><Settings size={20} /></button></div>
        </header>

        {/* MODAIS (Edição e Sugestão) - Código Omitido para brevidade, mantenha o seu bloco de <AnimatePresence> dos modais AQUI igual ao anterior */}
        {/* ... Cole aqui os blocos de Modal de Edição e Sugestão do código anterior ... */}
        {/* Para garantir que funcione, estou recolocando o Modal de Edição aqui: */}
        <AnimatePresence>
          {editingTask && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setEditingTask(null)}>
              <motion.div onClick={(e) => e.stopPropagation()} className="bg-[#161920] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 ring-1 ring-white/5">
                <div className="flex justify-between items-center mb-2"><h3 className="text-lg font-bold text-white">Editar</h3><button onClick={() => setEditingTask(null)}><X size={20} className="text-zinc-500 hover:text-white"/></button></div>
                <div className="space-y-1"><label className="text-xs text-zinc-500">Título</label><input value={editingTask.title} onChange={(e) => setEditingTask({...editingTask, title: e.target.value})} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-indigo-500 outline-none" /></div>
                <button onClick={handleSaveEdit} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-2">Salvar</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
         {/* Fim Modais */}


        <div className="max-w-7xl mx-auto w-full p-4 md:p-6 pb-28 md:pb-24 space-y-8">
          
          <div className="flex justify-between items-end mt-2">
            <div><h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{activeCategory === 'all' ? 'Dashboard' : activeCategory}</h2></div>
          </div>

          {/* INPUT AREA */}
          <div className="group relative bg-[#161920]/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl max-w-3xl mx-auto z-10">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} placeholder="O que vamos organizar hoje?" className="w-full h-24 p-4 rounded-xl bg-transparent text-white resize-none outline-none placeholder:text-zinc-600 text-lg font-light" />
            <div className="flex justify-between items-center px-2 pb-2 flex-wrap gap-2">
              <div className="flex gap-2 items-center overflow-x-auto no-scrollbar w-full md:w-auto">
                 {/* Botões de Configuração do Input */}
                 <button onClick={() => setRecurrenceMenuOpen(!recurrenceMenuOpen)} className="flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-md border border-white/10 bg-black/30 text-zinc-400 hover:bg-white/10 whitespace-nowrap"><Repeat size={12} /> {selectedRecurrence.label}</button>
                 <div className="relative"><label className="flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-md border border-white/10 bg-black/30 text-zinc-400 hover:bg-white/10 cursor-pointer whitespace-nowrap"><Calendar size={12} /> {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) : 'Data'}<input type="date" className="absolute opacity-0 inset-0" onChange={(e) => setSelectedDate(e.target.value)} /></label></div>
              </div>
              <button onClick={handleSubmit} disabled={loading || !input.trim()} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Sparkles className="w-4 h-4" /> Organizar</>}
              </button>
            </div>
          </div>

          {/* GRID KANBAN (Mobile: Carrossel / Desktop: Grid) */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-3 md:gap-8 md:pb-0 no-scrollbar">
            {COLUMNS.map((col) => (
              <div key={col.id} className="min-w-[85vw] snap-center md:min-w-0 flex flex-col gap-4">
                
                {/* Header da Coluna */}
                <div className={`flex items-center justify-between pb-3 border-b border-white/5 px-2 pt-2 rounded-t-xl bg-gradient-to-b ${col.id === 'alta' ? 'from-rose-500/10' : col.id === 'media' ? 'from-amber-500/10' : 'from-emerald-500/10'} to-transparent`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${col.color.replace('text', 'bg')}`} />
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${col.color.replace('text-', 'text-opacity-80 text-')}`}>{col.label}</h3>
                  </div>
                  <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">{activeRootTasks.filter(t => t.priority === col.id).length}</span>
                </div>

                {/* Lista de Cards */}
                <div className="flex flex-col gap-3 min-h-[200px]">
                  <AnimatePresence mode="popLayout">
                    {activeRootTasks.filter(t => t.priority === col.id).map((task) => {
                        const subtasks = getSubtasks(task.id)
                        const dateDisplay = formatDate(task.due_date)
                        return (
                          <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="group p-4 rounded-2xl bg-[#161920]/60 border border-white/5 hover:border-white/10 shadow-sm transition-all relative overflow-hidden">
                            <div className="flex items-start gap-3 relative z-10">
                              <button onClick={() => handleToggle(task.id, task.status)} className="mt-1 text-zinc-600 hover:text-emerald-400 transition-colors shrink-0"><Circle size={20} strokeWidth={1.5} /></button>
                              <div className="flex-1 space-y-3 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <p className="text-sm text-zinc-200 font-medium leading-relaxed break-words">{task.title}</p>
                                  <div className="flex gap-1 shrink-0">
                                     <button onClick={() => handleGuide({id: task.id, title: task.title})} className="text-indigo-400 bg-indigo-500/10 p-1.5 rounded-md"><Zap size={14}/></button>
                                     <button onClick={() => setEditingTask(task)} className="text-zinc-500 hover:text-white p-1.5"><Pencil size={14}/></button>
                                     <button onClick={() => handleDelete(task.id)} className="text-zinc-500 hover:text-rose-500 p-1.5"><Trash2 size={14}/></button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                   <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">{task.category}</span>
                                   {dateDisplay && <span className="text-[10px] text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/10"><Calendar size={10} /> {dateDisplay}</span>}
                                </div>
                                {/* Subtarefas */}
                                {subtasks.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-white/5 space-y-2">
                                    {subtasks.map(sub => (
                                      <div key={sub.id} className="flex items-start gap-2 pl-1">
                                        <CornerDownRight size={12} className="text-zinc-600 shrink-0 mt-1" />
                                        <span className={`text-[9px] px-1 rounded font-bold ${PRIORITY_STYLES[sub.priority?.toLowerCase()] || 'text-zinc-500'}`}>{sub.priority?.slice(0,1)}</span>
                                        <button onClick={() => handleToggle(sub.id, sub.status)} className="flex-1 text-xs text-left text-zinc-400 hover:text-white break-words">{sub.title}</button>
                                        <button onClick={() => handleDelete(sub.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={10}/></button>
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
                   {activeRootTasks.filter(t => t.priority === col.id).length === 0 && <div className="h-24 rounded-xl border border-dashed border-white/5 flex items-center justify-center text-zinc-700 text-xs">Vazio</div>}
                </div>
              </div>
            ))}
          </div>

          {/* CONCLUÍDAS */}
          {completedRootTasks.length > 0 && (
            <div className="border-t border-white/5 pt-8 mt-8 opacity-60">
              <div className="flex items-center gap-2 mb-4 px-1"><CheckCircle2 size={18} className="text-emerald-600" /><h3 className="text-sm font-bold text-zinc-500">Concluídas</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {completedRootTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#0F1115]/40 border border-white/5">
                    <button onClick={() => handleToggle(task.id, task.status)} className="text-emerald-500 shrink-0"><CheckCircle2 size={18} /></button>
                    <p className="text-sm text-zinc-600 line-through truncate flex-1">{task.title}</p>
                    <button onClick={() => handleDelete(task.id)} className="text-zinc-700 hover:text-rose-500"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.main>

      {/* BOTTOM BAR (MOBILE ONLY) */}
      {isMobile && (
         <nav className="fixed bottom-0 left-0 right-0 bg-[#161920]/95 backdrop-blur-xl border-t border-white/10 p-2 flex justify-around z-50 pb-safe">
            {MENU_ITEMS.slice(0, 4).map(item => {
               const Icon = item.icon
               const isActive = activeCategory === item.id
               return (
                  <button key={item.id} onClick={() => setActiveCategory(item.id)} className={`flex flex-col items-center justify-center p-2 rounded-lg w-full transition-colors ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`}>
                    <Icon size={20} />
                    <span className="text-[10px] mt-1">{item.label}</span>
                  </button>
               )
            })}
         </nav>
      )}
    </div>
  )
}
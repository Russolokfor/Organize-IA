'use client'

import { useState, useEffect } from 'react'
import { organizeTasks } from '@/actions/organize'
import { toggleTask, deleteTask, createTask, updateTask } from '@/actions/tasks'
import { generateGuide } from '@/actions/guide'
import { 
  Sparkles, Loader2, Clock, CheckCircle2, Circle, Trash2, Zap, X, Plus, Check,
  LayoutGrid, Briefcase, Home, GraduationCap, User, Heart, LogOut, PanelLeftClose, PanelLeftOpen,
  CornerDownRight, Settings, Calendar, Repeat, ChevronDown, Pencil, Save, Target, Trophy
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// --- CONFIGURAÇÃO VISUAL E DADOS ESTÁTICOS ---

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

// --- FUNÇÕES UTILITÁRIAS ---

const formatDate = (dateString: string) => {
  if (!dateString) return null
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
  }).format(date)
}

// --- COMPONENTE PRINCIPAL ---

export function OrganizeForm({ initialTasks }: { initialTasks: any[] }) {
  // --- ESTADOS GERAIS ---
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<any[]>(initialTasks || [])
  
  // Estados de Navegação (Sidebar e Filtros)
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [isMobile, setIsMobile] = useState(false)
  
  // Estados do Modal de Sugestões (IA)
  const [guideOpen, setGuideOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [guideLoading, setGuideLoading] = useState(false)
  const [activeTask, setActiveTask] = useState<{id: string, title: string} | null>(null)
  const [addedSuggestions, setAddedSuggestions] = useState<number[]>([])
  
  // Estados do Modal de Edição
  const [editingTask, setEditingTask] = useState<any | null>(null)
  
  // Estados dos Inputs Especiais (Recorrência e Data)
  const [recurrenceMenuOpen, setRecurrenceMenuOpen] = useState(false)
  const [selectedRecurrence, setSelectedRecurrence] = useState(RECURRENCE_OPTIONS[0])
  const [selectedDate, setSelectedDate] = useState('')

  // Efeito para detectar Mobile e ajustar layout
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

  // --- HANDLERS (LÓGICA DE NEGÓCIO) ---

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
      setInput('')
      setSelectedRecurrence(RECURRENCE_OPTIONS[0])
      setSelectedDate('')
    } else {
      alert("Erro ao processar: " + result.error)
    }
    setLoading(false)
  }

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'concluido' ? 'pendente' : 'concluido'
    // Atualização Otimista (UI primeiro)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    // Atualização no Banco
    await toggleTask(id, newStatus === 'concluido')
  }

  const handleDelete = async (id: string) => {
    if(confirm("Tem certeza que deseja excluir esta tarefa?")) {
      // Remove tarefa e suas subtarefas visualmente
      setTasks(prev => prev.filter(t => t.id !== id && t.parent_id !== id))
      await deleteTask(id)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingTask) return
    
    // Atualiza na lista local
    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t))
    
    const taskToSave = { ...editingTask }
    setEditingTask(null) // Fecha modal
    
    // Salva no banco
    await updateTask(taskToSave.id, taskToSave)
  }

  const handleGuide = async (task: {id: string, title: string}) => {
    setActiveTask(task)
    setGuideOpen(true)
    setSuggestions([])
    setAddedSuggestions([])
    setGuideLoading(true)
    
    const result = await generateGuide(task.title)
    
    if (result.success && result.suggestions) {
      setSuggestions(result.suggestions)
    }
    setGuideLoading(false)
  }

  const handleAddSuggestion = async (suggestion: any, index: number) => {
    setAddedSuggestions(prev => [...prev, index])
    if (activeTask) {
      const result = await createTask(suggestion, activeTask.id)
      if (result.success && result.data) {
        setTasks(prev => [result.data, ...prev])
      }
    }
  }

  // --- FILTROS DE VISUALIZAÇÃO ---

  const categoryTasks = activeCategory === 'all' ? tasks : tasks.filter(t => t.category === activeCategory)
  const rootTasks = categoryTasks.filter(t => !t.parent_id)
  
  const activeRootTasks = rootTasks.filter(t => t.status !== 'concluido')
  const completedRootTasks = rootTasks.filter(t => t.status === 'concluido')

  const getSubtasks = (parentId: string) => {
    if (!parentId) return []
    return tasks
      .filter(t => t.parent_id === parentId)
      .sort((a, b) => {
        if (a.status === 'concluido' && b.status !== 'concluido') return 1
        if (a.status !== 'concluido' && b.status === 'concluido') return -1
        const pA = PRIORITY_ORDER[a.priority?.toLowerCase()] || 99
        const pB = PRIORITY_ORDER[b.priority?.toLowerCase()] || 99
        return pA - pB
      })
  }

  return (
    <div className="flex h-screen bg-[#0f1115] overflow-hidden text-slate-200 font-sans selection:bg-indigo-500/30 relative">
      
      {/* --- FUNDO ATMOSFÉRICO --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* --- SIDEBAR --- */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen && !isMobile ? 280 : 0, opacity: isSidebarOpen && !isMobile ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex h-full flex-col shrink-0 overflow-hidden whitespace-nowrap z-20 border-r border-white/5 bg-[#0f1115]/60 backdrop-blur-xl relative shadow-2xl"
      >
        <div className="w-[280px] flex flex-col h-full">
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

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
              <p className="text-[10px] font-bold text-zinc-500 px-3 mb-3 uppercase tracking-widest">Workspace</p>
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
            </nav>
            <div className="p-4 border-t border-white/5 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all group">
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
        
        {/* Header */}
        <AnimatePresence>
          {(!isSidebarOpen || isMobile) && (
            <motion.header 
              initial={{ y: -20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              className="sticky top-0 z-30 w-full bg-[#0f1115]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center gap-4"
            >
              {!isMobile && <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"><PanelLeftOpen size={20} /></button>}
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" /> Organize.ia
              </h1>
            </motion.header>
          )}
        </AnimatePresence>

        {/* --- MODAIS --- */}

        {/* Modal Edição */}
        <AnimatePresence>
          {editingTask && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setEditingTask(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()} 
                className="bg-[#161920]/90 backdrop-blur-xl border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 ring-1 ring-white/5"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-white">Editar Tarefa</h3>
                  <button onClick={() => setEditingTask(null)}><X size={20} className="text-zinc-500 hover:text-white"/></button>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Título</label>
                  <input 
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                    className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500">Prioridade</label>
                    <select 
                      value={editingTask.priority}
                      onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                      className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Média</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500">Categoria</label>
                    <select 
                      value={editingTask.category}
                      onChange={(e) => setEditingTask({...editingTask, category: e.target.value})}
                      className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"
                    >
                      <option value="Trabalho">Trabalho</option>
                      <option value="Casa">Casa</option>
                      <option value="Estudos">Estudos</option>
                      <option value="Pessoal">Pessoal</option>
                      <option value="Saúde">Saúde</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Data de Vencimento</label>
                  <input 
                    type="datetime-local"
                    value={editingTask.due_date ? new Date(editingTask.due_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingTask({...editingTask, due_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                    className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none [color-scheme:dark]"
                  />
                </div>

                <button 
                  onClick={handleSaveEdit}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-2 shadow-lg shadow-indigo-500/20"
                >
                  <Save size={18} /> Salvar Alterações
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Sugestões (IA) */}
        <AnimatePresence>
          {guideOpen && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setGuideOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#161920]/90 backdrop-blur-xl border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ring-1 ring-white/5"
              >
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-2 rounded-lg">
                      <Zap size={20} className="text-indigo-400" fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-200">Sugestões</h3>
                      <p className="text-xs text-gray-500 truncate max-w-[250px]">{activeTask?.title}</p>
                    </div>
                  </div>
                  <button onClick={() => setGuideOpen(false)} className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition">
                    <X size={20}/>
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar">
                  {guideLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <Loader2 className="animate-spin text-indigo-500" size={36} />
                      <p className="text-sm text-gray-500 animate-pulse">A IA está pensando...</p>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="space-y-3">
                      {suggestions.map((sug, idx) => {
                        const isAdded = addedSuggestions.includes(idx)
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                              isAdded 
                                ? 'bg-indigo-500/5 border-indigo-500/20' 
                                : 'bg-black/20 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex-1">
                              <h4 className={`font-medium text-sm ${isAdded ? 'text-indigo-400' : 'text-gray-200'}`}>{sug.title}</h4>
                              <div className="flex gap-2 mt-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_STYLES[sug.priority?.toLowerCase()] || 'bg-zinc-800 text-zinc-400'}`}>
                                  {sug.priority}
                                </span>
                                <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500">
                                  {sug.estimated_time}m
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={() => !isAdded && handleAddSuggestion(sug, idx)} 
                              disabled={isAdded} 
                              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                                isAdded 
                                  ? 'bg-indigo-500/20 text-indigo-400 cursor-default' 
                                  : 'bg-white text-black hover:bg-zinc-200'
                              }`}
                            >
                              {isAdded ? <Check size={16}/> : <Plus size={16}/>}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : <div className="text-center py-10 text-gray-500">Nenhuma sugestão encontrada.</div>}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- DASHBOARD --- */}
        <div className="max-w-7xl mx-auto w-full p-4 md:p-6 pb-28 md:pb-24 space-y-8 md:space-y-12">
          
          <div className="flex justify-between items-end mt-4">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {activeCategory === 'all' ? 'Dashboard' : activeCategory}
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Você tem <span className="text-zinc-200 font-medium">{activeRootTasks.length} tarefas</span> principais pendentes.
              </p>
            </div>
          </div>

          {/* INPUT AREA */}
          <div className="group relative bg-[#161920]/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl max-w-3xl mx-auto z-10 transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 focus-within:shadow-[0_0_30px_rgba(99,102,241,0.1)]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="O que vamos organizar hoje?"
              className="w-full h-24 p-4 rounded-xl bg-transparent text-white resize-none outline-none placeholder:text-zinc-600 text-lg font-light"
            />
            <div className="flex justify-between items-center px-2 pb-2">
              <div className="flex gap-3 items-center overflow-x-auto no-scrollbar">
                 {/* IA TAG */}
                 <div className="flex shrink-0 gap-2 items-center bg-black/30 px-2 py-1 rounded-md border border-white/5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                    <span className="text-[10px] text-zinc-400 font-medium tracking-wide">IA ATIVA</span>
                 </div>

                 {/* Recorrência */}
                 <div className="relative shrink-0">
                    <button 
                      onClick={() => setRecurrenceMenuOpen(!recurrenceMenuOpen)} 
                      className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md border transition-all ${
                        selectedRecurrence.type 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                          : 'bg-black/30 text-zinc-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Repeat size={12} /> {selectedRecurrence.label} <ChevronDown size={10} />
                    </button>
                    <AnimatePresence>
                      {recurrenceMenuOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} 
                          className="absolute top-full left-0 mt-2 w-40 bg-[#1A1D24] border border-[#2A2E37] rounded-xl shadow-xl overflow-hidden z-50"
                        >
                          {RECURRENCE_OPTIONS.map((opt) => (
                            <button 
                              key={opt.label} 
                              onClick={() => { setSelectedRecurrence(opt); setRecurrenceMenuOpen(false) }} 
                              className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>

                 {/* Data Manual */}
                 <div className="relative group shrink-0">
                    <label className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md border cursor-pointer transition-all ${
                      selectedDate 
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                        : 'bg-black/30 text-zinc-400 border-white/5 hover:bg-white/10'
                    }`}>
                       <Calendar size={12} /> 
                       {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) : 'Data'}
                       <input 
                         type="date" 
                         className="absolute opacity-0 inset-0 cursor-pointer w-full h-full" 
                         onChange={(e) => setSelectedDate(e.target.value)} 
                       />
                    </label>
                 </div>
              </div>

              <button 
                onClick={handleSubmit} 
                disabled={loading || !input.trim()} 
                className="shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Sparkles className="w-4 h-4 text-white" /> <span className="hidden md:inline">Organizar</span></>}
              </button>
            </div>
          </div>

          {/* GRID KANBAN (Mobile: Carrossel / Desktop: Grid) */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-3 md:gap-8 md:pb-0 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {COLUMNS.map((col) => (
              <div key={col.id} className="min-w-[85vw] snap-center md:min-w-0 flex flex-col gap-5">
                
                {/* Header da Coluna */}
                <div className={`flex items-center justify-between pb-3 border-b border-white/5 px-2 pt-2 rounded-t-xl bg-gradient-to-b ${col.id === 'alta' ? 'from-rose-500/10' : col.id === 'media' ? 'from-amber-500/10' : 'from-emerald-500/10'} to-transparent`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${col.color.replace('text', 'bg')}`} />
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${col.color.replace('text-', 'text-opacity-80 text-')}`}>{col.label}</h3>
                  </div>
                  <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    {activeRootTasks.filter(t => t.priority === col.id).length}
                  </span>
                </div>

                {/* Lista de Cards */}
                <div className="flex flex-col gap-3 min-h-[150px]">
                  <AnimatePresence mode="popLayout">
                    {activeRootTasks
                      .filter(t => t.priority === col.id)
                      .map((task) => {
                        const subtasks = getSubtasks(task.id)
                        const dateDisplay = formatDate(task.due_date)
                        return (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group p-5 rounded-2xl bg-[#161920]/40 border border-white/5 hover:border-white/10 hover:bg-[#161920]/80 hover:shadow-xl transition-all relative overflow-hidden backdrop-blur-sm"
                          >
                            <div className="flex items-start gap-3 relative z-10">
                              <button 
                                onClick={() => handleToggle(task.id, task.status)} 
                                className="mt-0.5 text-zinc-600 hover:text-emerald-400 transition-colors shrink-0"
                              >
                                <Circle size={20} strokeWidth={1.5} />
                              </button>
                              
                              <div className="flex-1 space-y-3 min-w-0">
                                <div className="flex justify-between items-start gap-3">
                                  <p className="text-sm text-zinc-200 font-medium leading-relaxed break-words flex-1">
                                    {task.title}
                                  </p>
                                  
                                  {/* BOTÕES DE AÇÃO */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button 
                                      onClick={() => handleGuide({id: task.id, title: task.title})} 
                                      className="text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 p-1.5 rounded-md transition-colors"
                                      title="Sugerir subtarefas"
                                    >
                                      <Zap size={14} fill="currentColor" />
                                    </button>
                                    <button 
                                      onClick={() => setEditingTask(task)} 
                                      className="text-zinc-600 hover:text-yellow-500 p-1.5 rounded-md hover:bg-yellow-500/10 transition-colors"
                                      title="Editar"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(task.id)} 
                                      className="text-zinc-600 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors"
                                      title="Excluir"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 pt-1 flex-wrap">
                                   <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">{task.category}</span>
                                   <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock size={10} /> {task.estimated_time}m</span>
                                   {dateDisplay && (
                                     <span className="text-[10px] text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/10">
                                       <Calendar size={10} /> {dateDisplay}
                                     </span>
                                   )}
                                </div>

                                {/* SUBTAREFAS */}
                                {subtasks.length > 0 && (
                                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                                    {subtasks.map((sub, idx) => (
                                      <div key={sub.id || `sub-${idx}`} className="flex items-start gap-2 pl-1 group/sub">
                                        <CornerDownRight size={12} className="text-zinc-600 shrink-0 mt-1" />
                                        
                                        <span className={`text-[9px] px-1 rounded uppercase tracking-wider font-bold shrink-0 h-fit mt-0.5 ${PRIORITY_STYLES[sub.priority?.toLowerCase()] || 'text-zinc-500 bg-zinc-800'}`}>
                                          {sub.priority?.slice(0,1)}
                                        </span>

                                        <button 
                                          onClick={() => handleToggle(sub.id, sub.status)} 
                                          className={`flex-1 text-xs text-left leading-tight break-words hover:underline ${sub.status === 'concluido' ? 'text-zinc-600 line-through' : 'text-zinc-400 hover:text-emerald-400'}`}
                                        >
                                          {sub.title}
                                        </button>
                                        
                                        {/* Ações Subtarefa */}
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
                  
                  {activeRootTasks.filter(t => t.priority === col.id).length === 0 && (
                    <div className="h-24 rounded-xl border border-dashed border-white/5 flex items-center justify-center text-zinc-800 text-xs">
                      Vazio
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* --- SESSÃO CONCLUÍDAS --- */}
          <AnimatePresence>
            {completedRootTasks.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-white/5 pt-12 mt-12"
              >
                <div className="flex items-center gap-3 mb-6 px-1 opacity-60 hover:opacity-100 transition-opacity">
                  <h3 className="text-lg font-bold text-zinc-500 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                    Concluídas ({completedRootTasks.length})
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-60 hover:opacity-100 transition-opacity duration-300">
                  <AnimatePresence mode="popLayout">
                    {completedRootTasks.map((task) => (
                      <motion.div 
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-[#0F1115]/40 border border-white/5"
                      >
                        <button onClick={() => handleToggle(task.id, task.status)} className="text-emerald-500 hover:text-yellow-400 shrink-0">
                          <CheckCircle2 size={20} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-600 line-through truncate">{task.title}</p>
                        </div>
                        <button onClick={() => handleDelete(task.id)} className="text-zinc-800 hover:text-rose-500 shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.main>

      {/* BOTTOM BAR MOBILE */}
      {isMobile && (
         <nav className="fixed bottom-0 left-0 right-0 bg-[#161920]/95 backdrop-blur-xl border-t border-white/10 p-2 flex justify-around z-50 pb-safe">
            {MENU_ITEMS.slice(0, 4).map(item => {
               const Icon = item.icon
               const isActive = activeCategory === item.id
               return (
                  <button key={item.id} onClick={() => setActiveCategory(item.id)} className={`flex flex-col items-center justify-center p-2 rounded-lg w-full transition-colors ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`}>
                    <Icon size={20} />
                    <span className="text-[10px] mt-1">{item.label.slice(0, 5)}</span>
                  </button>
               )
            })}
         </nav>
      )}

    </div>
  )
}
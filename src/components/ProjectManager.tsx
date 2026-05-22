import React, { useState, useEffect } from 'react';
import { db, auth, isCloudEnabled } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Plus, Settings2, Trash2, Check, 
  ChevronRight, LayoutGrid, Briefcase, Globe, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Project {
  id: string;
  name: string;
  description?: string;
  brand_color?: string;
  created_at: string;
}

interface ProjectManagerProps {
  onProjectSelect: (project: Project | null) => void;
  activeProjectId?: string;
}

export function ProjectManager({ onProjectSelect, activeProjectId }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#2DD4BF');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    if (isCloudEnabled) {
      try {
        const user = auth.currentUser;
        if (!user) {
          loadLocalProjects();
          return;
        }
        
        const q = query(collection(db, 'projects'), orderBy('created_at', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        
        // Ensure we only show projects created by this user if we add user_id later, 
        // for now we fetch all or we can just fetch normally.
        setProjects(data);
        if (data.length > 0 && !activeProjectId) {
          onProjectSelect(data[0]);
        }
      } catch (err) {
        console.error("Firebase fetch error", err);
        loadLocalProjects();
      }
    } else {
      loadLocalProjects();
    }
  };

  const loadLocalProjects = () => {
    const local = localStorage.getItem('tsv_projects');
    if (local) {
      const parsed = JSON.parse(local);
      setProjects(parsed);
      if (parsed.length > 0 && !activeProjectId) {
        onProjectSelect(parsed[0]);
      }
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setLoading(true);
    const newProject = {
      id: crypto.randomUUID(),
      name: newProjectName,
      brand_color: newProjectColor,
      created_at: new Date().toISOString()
    };

    if (isCloudEnabled) {
      try {
        const docRef = await addDoc(collection(db, 'projects'), newProject);
        const savedProject = { ...newProject, id: docRef.id };
        setProjects([savedProject, ...projects]);
        onProjectSelect(savedProject);
      } catch (err) {
        console.error("Firebase insert error", err);
        saveLocalProject(newProject);
      }
    } else {
      saveLocalProject(newProject);
    }

    setNewProjectName('');
    setIsCreating(false);
    setLoading(false);
  };

  const saveLocalProject = (project: any) => {
    const updated = [project, ...projects];
    setProjects(updated);
    localStorage.setItem('tsv_projects', JSON.stringify(updated));
    onProjectSelect(project);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Workspace Selector</h3>
        <button 
          onClick={() => setIsCreating(true)}
          className="p-1.5 hover:bg-brand-turquoise/10 text-brand-turquoise rounded-lg transition-colors border border-transparent hover:border-brand-turquoise/20"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onProjectSelect(project)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group relative border",
              activeProjectId === project.id 
                ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm" 
                : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
            )}
          >
            <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
                style={{ backgroundColor: activeProjectId === project.id ? project.brand_color : 'rgba(148,163,184,0.1)' }}
            >
              <Building2 size={18} className={activeProjectId === project.id ? "text-white" : "text-slate-400"} />
            </div>
            
            <div className="flex flex-col min-w-0 flex-1">
                <span className={cn(
                    "text-sm font-bold truncate text-left",
                    activeProjectId === project.id ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                )}>
                    {project.name}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-left">
                    Enterprise Workspace
                </span>
            </div>

            {activeProjectId === project.id && (
              <div className="w-2 h-2 rounded-full bg-brand-turquoise shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
            )}
          </button>
        ))}

        {projects.length === 0 && !isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="w-full px-4 py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl hover:border-brand-turquoise/30 hover:bg-brand-turquoise/5 transition-all group"
          >
            <Plus size={24} className="mx-auto text-slate-300 dark:text-slate-700 mb-2 group-hover:text-brand-turquoise" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Crear primer proyecto</p>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-1"
          >
            <form onSubmit={handleCreateProject} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-brand-turquoise" />
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Nueva Empresa</span>
              </div>
              
              <input 
                autoFocus
                type="text"
                placeholder="Nombre de la empresa..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-turquoise/20"
              />
              
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estilo de Marca</span>
                <div className="flex flex-wrap gap-2">
                  {['#2DD4BF', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewProjectColor(c)}
                      className={cn(
                        "w-6 h-6 rounded-lg border-2 transition-all",
                        newProjectColor === c ? "border-slate-800 dark:border-white scale-110 shadow-lg" : "border-transparent opacity-60"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-brand-turquoise text-white py-2.5 rounded-xl text-xs font-black hover:brightness-105 transition-all shadow-lg shadow-brand-turquoise/20"
                >
                  Crear Workspace
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

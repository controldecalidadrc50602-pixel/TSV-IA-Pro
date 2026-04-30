import React, { useState, useEffect } from 'react';
import { supabase, isCloudEnabled } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Plus, Settings2, Trash2, Check, 
  ChevronRight, LayoutGrid, Briefcase, Globe 
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setProjects(data);
        // If there's only one project and none selected, auto-select it
        if (data.length > 0 && !activeProjectId) {
          onProjectSelect(data[0]);
        }
      } else if (error && error.code === 'PGRST116') {
        // Table might not exist yet, fallback to local
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
        const { data, error } = await supabase
          .from('projects')
          .insert([newProject])
          .select()
          .single();
        
        if (!error && data) {
          setProjects([data, ...projects]);
          onProjectSelect(data);
        } else {
          // Fallback if table doesn't exist
          saveLocalProject(newProject);
        }
      } catch (err) {
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
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Compañías / Proyectos</h3>
        <button 
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-brand-turquoise/10 text-brand-turquoise rounded-md transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-1">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onProjectSelect(project)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium group relative",
              activeProjectId === project.id 
                ? "bg-brand-turquoise/10 text-brand-turquoise" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-brand-dark dark:hover:text-white"
            )}
          >
            <Building2 size={18} className={cn(activeProjectId === project.id ? "text-brand-turquoise" : "text-slate-400")} />
            <span className="truncate flex-1 text-left">{project.name}</span>
            {activeProjectId === project.id && (
              <Check size={14} className="text-brand-turquoise" />
            )}
          </button>
        ))}

        {projects.length === 0 && !isCreating && (
          <div className="px-4 py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
            <Briefcase size={24} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Sin proyectos activos</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2"
          >
            <form onSubmit={handleCreateProject} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <input 
                autoFocus
                type="text"
                placeholder="Nombre de la empresa..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-turquoise dark:text-white"
              />
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Color de Marca:</span>
                <div className="flex gap-1.5">
                  {['#2DD4BF', '#6366F1', '#EC4899', '#F59E0B', '#10B981'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewProjectColor(c)}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all",
                        newProjectColor === c ? "border-white scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={newProjectColor}
                    onChange={(e) => setNewProjectColor(e.target.value)}
                    className="w-5 h-5 rounded-full overflow-hidden border-none p-0 bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-brand-turquoise text-white py-2 rounded-lg text-xs font-bold hover:brightness-105 transition-all"
                >
                  Crear
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold"
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

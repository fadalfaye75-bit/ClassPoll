
import React, { useState, useEffect, useRef } from 'react';
import { Resource, User, UserRole, ClassGroup } from '../types';
import { Book, Link as LinkIcon, FileText, Plus, Trash2, ExternalLink, Globe, Search, Users, Filter, Printer, Pencil, MoreVertical } from 'lucide-react';

interface ResourcesProps {
  currentUser: User;
  resources: Resource[];
  classGroups: ClassGroup[];
  onAdd: (resource: Omit<Resource, 'id' | 'createdAt'>) => void;
  onUpdate: (resource: Resource) => void;
  onDelete: (id: string) => void;
}

export const Resources: React.FC<ResourcesProps> = ({ currentUser, resources, classGroups, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'LINK' | 'BOOK' | 'FILE'>('LINK');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [targetClass, setTargetClass] = useState('');

  const canEdit = [UserRole.ADMIN, UserRole.RESPONSABLE].includes(currentUser.role);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper function
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'BOOK': return 'Livre / Manuel';
      case 'FILE': return 'Fichier PDF / Drive';
      default: return 'Site Web';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
        // Update
        const existingRes = resources.find(r => r.id === editingId);
        if (existingRes) {
            onUpdate({
                ...existingRes,
                title,
                type,
                content,
                subject,
                description,
                targetClass: targetClass || undefined
            });
        }
    } else {
        // Create
        onAdd({
          title,
          type,
          content,
          subject,
          description,
          targetClass: targetClass || undefined
        });
    }
    closeForm();
  };

  const handleEdit = (res: Resource) => {
      setEditingId(res.id);
      setTitle(res.title);
      setType(res.type);
      setContent(res.content);
      setSubject(res.subject);
      setDescription(res.description || '');
      setTargetClass(res.targetClass || '');
      setIsFormOpen(true);
      setActiveMenuId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setTitle(''); setContent(''); setSubject(''); setDescription(''); setTargetClass('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette ressource ? Cette action est irréversible.")) {
      onDelete(id);
    }
    setActiveMenuId(null);
  };

  // Extract unique subjects for the filter dropdown
  const uniqueSubjects = Array.from(new Set(resources.map(r => r.subject).filter(Boolean))).sort();

  // Helper to count resources per subject for the dropdown
  const getSubjectCount = (sub: string) => resources.filter(r => r.subject === sub).length;

  const filteredResources = resources.filter(r => {
    const matchesSearch = (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === '' || r.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  const handlePrint = () => {
    window.print();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BOOK': return <Book size={20} className="text-orange-600" />;
      case 'FILE': return <FileText size={20} className="text-red-600" />;
      default: return <Globe size={20} className="text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* --- PRINT ONLY HEADER --- */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold">Liste des Ressources Pédagogiques</h1>
        <p className="text-sm text-gray-500">Généré le {new Date().toLocaleDateString('fr-FR')} par {currentUser.name}</p>
        {selectedSubject && <p className="text-sm font-semibold mt-2">Filtre: {selectedSubject}</p>}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ressources Pédagogiques</h2>
          <p className="text-slate-500">Manuels, liens utiles et documents de cours.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95"
            title="Imprimer ou Enregistrer en PDF"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Imprimer / PDF</span>
          </button>
          
          {canEdit && (
            <button
              onClick={() => { closeForm(); setIsFormOpen(!isFormOpen); }}
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter Bar - HIDDEN ON PRINT */}
      <div className="flex flex-col md:flex-row gap-4 print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher par titre..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white cursor-pointer text-slate-700"
          >
            <option value="">Toutes les matières</option>
            {uniqueSubjects.map(sub => (
              <option key={sub} value={sub}>{sub} ({getSubjectCount(sub)})</option>
            ))}
          </select>
        </div>
      </div>

      {/* FORM - HIDDEN ON PRINT */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg animate-fade-in print:hidden">
          <h3 className="font-semibold text-lg mb-4 text-indigo-700">{editingId ? 'Modifier la ressource' : 'Nouvelle Ressource'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
               <label className="text-sm font-semibold text-slate-700 block mb-1">Cible</label>
               <select 
                  className="w-full border p-2 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
               >
                 {currentUser.role === UserRole.ADMIN && <option value="">🏫 Toute l'école</option>}
                 {classGroups
                   .filter(g => currentUser.role === UserRole.ADMIN || g.name === currentUser.classGroup)
                   .map(group => (
                     <option key={group.id} value={group.name}>🎓 {group.name}</option>
                 ))}
                 {!currentUser.classGroup && currentUser.role !== UserRole.ADMIN && (
                   <option value="" disabled>🚫 Aucune classe assignée à votre compte</option>
                 )}
               </select>
            </div>

            <div className="md:col-span-2 flex gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="resType" value="LINK" checked={type === 'LINK'} onChange={() => setType('LINK')} className="text-indigo-600 focus:ring-indigo-500" />
                 <span className="text-sm font-medium">Site Web</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="resType" value="BOOK" checked={type === 'BOOK'} onChange={() => setType('BOOK')} className="text-indigo-600 focus:ring-indigo-500" />
                 <span className="text-sm font-medium">Livre</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="resType" value="FILE" checked={type === 'FILE'} onChange={() => setType('FILE')} className="text-indigo-600 focus:ring-indigo-500" />
                 <span className="text-sm font-medium">Fichier / PDF</span>
               </label>
            </div>

            <input type="text" required placeholder="Titre de la ressource" className="w-full border p-2 rounded-md" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input type="text" required placeholder="Matière (ex: Maths, Histoire)" className="w-full border p-2 rounded-md" value={subject} onChange={(e) => setSubject(e.target.value)} />
            
            <div className="md:col-span-2">
               <input 
                  type="text" 
                  required 
                  placeholder={type === 'BOOK' ? "Auteur, Édition, ISBN..." : "https://..."} 
                  className="w-full border p-2 rounded-md" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
               />
               {type !== 'BOOK' && <p className="text-xs text-slate-400 mt-1">Collez l'URL complète (http://...)</p>}
            </div>

            <textarea placeholder="Description optionnelle..." className="md:col-span-2 border p-2 rounded-md h-20" value={description} onChange={(e) => setDescription(e.target.value)} />

            <div className="md:col-span-2 flex justify-end space-x-2">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                {editingId ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- SCREEN VIEW (CARDS) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
        {filteredResources.map((res) => {
          // Permission Checks
          const canManage = currentUser.role === UserRole.ADMIN || 
                            (currentUser.role === UserRole.RESPONSABLE && res.targetClass === currentUser.classGroup) || 
                            (res.createdById === currentUser.id);

          return (
            <div key={res.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col relative ${activeMenuId === res.id ? 'z-50' : 'z-0'}`}>
               <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                     <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {getTypeIcon(res.type)}
                     </div>
                     {res.targetClass && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold flex items-center">
                          <Users size={10} className="mr-1" /> {res.targetClass}
                        </span>
                     )}
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-800 line-clamp-2 mb-1">{res.title}</h3>
                  <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">
                    {res.subject}
                  </span>

                  {res.description && (
                    <p className="text-sm text-slate-500 mt-3 line-clamp-3">{res.description}</p>
                  )}
                  
                  {res.type === 'BOOK' && (
                    <div className="mt-4 p-2 bg-orange-50 rounded border border-orange-100 text-sm text-orange-800 flex items-start gap-2">
                       <Book size={16} className="mt-0.5 flex-shrink-0" />
                       <span className="italic">{res.content}</span>
                    </div>
                  )}
               </div>

               <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-between items-center">
                  {res.type !== 'BOOK' ? (
                     <a 
                       href={res.content} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 z-10 relative"
                     >
                       <ExternalLink size={14} /> Accéder
                     </a>
                  ) : (
                     <span className="text-xs text-slate-400 font-medium">{getTypeLabel(res.type)}</span>
                  )}

                  {canManage && (
                    <div className="relative z-20">
                       <button 
                           type="button"
                           onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === res.id ? null : res.id); }}
                           className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                        >
                           <MoreVertical size={20} />
                        </button>

                        {activeMenuId === res.id && (
                           <div ref={menuRef} className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 origin-bottom-right">
                              <button 
                                 onClick={(e) => { e.stopPropagation(); handleEdit(res); }}
                                 className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 first:rounded-t-lg"
                              >
                                 <Pencil size={16} /> Modifier
                              </button>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }}
                                 className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 last:rounded-b-lg border-t border-slate-50"
                              >
                                 <Trash2 size={16} /> Supprimer
                              </button>
                           </div>
                        )}
                    </div>
                  )}
               </div>
            </div>
          );
        })}
        {filteredResources.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl bg-slate-50">
             <div className="mx-auto bg-slate-100 p-3 rounded-full w-fit mb-3">
               <Book size={24} />
             </div>
             <p>Aucune ressource trouvée.</p>
          </div>
        )}
      </div>

      {/* --- PRINT ONLY VIEW (CLEAN TABLE) --- */}
      <div className="hidden print:block">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="border-b-2 border-slate-800">
                  <th className="py-2 text-sm font-bold text-slate-900">Matière</th>
                  <th className="py-2 text-sm font-bold text-slate-900">Titre</th>
                  <th className="py-2 text-sm font-bold text-slate-900">Type</th>
                  <th className="py-2 text-sm font-bold text-slate-900">Cible</th>
                  <th className="py-2 text-sm font-bold text-slate-900">Contenu / Lien</th>
               </tr>
            </thead>
            <tbody>
               {filteredResources.map((res) => (
                  <tr key={res.id} className="border-b border-slate-300">
                     <td className="py-3 text-sm">{res.subject}</td>
                     <td className="py-3 text-sm font-semibold">{res.title}</td>
                     <td className="py-3 text-sm">{getTypeLabel(res.type)}</td>
                     <td className="py-3 text-sm">{res.targetClass || 'Tous'}</td>
                     <td className="py-3 text-xs font-mono break-all">{res.content}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { Announcement, User, UserRole, ClassGroup } from '../types';
import { Video, Trash2, Plus, Clock, AlertCircle, Megaphone, Users, Share2, Copy, Mail, Check, Pencil, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InfoBoardProps {
  currentUser: User;
  announcements: Announcement[];
  classGroups: ClassGroup[];
  onAdd: (announcement: Omit<Announcement, 'id' | 'authorId' | 'authorName'>) => void;
  onUpdate: (announcement: Omit<Announcement, 'authorName'>) => void;
  onDelete: (id: string) => void;
}

export const InfoBoard: React.FC<InfoBoardProps> = ({ currentUser, announcements, classGroups, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newLink, setNewLink] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [targetClass, setTargetClass] = useState('');

  // Share & Menu State
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const canEdit = [UserRole.ADMIN, UserRole.RESPONSABLE].includes(currentUser.role);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setActiveShareId(null);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleShareCopy = (ann: Announcement) => {
    const text = `📢 ${ann.title}\n📝 ${ann.subject}\n📅 ${new Date(ann.date).toLocaleDateString()}\n${ann.meetLink ? `🔗 Meet: ${ann.meetLink}` : ''}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(ann.id);
      setTimeout(() => setCopiedId(null), 2000);
      setActiveShareId(null);
    });
  };

  const handleShareEmail = (ann: Announcement) => {
    const subject = encodeURIComponent(`Annonce: ${ann.title}`);
    const body = encodeURIComponent(`Bonjour,\n\nVoici une annonce importante :\n\n${ann.title}\n${ann.subject}\n\nDate : ${new Date(ann.date).toLocaleDateString()}\n\nCordialement.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setActiveShareId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
        // Update
        const existingAnn = announcements.find(a => a.id === editingId);
        if (existingAnn) {
           onUpdate({
             ...existingAnn,
             title: newTitle,
             subject: newSubject,
             meetLink: newLink || undefined,
             isUrgent,
             date: new Date(newDate),
             targetClass: targetClass || undefined
           });
        }
    } else {
        // Create
        onAdd({
          title: newTitle,
          subject: newSubject,
          meetLink: newLink || undefined,
          isUrgent,
          date: new Date(newDate),
          targetClass: targetClass || undefined
        });
    }
    closeForm();
  };

  const handleEdit = (ann: Announcement) => {
     setEditingId(ann.id);
     setNewTitle(ann.title);
     setNewSubject(ann.subject);
     setNewLink(ann.meetLink || '');
     setIsUrgent(ann.isUrgent);
     // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
     const d = new Date(ann.date);
     const dateString = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
     setNewDate(dateString);
     setTargetClass(ann.targetClass || '');
     setIsFormOpen(true);
     setActiveMenuId(null);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setNewTitle(''); setNewSubject(''); setNewLink(''); setIsUrgent(false); setNewDate(''); setTargetClass('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette annonce ? Cette action est irréversible.")) {
      onDelete(id);
    }
    setActiveMenuId(null);
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Infos & Annonces</h2>
          <p className="text-slate-500">Restez informé des dernières actualités</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { closeForm(); setIsFormOpen(!isFormOpen); }}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nouvelle Annonce</span>
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg animate-fade-in">
           <h3 className="font-semibold text-lg mb-4 text-indigo-700">{editingId ? 'Modifier l\'annonce' : 'Nouvelle Annonce'}</h3>
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

              <input type="text" required placeholder="Titre de l'annonce" className="border p-2 rounded" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <input type="text" required placeholder="Sujet / Matière" className="border p-2 rounded" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
              <input type="text" placeholder="Lien Google Meet (optionnel)" className="border p-2 rounded" value={newLink} onChange={e => setNewLink(e.target.value)} />
              <input type="datetime-local" required className="border p-2 rounded" value={newDate} onChange={e => setNewDate(e.target.value)} />
              
              <div className="md:col-span-2 flex items-center space-x-2">
                <input type="checkbox" id="urgent" className="rounded text-indigo-600 focus:ring-indigo-500" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} />
                <label htmlFor="urgent" className="text-sm text-slate-700">Marquer comme Urgent</label>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                   {editingId ? 'Mettre à jour' : 'Publier'}
                </button>
              </div>
           </form>
        </div>
      )}

      <div className="space-y-4">
        {sortedAnnouncements.map((ann) => {
          const isMeet = !!ann.meetLink;
          const TitleIcon = ann.isUrgent ? AlertCircle : Megaphone;
          
          // Permission Checks
          const isCreator = ann.authorId === currentUser.id;
          const isAdmin = currentUser.role === UserRole.ADMIN;
          const canManage = isAdmin || isCreator || 
                            (currentUser.role === UserRole.RESPONSABLE && ann.targetClass === currentUser.classGroup);

          return (
            <div key={ann.id} className={`bg-white rounded-xl p-5 shadow-sm border ${ann.isUrgent ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200'} transition-all hover:shadow-md relative group ${activeMenuId === ann.id ? 'z-50' : 'z-0'}`}>
               <div className="flex items-start justify-between">
                 <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${ann.isUrgent ? 'bg-orange-100 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                       <TitleIcon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg text-slate-800 break-words">{ann.title}</h3>
                          {isMeet && (
                            <span title="Visioconférence incluse" className="flex items-center">
                              <Video size={20} className="text-green-500" />
                            </span>
                          )}
                          
                          {/* SHARE BUTTON */}
                          <div className="relative inline-block ml-1 z-10">
                             <button 
                               type="button"
                               onClick={(e) => { e.stopPropagation(); setActiveShareId(activeShareId === ann.id ? null : ann.id); }}
                               className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
                               title="Partager"
                             >
                               {copiedId === ann.id ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
                             </button>

                             {activeShareId === ann.id && (
                               <div ref={shareMenuRef} className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2">
                                  <button 
                                    onClick={() => handleShareCopy(ann)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 first:rounded-t-lg"
                                  >
                                    <Copy size={14} /> Copier le contenu
                                  </button>
                                  <button 
                                    onClick={() => handleShareEmail(ann)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 last:rounded-b-lg"
                                  >
                                    <Mail size={14} /> Envoyer par email
                                  </button>
                               </div>
                             )}
                          </div>
                       </div>
                       
                       <div className="flex items-center flex-wrap gap-2 mt-1">
                          <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {ann.subject}
                          </span>
                          {ann.targetClass && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold flex items-center">
                              <Users size={10} className="mr-1" /> {ann.targetClass}
                            </span>
                          )}
                       </div>

                       <div className="flex items-center text-xs text-slate-400 mt-2 space-x-3">
                          <span className="flex items-center">
                            <Clock size={12} className="mr-1" />
                            {format(new Date(ann.date), 'd MMM yyyy à HH:mm', { locale: fr })}
                          </span>
                          <span>•</span>
                          <span>Par {ann.authorName}</span>
                       </div>
                       
                       {ann.meetLink && (
                         <div className="mt-4 flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100">
                            <div className="flex items-center text-green-800 text-sm font-medium">
                               <Video size={16} className="mr-2" />
                               <span>Réunion Google Meet</span>
                            </div>
                            <a 
                              href={ann.meetLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-md hover:bg-green-700 transition-colors shadow-sm"
                            >
                              Rejoindre
                            </a>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* ACTION MENU */}
                 {canManage && (
                   <div className="relative ml-2 z-20">
                      <button 
                         type="button"
                         onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === ann.id ? null : ann.id); }}
                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                       >
                         <MoreVertical size={20} />
                       </button>

                       {activeMenuId === ann.id && (
                         <div ref={actionMenuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleEdit(ann); }}
                             className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 first:rounded-t-lg"
                           >
                             <Pencil size={16} /> Modifier
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDelete(ann.id); }}
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
        {announcements.length === 0 && (
           <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
             <Megaphone size={40} className="mx-auto text-slate-300 mb-3" />
             <p className="text-slate-500">Aucune annonce pour le moment.</p>
           </div>
        )}
      </div>
    </div>
  );
};

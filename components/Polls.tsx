
import React, { useState, useEffect, useRef } from 'react';
import { Poll, User, UserRole, PollOption, ClassGroup } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trash2, Plus, CheckCircle, Lock, Users, X, Edit2, Pencil, RefreshCw, MoreVertical } from 'lucide-react';

interface PollsProps {
  currentUser: User;
  polls: Poll[];
  classGroups: ClassGroup[];
  onAdd: (poll: Omit<Poll, 'id' | 'createdById' | 'createdAt' | 'userVotes'>) => void;
  onUpdate: (poll: Poll) => void;
  onVote: (pollId: string, optionId: string) => void;
  onDelete: (pollId: string) => void;
}

export const Polls: React.FC<PollsProps> = ({ currentUser, polls, classGroups, onAdd, onUpdate, onVote, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
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

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOptionField = () => setOptions([...options, '']);
  
  const removeOptionField = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleEditPoll = (poll: Poll) => {
    setEditingId(poll.id);
    setTitle(poll.title);
    setOptions(poll.options.map(o => o.text));
    setIsAnonymous(poll.isAnonymous);
    setTargetClass(poll.targetClass || '');
    setIsFormOpen(true);
    setActiveMenuId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setTitle('');
    setOptions(['', '']);
    setTargetClass('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
       // Update existing poll
       const existingPoll = polls.find(p => p.id === editingId);
       if (existingPoll) {
         // Map new text options to existing IDs if possible to preserve votes
         const updatedOptions: PollOption[] = options
            .filter(o => o.trim() !== '')
            .map((text, idx) => {
                const existingOpt = existingPoll.options[idx];
                if (existingOpt) {
                    return { ...existingOpt, text }; 
                }
                // New option
                return { id: `opt-${Date.now()}-${idx}`, text, votes: 0 };
            });
         
         onUpdate({
           ...existingPoll,
           title,
           options: updatedOptions,
           isAnonymous,
           targetClass: targetClass || undefined
         });
       }
    } else {
        // Create new
        const formattedOptions: PollOption[] = options
        .filter(o => o.trim() !== '')
        .map((text, idx) => ({ id: `opt-${Date.now()}-${idx}`, text, votes: 0 }));

        onAdd({
          title,
          options: formattedOptions,
          isAnonymous,
          targetClass: targetClass || undefined,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
        });
    }

    closeForm();
  };

  const handleDelete = (id: string) => {
    // Stronger type definition for the button
    if (window.confirm("Voulez-vous vraiment supprimer ce sondage ? Cette action est irréversible et supprimera tous les votes.")) {
      onDelete(id);
    }
    setActiveMenuId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sondages & Quiz</h2>
          <p className="text-slate-500">Participez à la vie de classe</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { closeForm(); setIsFormOpen(!isFormOpen); }}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nouveau Sondage</span>
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg animate-fade-in">
           <h3 className="font-semibold text-lg mb-4 text-indigo-700">{editingId ? 'Modifier le sondage' : 'Nouveau Sondage'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 relative">
             <div>
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

            <input
              type="text"
              required
              placeholder="Question du sondage"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Options de réponse</label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 border p-2 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                  />
                  {options.length > 2 && (
                    <button 
                      type="button" 
                      onClick={() => removeOptionField(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer cette option"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOptionField} className="text-sm text-indigo-600 hover:underline font-medium">+ Ajouter une option</button>
            </div>
            
            <div className="flex items-center gap-2">
               <input type="checkbox" id="anon" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
               <label htmlFor="anon" className="text-sm text-slate-700 cursor-pointer">Vote anonyme</label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={closeForm} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all transform hover:-translate-y-0.5">
                {editingId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.map((poll) => {
          // New Vote Check: Check if current user ID exists in the map
          const hasVoted = poll.userVotes && poll.userVotes[currentUser.id] !== undefined;
          const currentVoteOptionId = poll.userVotes ? poll.userVotes[currentUser.id] : null;
          
          const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
          
          // Permission Checks
          const canManage = currentUser.role === UserRole.ADMIN || 
                            (currentUser.role === UserRole.RESPONSABLE && poll.targetClass === currentUser.classGroup) ||
                            (poll.createdById === currentUser.id);

          return (
            <div key={poll.id} className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow relative ${activeMenuId === poll.id ? 'z-50' : 'z-0'}`}>
               <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-800 leading-tight flex-1 mr-2">{poll.title}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0 relative z-20">
                     {poll.isAnonymous && (
                       <div title="Vote anonyme">
                         <Lock size={16} className="text-slate-400" />
                       </div>
                     )}
                     
                     {/* ACTION MENU */}
                     {canManage && (
                       <div className="relative">
                           <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === poll.id ? null : poll.id); }}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                            >
                              <MoreVertical size={20} />
                            </button>

                            {activeMenuId === poll.id && (
                              <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEditPoll(poll); }}
                                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 first:rounded-t-lg"
                                >
                                  <Pencil size={16} /> Modifier
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(poll.id); }}
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
               {poll.targetClass && (
                 <div className="mb-3">
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold flex items-center w-fit">
                        <Users size={10} className="mr-1" /> {poll.targetClass}
                    </span>
                 </div>
               )}
               
               {/* Voting Interface: Always visible, but styled differently if voted */}
               <div className="space-y-2 flex-1 animate-in fade-in">
                  {poll.options.map((opt) => {
                    const isSelected = currentVoteOptionId === opt.id;
                    const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onVote(poll.id, opt.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col relative overflow-hidden group ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
                         {/* Background Bar for results (visible if voted) */}
                         {hasVoted && (
                            <div 
                              className="absolute left-0 top-0 bottom-0 bg-indigo-100/50 transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                         )}

                         <div className="flex justify-between items-center relative z-10 w-full">
                            <span className={`font-medium ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                              {opt.text}
                            </span>
                            <div className="flex items-center gap-2">
                               {hasVoted && (
                                 <span className="text-xs font-bold text-slate-500">{percentage}%</span>
                               )}
                               {isSelected ? (
                                  <CheckCircle size={20} className="text-indigo-600" />
                               ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-slate-300 group-hover:border-indigo-400"></div>
                               )}
                            </div>
                         </div>
                      </button>
                    );
                  })}
               </div>

               <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span className="font-semibold">{totalVotes} participant{totalVotes > 1 ? 's' : ''}</span>
                  {hasVoted && (
                    <span className="text-indigo-600 font-medium flex items-center">
                       <CheckCircle size={12} className="mr-1" /> Vote enregistré (modifiable)
                    </span>
                  )}
               </div>
            </div>
          );
        })}
        {polls.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl bg-slate-50">
             <div className="mx-auto bg-slate-100 p-3 rounded-full w-fit mb-3">
               <Users size={24} />
             </div>
             <p>Aucun sondage actif pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

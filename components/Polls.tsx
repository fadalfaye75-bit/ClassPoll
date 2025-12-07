import React, { useState } from 'react';
import { Poll, User, UserRole, PollOption, ClassGroup } from '../types';
import { generateQuizQuestion } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, Sparkles, Trash2, Plus, CheckCircle, Lock, Users, X, ArrowDown, ThumbsUp, ThumbsDown, Edit2 } from 'lucide-react';

interface PollsProps {
  currentUser: User;
  polls: Poll[];
  classGroups: ClassGroup[];
  onAdd: (poll: Omit<Poll, 'id' | 'createdById' | 'createdAt' | 'votedUserIds'>) => void;
  onVote: (pollId: string, optionId: string) => void;
  onDelete: (pollId: string) => void;
}

export const Polls: React.FC<PollsProps> = ({ currentUser, polls, classGroups, onAdd, onVote, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [targetClass, setTargetClass] = useState('');
  
  // AI State
  const [aiTopic, setAiTopic] = useState('');
  const [aiProposal, setAiProposal] = useState<{ question: string; options: string[] } | null>(null);

  // Voting State
  const [editingVotes, setEditingVotes] = useState<string[]>([]); // Array of poll IDs where user wants to change vote

  const canEdit = [UserRole.ADMIN, UserRole.RESPONSABLE].includes(currentUser.role);

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

  const handleAiGenerate = async () => {
    if (!aiTopic) return;
    setIsGenerating(true);
    setAiProposal(null);
    
    const result = await generateQuizQuestion(aiTopic, 'High School');
    
    if (result) {
      setAiProposal(result);
    }
    setIsGenerating(false);
  };

  const applyAiProposal = () => {
    if (aiProposal) {
      setTitle(aiProposal.question);
      setOptions(aiProposal.options);
      setAiProposal(null);
      setAiTopic('');
    }
  };

  const discardAiProposal = () => {
    setAiProposal(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    setIsFormOpen(false);
    setTitle('');
    setOptions(['', '']);
    setAiTopic('');
    setAiProposal(null);
    setTargetClass('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce sondage ? Cette action est irréversible et supprimera tous les votes.")) {
      onDelete(id);
    }
  };

  const toggleVoteEdit = (pollId: string) => {
    if (editingVotes.includes(pollId)) {
      setEditingVotes(editingVotes.filter(id => id !== pollId));
    } else {
      setEditingVotes([...editingVotes, pollId]);
    }
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
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nouveau Sondage</span>
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg animate-fade-in">
          {/* AI Generator Section */}
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
               <Sparkles size={64} />
            </div>
            <h4 className="flex items-center text-sm font-bold text-indigo-800 mb-2 relative z-10">
              <Sparkles size={16} className="mr-2 text-indigo-500" /> Assistant Gemini AI
            </h4>
            <div className="flex gap-2 mb-2 relative z-10">
              <input 
                type="text" 
                placeholder="Sujet (ex: Géographie, Mathématiques)" 
                className="flex-1 border p-2 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
              <button 
                type="button" 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiTopic}
                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center shadow-sm"
              >
                {isGenerating ? <Loader2 className="animate-spin h-4 w-4" /> : 'Générer'}
              </button>
            </div>

            {/* AI Proposal Preview */}
            {aiProposal && (
              <div className="mt-4 bg-white p-4 rounded-lg border border-indigo-200 shadow-sm animate-in fade-in slide-in-from-top-2 relative z-10">
                <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Proposition de l'Assistant :</h5>
                <div className="mb-3">
                  <p className="font-semibold text-slate-800 text-sm mb-2">{aiProposal.question}</p>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                    {aiProposal.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={applyAiProposal}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    <ThumbsUp size={14} /> Valider & Utiliser
                  </button>
                  <button 
                    type="button" 
                    onClick={discardAiProposal}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    <ThumbsDown size={14} /> Ignorer
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative">
             {/* Visual Connector if AI filled it */}
             {title && !aiProposal && !aiTopic && (
               <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-emerald-500 animate-bounce">
                 <ArrowDown size={20} />
               </div>
             )}

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
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all transform hover:-translate-y-0.5">Créer</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.map((poll) => {
          const hasVoted = poll.votedUserIds.includes(currentUser.id);
          const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
          const isEditing = editingVotes.includes(poll.id);
          
          // Permission Checks
          const canDelete = currentUser.role === UserRole.ADMIN || 
                            (currentUser.role === UserRole.RESPONSABLE && poll.targetClass === currentUser.classGroup) ||
                            (poll.createdById === currentUser.id);

          // Voting logic: Responsable IS A STUDENT, so they should be allowed to vote
          // If editing, allow voting even if hasVoted
          const showVotingUI = (!hasVoted || isEditing) && (currentUser.role === UserRole.ELEVE || currentUser.role === UserRole.RESPONSABLE);

          // User's current vote (to highlight)
          // We need to find which option ID maps to this user. 
          // Note: In a real app we would have a proper mapping in `poll.userVotes`. 
          // With current simplified `votedUserIds` we rely on `userVotes` passed from App.tsx via polls prop if updated.
          // Since we didn't update the Poll interface in this file fully, we assume we just handle the view switch.

          return (
            <div key={poll.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-800 leading-tight">{poll.title}</h3>
                  {poll.isAnonymous && (
                    <div title="Vote anonyme">
                      <Lock size={16} className="text-slate-400" />
                    </div>
                  )}
               </div>
               {poll.targetClass && (
                 <div className="mb-3">
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold flex items-center w-fit">
                        <Users size={10} className="mr-1" /> {poll.targetClass}
                    </span>
                 </div>
               )}
               
               {/* Voting View */}
               {showVotingUI ? (
                 <div className="space-y-2 flex-1 animate-in fade-in">
                    {poll.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onVote(poll.id, opt.id);
                          // If was editing, exit edit mode
                          if (isEditing) toggleVoteEdit(poll.id);
                        }}
                        className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors flex justify-between items-center group"
                      >
                        <span className="text-slate-700 font-medium">{opt.text}</span>
                        <div className="h-5 w-5 rounded-full border-2 border-slate-300 group-hover:border-indigo-500"></div>
                      </button>
                    ))}
                    {isEditing && (
                       <button onClick={() => toggleVoteEdit(poll.id)} className="text-xs text-slate-400 hover:text-slate-600 mt-2 underline">Annuler la modification</button>
                    )}
                 </div>
               ) : (
                 // Results View
                 <div className="flex-1 animate-in fade-in">
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={poll.options} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="text" width={100} tick={{fontSize: 12}} />
                          <Tooltip cursor={{fill: '#f1f5f9'}} />
                          <Bar dataKey="votes" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                            {poll.options.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#4f46e5', '#818cf8', '#6366f1'][index % 3]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-green-600 font-bold flex items-center">
                         <CheckCircle size={12} className="mr-1" /> A voté
                       </p>
                       <button 
                         onClick={() => toggleVoteEdit(poll.id)} 
                         className="flex items-center text-xs text-indigo-600 hover:underline font-medium"
                       >
                         <Edit2 size={10} className="mr-1" /> Modifier mon choix
                       </button>
                    </div>
                 </div>
               )}

               <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span className="font-semibold">{totalVotes} participant{totalVotes > 1 ? 's' : ''}</span>
                  {canDelete && (
                    <button 
                      onClick={() => handleDelete(poll.id)} 
                      className="text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors hover:bg-red-50 p-1 rounded"
                    >
                       <Trash2 size={12} /> Supprimer
                    </button>
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
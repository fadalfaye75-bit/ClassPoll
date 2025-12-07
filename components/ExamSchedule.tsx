
import React, { useState, useEffect, useRef } from 'react';
import { Exam, User, UserRole, ClassGroup } from '../types';
import { Calendar as CalendarIcon, Clock, MapPin, FileText, Plus, Trash2, AlertTriangle, Users, Pencil, MoreVertical } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExamScheduleProps {
  currentUser: User;
  exams: Exam[];
  classGroups: ClassGroup[];
  onAdd: (exam: Omit<Exam, 'id' | 'createdById'>) => void;
  onUpdate: (exam: Exam) => void;
  onDelete: (id: string) => void;
}

export const ExamSchedule: React.FC<ExamScheduleProps> = ({ currentUser, exams, classGroups, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
       // Update existing
       const existingExam = exams.find(e => e.id === editingId);
       if (existingExam) {
         onUpdate({
           ...existingExam,
           subject,
           date: new Date(date),
           startTime,
           durationMinutes: Number(duration),
           room,
           notes: notes || undefined,
           targetClass: targetClass || undefined
         });
       }
    } else {
       // Create new
       onAdd({
         subject,
         date: new Date(date),
         startTime,
         durationMinutes: Number(duration),
         room,
         notes: notes || undefined,
         targetClass: targetClass || undefined
       });
    }
    closeForm();
  };

  const handleEdit = (exam: Exam) => {
    setEditingId(exam.id);
    setSubject(exam.subject);
    setDate(new Date(exam.date).toISOString().split('T')[0]);
    setStartTime(exam.startTime);
    setDuration(exam.durationMinutes);
    setRoom(exam.room);
    setNotes(exam.notes || '');
    setTargetClass(exam.targetClass || '');
    setIsFormOpen(true);
    setActiveMenuId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setSubject(''); setDate(''); setStartTime(''); setDuration(60); setRoom(''); setNotes(''); setTargetClass('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet examen ? Cette action est irréversible.")) {
      onDelete(id);
    }
    setActiveMenuId(null);
  };

  const sortedExams = [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Devoirs Surveillés (DS)</h2>
          <p className="text-slate-500">Calendrier des examens et évaluations</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { closeForm(); setIsFormOpen(!isFormOpen); }}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Planifier un DS</span>
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg animate-fade-in">
           <h3 className="font-semibold text-lg mb-4 text-indigo-700">{editingId ? 'Modifier l\'examen' : 'Planifier un nouvel examen'}</h3>
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
               <label className="text-sm font-semibold text-slate-700 block mb-1">Classe concernée</label>
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

            <input type="text" required placeholder="Matière (ex: Mathématiques)" className="border p-2 rounded" value={subject} onChange={e => setSubject(e.target.value)} />
            <input type="date" required className="border p-2 rounded" value={date} onChange={e => setDate(e.target.value)} />
            <div className="flex space-x-2">
              <input type="time" required className="border p-2 rounded flex-1" value={startTime} onChange={e => setStartTime(e.target.value)} />
              <input type="number" required placeholder="Durée (min)" className="border p-2 rounded w-24" value={duration} onChange={e => setDuration(Number(e.target.value))} />
            </div>
            <input type="text" required placeholder="Salle (ex: B12)" className="border p-2 rounded" value={room} onChange={e => setRoom(e.target.value)} />
            <textarea placeholder="Notes supplémentaires (chapitres à réviser, matériel...)" className="border p-2 rounded md:col-span-2" value={notes} onChange={e => setNotes(e.target.value)} />
            
            <div className="md:col-span-2 flex justify-end space-x-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  {editingId ? 'Mettre à jour' : 'Planifier'}
                </button>
            </div>
           </form>
        </div>
      )}

      <div className="space-y-4">
        {sortedExams.map((exam) => {
          const daysLeft = differenceInDays(new Date(exam.date), new Date());
          const isUrgent = daysLeft >= 0 && daysLeft <= 3;
          
          // Permission Checks
          const isCreator = exam.createdById === currentUser.id;
          const isAdmin = currentUser.role === UserRole.ADMIN;
          const canManage = isAdmin || isCreator || 
                            (currentUser.role === UserRole.RESPONSABLE && exam.targetClass === currentUser.classGroup);

          return (
            <div key={exam.id} className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between hover:shadow-md transition-shadow relative group ${activeMenuId === exam.id ? 'z-50' : 'z-0'}`}>
              <div className="flex items-start space-x-4 mb-4 md:mb-0 flex-1">
                <div className={`flex flex-col items-center justify-center p-3 rounded-xl min-w-[70px] ${isUrgent ? 'bg-orange-100 text-orange-700' : 'bg-indigo-50 text-indigo-700'}`}>
                  <span className="text-xl font-bold">{format(new Date(exam.date), 'dd')}</span>
                  <span className="text-xs uppercase font-bold">{format(new Date(exam.date), 'MMM', { locale: fr })}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                     <h3 className="font-bold text-lg text-slate-800">{exam.subject}</h3>
                     {isUrgent && (
                       <span className="flex items-center text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                         <AlertTriangle size={10} className="mr-1" /> Bientôt
                       </span>
                     )}
                     {exam.targetClass && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold flex items-center">
                          <Users size={10} className="mr-1" /> {exam.targetClass}
                        </span>
                     )}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1.5" />
                      {exam.startTime} ({exam.durationMinutes} min)
                    </div>
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-1.5" />
                      Salle {exam.room}
                    </div>
                  </div>
                  
                  {exam.notes && (
                    <div className="mt-2 flex items-start text-xs text-slate-500 bg-slate-50 p-2 rounded">
                      <FileText size={12} className="mr-1.5 mt-0.5 flex-shrink-0" />
                      <p>{exam.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {canManage && (
                <div className="relative ml-2 z-20">
                    <button 
                       type="button"
                       onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === exam.id ? null : exam.id); }}
                       className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                     >
                       <MoreVertical size={20} />
                     </button>

                     {activeMenuId === exam.id && (
                       <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleEdit(exam); }}
                           className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 first:rounded-t-lg"
                         >
                           <Pencil size={16} /> Modifier
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleDelete(exam.id); }}
                           className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 last:rounded-b-lg border-t border-slate-50"
                         >
                           <Trash2 size={16} /> Supprimer
                         </button>
                       </div>
                     )}
                </div>
              )}
            </div>
          );
        })}
        {exams.length === 0 && (
           <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
             <CalendarIcon size={40} className="mx-auto text-slate-300 mb-3" />
             <p className="text-slate-500">Aucun examen planifié.</p>
           </div>
        )}
      </div>
    </div>
  );
};

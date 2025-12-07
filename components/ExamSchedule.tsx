import React, { useState } from 'react';
import { Exam, User, UserRole, ClassGroup } from '../types';
import { Calendar as CalendarIcon, Clock, MapPin, FileText, Plus, Trash2, AlertTriangle, Users } from 'lucide-react';
import { format, isBefore, addDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExamScheduleProps {
  currentUser: User;
  exams: Exam[];
  classGroups: ClassGroup[];
  onAdd: (exam: Omit<Exam, 'id' | 'createdById'>) => void;
  onDelete: (id: string) => void;
}

export const ExamSchedule: React.FC<ExamScheduleProps> = ({ currentUser, exams, classGroups, onAdd, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');
  const [targetClass, setTargetClass] = useState('');

  const canEdit = [UserRole.ADMIN, UserRole.RESPONSABLE].includes(currentUser.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      subject,
      date: new Date(date),
      startTime,
      durationMinutes: Number(duration),
      room,
      notes: notes || undefined,
      targetClass: targetClass || undefined
    });
    setIsFormOpen(false);
    // Reset form
    setSubject(''); setDate(''); setStartTime(''); setDuration(60); setRoom(''); setNotes(''); setTargetClass('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet examen ? Cette action est irréversible.")) {
      onDelete(id);
    }
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
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Planifier un DS</span>
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg animate-fade-in">
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
               <label className="text-sm font-semibold text-slate-700 block mb-1">Classe concernée</label>
               <select 
                  className="w-full border p-2 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
               >
                 {currentUser.role === UserRole.ADMIN && <option value="">🏫 Toute l'école (Exam Commun)</option>}
                 {classGroups
                   .filter(g => currentUser.role === UserRole.ADMIN || g.name === currentUser.classGroup)
                   .map(group => (
                     <option key={group.id} value={group.name}>🎓 {group.name}</option>
                 ))}
               </select>
            </div>

            <input type="text" required placeholder="Matière" className="border p-2 rounded" value={subject} onChange={e => setSubject(e.target.value)} />
            <input type="date" required className="border p-2 rounded" value={date} onChange={e => setDate(e.target.value)} />
            <div className="flex gap-2">
              <input type="time" required className="border p-2 rounded flex-1" value={startTime} onChange={e => setStartTime(e.target.value)} />
              <input type="number" required placeholder="Durée (min)" className="border p-2 rounded w-24" value={duration} onChange={e => setDuration(Number(e.target.value))} />
            </div>
            <input type="text" required placeholder="Salle" className="border p-2 rounded" value={room} onChange={e => setRoom(e.target.value)} />
            <textarea placeholder="Notes (matériel autorisé, etc.)" className="md:col-span-2 border p-2 rounded h-20" value={notes} onChange={e => setNotes(e.target.value)} />
            
            <div className="md:col-span-2 flex justify-end space-x-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Enregistrer</button>
            </div>
           </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedExams.map((exam) => {
          const daysLeft = differenceInDays(new Date(exam.date), new Date());
          const isUrgent = daysLeft >= 0 && daysLeft <= 7;
          
          // Permission Checks
          const canDelete = currentUser.role === UserRole.ADMIN || 
                            (currentUser.role === UserRole.RESPONSABLE && exam.targetClass === currentUser.classGroup) ||
                            (exam.createdById === currentUser.id);

          return (
            <div 
              key={exam.id}
              className={`bg-white rounded-xl p-5 shadow-sm border relative overflow-hidden group hover:shadow-md transition-all ${isUrgent ? 'border-orange-200' : 'border-slate-200'}`}
            >
              {isUrgent && (
                <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 px-3 py-1 rounded-bl-lg text-xs font-bold flex items-center">
                   <AlertTriangle size={12} className="mr-1" /> J-{daysLeft}
                </div>
              )}
              
              <div className="flex items-center mb-3">
                 <div className={`p-2 rounded-lg mr-3 ${isUrgent ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <FileText size={20} />
                 </div>
                 <div>
                   <h3 className="font-bold text-lg text-slate-800">{exam.subject}</h3>
                   {exam.targetClass && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold flex items-center w-fit mt-1">
                        <Users size={10} className="mr-1" /> {exam.targetClass}
                      </span>
                   )}
                 </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center">
                  <CalendarIcon size={14} className="mr-2 text-slate-400" />
                  {format(new Date(exam.date), 'eeee d MMMM yyyy', { locale: fr })}
                </div>
                <div className="flex items-center">
                  <Clock size={14} className="mr-2 text-slate-400" />
                  {exam.startTime} ({exam.durationMinutes} min)
                </div>
                <div className="flex items-center">
                  <MapPin size={14} className="mr-2 text-slate-400" />
                  Salle {exam.room}
                </div>
                {exam.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs italic text-slate-500 bg-slate-50 p-2 rounded">
                    "{exam.notes}"
                  </div>
                )}
              </div>

              {canDelete && (
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={() => handleDelete(exam.id)} 
                     className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 hover:text-red-700 transition-colors shadow-sm"
                     title="Supprimer"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              )}
            </div>
          );
        })}
        {sortedExams.length === 0 && (
           <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
             <CalendarIcon size={40} className="mx-auto text-slate-300 mb-3" />
             <p className="text-slate-500">Aucun examen programmé.</p>
           </div>
        )}
      </div>
    </div>
  );
};
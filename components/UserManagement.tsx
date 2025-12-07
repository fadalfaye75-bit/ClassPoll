
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, ClassGroup } from '../types';
import { Trash2, UserPlus, Shield, GraduationCap, User as UserIcon, Pencil, RotateCcw, Filter, MoreVertical } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  classGroups: ClassGroup[];
  onAdd: (user: User) => void;
  onUpdate: (user: User) => void;
  onDelete: (id: string) => void;
  onResetPassword: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, classGroups, onAdd, onUpdate, onDelete, onResetPassword }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('passer25');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.ELEVE);
  const [newClassGroup, setNewClassGroup] = useState('');

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

    // Validation: Require class for Student and Responsable
    if (newRole !== UserRole.ADMIN && !newClassGroup) {
      alert("Veuillez assigner une classe pour ce rôle.");
      return;
    }

    if (editingId) {
      onUpdate({
        id: editingId,
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        classGroup: newClassGroup || undefined
      });
    } else {
      onAdd({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        classGroup: newClassGroup || undefined
      });
    }
    closeForm();
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setNewName(user.name);
    setNewEmail(user.email);
    setNewPassword(user.password || '');
    setNewRole(user.role);
    setNewClassGroup(user.classGroup || '');
    setIsFormOpen(true);
    setActiveMenuId(null);
    // Scroll to form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setNewName(''); 
    setNewEmail(''); 
    setNewPassword('passer25');
    setNewRole(UserRole.ELEVE);
    setNewClassGroup('');
  };

  const handleResetPassword = (user: User) => {
    if (window.confirm(`Voulez-vous vraiment réinitialiser le mot de passe de "${user.name}" à "passer25" ?`)) {
      onResetPassword(user.id);
    }
    setActiveMenuId(null);
  };

  const handleDelete = (user: User) => {
    if (window.confirm(`ATTENTION : Vous êtes sur le point de supprimer définitivement le compte de "${user.name}".\n\nCette action est irréversible.`)) {
      onDelete(user.id);
    }
    setActiveMenuId(null);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <Shield size={16} className="text-red-500" />;
      case UserRole.RESPONSABLE: return <GraduationCap size={16} className="text-indigo-500" />;
      default: return <UserIcon size={16} className="text-blue-500" />;
    }
  };

  // Filter Logic
  const filteredUsers = users.filter(user => {
    if (selectedClassFilter === 'ALL') return true;
    if (selectedClassFilter === 'NO_CLASS') return !user.classGroup && user.role !== UserRole.ADMIN;
    if (selectedClassFilter === 'ADMIN') return user.role === UserRole.ADMIN;
    return user.classGroup === selectedClassFilter;
  });

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Utilisateurs</h2>
          <p className="text-slate-500 text-sm">Désignez les Responsables et les Élèves par classe.</p>
        </div>
        <button
          onClick={() => { closeForm(); setIsFormOpen(!isFormOpen); }}
          className="w-full md:w-auto flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <UserPlus size={18} />
          <span>{isFormOpen ? 'Fermer' : 'Ajouter un utilisateur'}</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-indigo-100 p-2 rounded-full">
               <UserPlus size={20} className="text-indigo-600" />
            </div>
            <h3 className="font-semibold text-lg text-slate-800">
              {editingId ? 'Modifier l\'utilisateur' : 'Créer un nouveau compte'}
            </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col space-y-1">
               <label className="text-xs font-semibold text-slate-500">Nom complet</label>
               <input required type="text" className="border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jean Dupont" />
            </div>
            <div className="flex flex-col space-y-1">
               <label className="text-xs font-semibold text-slate-500">Email (Identifiant)</label>
               <input required type="email" className="border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@ecole.com" />
            </div>
            <div className="flex flex-col space-y-1">
               <label className="text-xs font-semibold text-slate-500">Mot de passe</label>
               <input required type="text" className="border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Définir mot de passe" />
            </div>
            
            <div className="flex flex-col space-y-1">
               <label className="text-xs font-semibold text-slate-500">Rôle</label>
               <select className="border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}>
                 <option value={UserRole.ELEVE}>Élève</option>
                 <option value={UserRole.RESPONSABLE}>Responsable (Prof/Superviseur)</option>
                 <option value={UserRole.ADMIN}>Admin</option>
               </select>
            </div>
            
            {/* Class selection is MANDATORY for NON-ADMINs */}
            <div className={`flex flex-col space-y-1 ${newRole === UserRole.ADMIN ? 'opacity-50 pointer-events-none' : ''}`}>
                 <label className="text-xs font-semibold text-slate-500 flex items-center">
                    Classe {newRole !== UserRole.ADMIN && <span className="text-red-500 ml-1">*</span>}
                 </label>
                 <select 
                    className={`border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${newRole !== UserRole.ADMIN && !newClassGroup ? 'border-orange-300 bg-orange-50' : ''}`}
                    value={newClassGroup}
                    onChange={(e) => setNewClassGroup(e.target.value)}
                    required={newRole !== UserRole.ADMIN}
                  >
                    <option value="">-- Sélectionner une classe --</option>
                    {classGroups.map(group => (
                      <option key={group.id} value={group.name}>{group.name}</option>
                    ))}
                 </select>
            </div>
            
            <div className="flex space-x-2 pt-2 md:pt-0 lg:col-span-1 lg:justify-end w-full">
               <button type="button" onClick={closeForm} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm">
                   Annuler
               </button>
               <button type="submit" className="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                 {editingId ? 'Mettre à jour' : 'Enregistrer'}
               </button>
            </div>
          </form>
        </div>
      )}
      
      {/* FILTER BAR */}
      <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg overflow-x-auto">
        <Filter size={18} className="text-slate-500 ml-2" />
        <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filtrer par :</span>
        
        <button 
          onClick={() => setSelectedClassFilter('ALL')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${selectedClassFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Tous
        </button>
        <button 
          onClick={() => setSelectedClassFilter('ADMIN')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${selectedClassFilter === 'ADMIN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Admins
        </button>
        {classGroups.map(group => (
          <button
            key={group.id}
            onClick={() => setSelectedClassFilter(group.name)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${selectedClassFilter === group.name ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {group.name}
          </button>
        ))}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Utilisateur</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Classe</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Rôle</th>
              <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">Aucun utilisateur trouvé pour ce filtre.</td>
                </tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {user.name.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-800">{user.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-600">{user.email}</td>
                <td className="p-4 text-sm text-slate-600">
                   {user.classGroup ? (
                     <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold border border-indigo-100">{user.classGroup}</span>
                   ) : '-'}
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    {getRoleIcon(user.role)}
                    <span className="capitalize">{user.role.toLowerCase()}</span>
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="relative">
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === user.id ? null : user.id); }}
                        className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenuId === user.id && (
                        <div ref={menuRef} className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                           <button 
                            onClick={(e) => { e.stopPropagation(); handleResetPassword(user); }}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 first:rounded-t-lg"
                           >
                            <RotateCcw size={16} /> Reset Pass
                           </button>
                           <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(user); }}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                           >
                            <Pencil size={16} /> Modifier
                           </button>
                           <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(user); }}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 last:rounded-b-lg border-t border-slate-50"
                           >
                            <Trash2 size={16} /> Supprimer
                           </button>
                        </div>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MOBILE CARD VIEW --- */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative ${activeMenuId === user.id ? 'z-50' : 'z-0'}`}>
            <div className="flex justify-between items-start mb-3">
               <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{user.name}</h4>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                       {getRoleIcon(user.role)} {user.role.toLowerCase()}
                    </span>
                  </div>
               </div>
               
               <div className="relative">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === user.id ? null : user.id); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>

                  {activeMenuId === user.id && (
                    <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleResetPassword(user); }}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 first:rounded-t-lg"
                       >
                        <RotateCcw size={16} /> Reset Pass
                       </button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(user); }}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                       >
                        <Pencil size={16} /> Modifier
                       </button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(user); }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 last:rounded-b-lg border-t border-slate-50"
                       >
                        <Trash2 size={16} /> Supprimer
                       </button>
                    </div>
                  )}
               </div>
            </div>
            
            <div className="space-y-2 text-sm text-slate-600">
               <div className="flex items-center gap-2">
                 <UserIcon size={14} className="text-slate-400" />
                 <span className="truncate">{user.email}</span>
               </div>
               {user.classGroup && (
                 <div className="flex items-center gap-2">
                   <GraduationCap size={14} className="text-slate-400" />
                   <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold border border-indigo-100">{user.classGroup}</span>
                 </div>
               )}
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-slate-400">Aucun utilisateur.</div>
        )}
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { SchoolSettings, ClassGroup } from '../types';
import { Building, Plus, Trash2, Save, Users, Settings as SettingsIcon, ArrowRight } from 'lucide-react';

interface SettingsProps {
  settings: SchoolSettings;
  classGroups: ClassGroup[];
  onUpdateSettings: (settings: SchoolSettings) => void;
  onAddClass: (name: string) => void;
  onDeleteClass: (id: string) => void;
  onNavigateToUsers?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  classGroups, 
  onUpdateSettings, 
  onAddClass, 
  onDeleteClass,
  onNavigateToUsers
}) => {
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [newClassName, setNewClassName] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ ...settings, schoolName });
    alert("Paramètres de l'école mis à jour !");
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClassName.trim()) {
      onAddClass(newClassName.trim());
      setNewClassName('');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Paramètres de l'Établissement</h2>
        <p className="text-slate-500">Personnalisez l'application pour votre école.</p>
      </div>

      {/* School Identity Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
        <div className="flex items-center gap-3 mb-4 text-indigo-700">
           <Building size={24} />
           <h3 className="text-lg font-bold">Identité de l'École</h3>
        </div>
        <form onSubmit={handleSaveSettings} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nom de l'établissement</label>
            <input 
              type="text" 
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ex: Lycée Jean Mermoz"
            />
          </div>
          <button 
            type="submit" 
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Save size={18} />
            <span>Enregistrer</span>
          </button>
        </form>
      </div>

      {/* Class Groups Management */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in delay-75">
        <div className="flex items-center gap-3 mb-4 text-indigo-700">
           <Users size={24} />
           <h3 className="text-lg font-bold">Gestion des Classes</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">Définissez les classes disponibles pour l'inscription des élèves.</p>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Add Class Form */}
          <div className="md:w-1/3">
            <form onSubmit={handleAddClass} className="flex gap-2">
              <input 
                type="text" 
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Ex: Terminale S2"
                className="flex-1 border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button 
                type="submit"
                disabled={!newClassName.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
              </button>
            </form>
          </div>

          {/* Class List */}
          <div className="flex-1">
            {classGroups.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg border border-dashed text-center text-slate-400">
                Aucune classe configurée.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {classGroups.map((group) => (
                  <div key={group.id} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-lg group hover:border-indigo-200 transition-all">
                    <span className="font-medium text-slate-700">{group.name}</span>
                    <button 
                      onClick={() => onDeleteClass(group.id)}
                      className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Workflow Navigation */}
      {onNavigateToUsers && (
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button 
            onClick={onNavigateToUsers}
            className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <span>Configuration terminée : Gérer les utilisateurs</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
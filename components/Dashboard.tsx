import React, { useState, useEffect } from 'react';
import { User, UserRole, Poll, Exam, Announcement, AppNotification, ViewState } from '../types';
import { Users, BookOpen, Vote, AlertCircle, Settings, Check, X, RefreshCw, Clock, ArrowRight, Library, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardProps {
  currentUser: User;
  stats: {
    students: number;
    polls: number;
    exams: number;
    resources: number;
  };
  upcomingExam: Exam | undefined;
  activePoll: Poll | undefined;
  latestAnnouncement: Announcement | undefined;
  notifications: AppNotification[];
  onChangeView: (view: ViewState) => void;
  onRefresh?: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  currentUser, 
  stats, 
  upcomingExam, 
  activePoll,
  latestAnnouncement,
  notifications,
  onChangeView,
  onRefresh
}) => {
  const [visibleWidgets, setVisibleWidgets] = useState({
    stats: true,
    exam: true,
    announcement: true,
    poll: true,
    activity: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVisibleWidgets(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse saved widgets settings", e);
      }
    }
  }, []);

  const toggleWidget = (key: keyof typeof visibleWidgets) => {
    const newState = { ...visibleWidgets, [key]: !visibleWidgets[key] };
    setVisibleWidgets(newState);
    localStorage.setItem('dashboard_widgets', JSON.stringify(newState));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    } else {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    setIsRefreshing(false);
  };
  
  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center transition-all hover:shadow-md hover:-translate-y-1 group">
      <div className={`p-3.5 rounded-2xl ${bgClass} mr-4 transition-transform group-hover:scale-110`}>
        <Icon size={22} className={colorClass} />
      </div>
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle size={16} className="text-orange-500" />;
      case 'success': return <Check size={16} className="text-green-500" />;
      default: return <Clock size={16} className="text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative min-h-[500px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Bonjour, {currentUser.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 font-medium mt-1">
            {currentUser.role === UserRole.ADMIN ? "Espace Administration" :
             currentUser.role === UserRole.RESPONSABLE ? "Espace Responsable" :
             "Mon Espace Élève"}
          </p>
        </div>
        
        <div className="flex w-full md:w-auto items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95 ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
            title="Actualiser les données"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
          </button>

          <div className="relative flex-1 md:flex-none">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`w-full md:w-auto flex items-center justify-center space-x-2 px-5 py-3 border rounded-xl transition-all shadow-sm active:scale-95 ${
                  showSettings 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <Settings size={18} />
              <span>Personnaliser</span>
            </button>
            
            {showSettings && (
              <div className="absolute right-0 mt-3 w-full md:w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-4 z-20 animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm">Widgets visibles</h3>
                    <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100">
                      <X size={16} />
                    </button>
                </div>
                <div className="space-y-2">
                    {[
                      { key: 'stats', label: 'Statistiques globales' },
                      { key: 'exam', label: 'Prochain examen' },
                      { key: 'announcement', label: 'Dernière annonce' },
                      { key: 'poll', label: 'Sondage en cours' },
                      { key: 'activity', label: 'Activités récentes' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          visibleWidgets[item.key as keyof typeof visibleWidgets] 
                            ? 'bg-indigo-600 border-indigo-600' 
                            : 'border-slate-300 bg-white group-hover:border-indigo-400'
                        }`}>
                            {visibleWidgets[item.key as keyof typeof visibleWidgets] && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={!!visibleWidgets[item.key as keyof typeof visibleWidgets]} 
                          onChange={() => toggleWidget(item.key as keyof typeof visibleWidgets)} 
                        />
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {visibleWidgets.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in duration-500">
          <StatCard title="Total Élèves" value={stats.students} icon={Users} colorClass="text-blue-600" bgClass="bg-blue-50" />
          <StatCard title="Examens à venir" value={stats.exams} icon={BookOpen} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
          <StatCard title="Sondages actifs" value={stats.polls} icon={Vote} colorClass="text-purple-600" bgClass="bg-purple-50" />
          <StatCard title="Ressources" value={stats.resources} icon={Library} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Next Exam Widget */}
        {visibleWidgets.exam && (
          <div onClick={() => onChangeView('DS')} className="cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-500 slide-in-from-bottom-2 hover:border-indigo-300 hover:shadow-md transition-all group">
            <h3 className="font-bold text-base text-slate-400 uppercase tracking-wider mb-5 flex items-center justify-between">
              <span>Prochain Examen</span>
              <BookOpen size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </h3>
            {upcomingExam ? (
              <div className="flex items-start space-x-5">
                  <div className="bg-orange-50 p-3.5 rounded-2xl text-center min-w-[72px] border border-orange-100 group-hover:scale-105 transition-transform">
                    <span className="block text-2xl font-bold text-orange-600 leading-none">{new Date(upcomingExam.date).getDate()}</span>
                    <span className="text-[10px] text-orange-700 uppercase font-bold tracking-wide">{upcomingExam.date.toLocaleString('fr-FR', { month: 'short' })}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{upcomingExam.subject}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                      <Clock size={14} />
                      {upcomingExam.startTime} • Salle {upcomingExam.room}
                    </p>
                    <div className="mt-3 inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-bold">
                      Durée: {upcomingExam.durationMinutes} min
                    </div>
                  </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 font-medium">Aucun examen prévu.</p>
              </div>
            )}
          </div>
        )}

        {/* Latest Announcement Widget */}
        {visibleWidgets.announcement && (
          <div onClick={() => onChangeView('INFOS')} className="cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-500 slide-in-from-bottom-2 delay-75 hover:border-indigo-300 hover:shadow-md transition-all group">
            <h3 className="font-bold text-base text-slate-400 uppercase tracking-wider mb-5 flex items-center justify-between">
              <span>Dernière Annonce</span>
              <AlertCircle size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </h3>
            {latestAnnouncement ? (
              <div>
                  <div className="flex items-center space-x-2.5 mb-2.5">
                    {latestAnnouncement.isUrgent && (
                      <span className="bg-red-50 text-red-600 p-1.5 rounded-lg">
                        <AlertCircle size={16} />
                      </span>
                    )}
                    <span className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors truncate block">{latestAnnouncement.title}</span>
                  </div>
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 mb-4 group-hover:bg-slate-50 transition-colors">
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{latestAnnouncement.subject}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                    <span>Par {latestAnnouncement.authorName}</span>
                    <span>{new Date(latestAnnouncement.date).toLocaleDateString('fr-FR')}</span>
                  </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 font-medium">Aucune annonce.</p>
              </div>
            )}
          </div>
        )}

        {/* Active Poll Widget */}
        {visibleWidgets.poll && (
          <div onClick={() => onChangeView('POLLS')} className="cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-500 slide-in-from-bottom-2 delay-100 hover:border-indigo-300 hover:shadow-md transition-all group">
            <h3 className="font-bold text-base text-slate-400 uppercase tracking-wider mb-5 flex items-center justify-between">
               <span>Sondage en cours</span>
               <Vote size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </h3>
            {activePoll ? (
                <div className="flex items-start space-x-5">
                    <div className="bg-purple-50 p-3.5 rounded-2xl text-purple-600 flex items-center justify-center min-w-[64px] min-h-[64px] border border-purple-100 group-hover:scale-105 transition-transform">
                        <Vote size={28} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-lg leading-tight mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">{activePoll.title}</h4>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                           <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-2">
                           {activePoll.options.reduce((acc, curr) => acc + curr.votes, 0)} votes enregistrés
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 font-medium">Aucun sondage actif.</p>
                </div>
            )}
          </div>
        )}

        {/* Recent Activity Widget */}
        {visibleWidgets.activity && (
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-500 slide-in-from-bottom-2 delay-150">
             <h3 className="font-bold text-base text-slate-400 uppercase tracking-wider mb-5 flex items-center justify-between">
               <span>Activités Récentes</span>
               <Sparkles size={18} className="text-slate-300" />
             </h3>
             <div className="space-y-2">
               {notifications.slice(0, 4).map((notif) => (
                 <button 
                  key={notif.id}
                  onClick={() => onChangeView(notif.linkTo)}
                  className="w-full text-left flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                 >
                   <div className="mt-1 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm flex-shrink-0 group-hover:border-indigo-100 transition-colors">
                      {getActivityIcon(notif.type)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{notif.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        il y a {formatDistanceToNow(notif.timestamp, { locale: fr })}
                      </p>
                   </div>
                   <div className="self-center bg-slate-100 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                      <ArrowRight size={12} className="text-slate-400" />
                   </div>
                 </button>
               ))}
               {notifications.length === 0 && (
                 <div className="text-center py-8">
                    <p className="text-slate-400 font-medium">Aucune activité récente.</p>
                 </div>
               )}
             </div>
           </div>
        )}
      </div>

      {/* Empty State */}
      {!Object.values(visibleWidgets).some(Boolean) && (
         <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <Settings size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Votre tableau de bord est vide</h3>
            <p className="text-slate-500 mb-6 text-sm">Personnalisez l'affichage pour voir vos informations.</p>
            <button 
              onClick={() => {
                const reset = { stats: true, exam: true, announcement: true, poll: true, activity: true };
                setVisibleWidgets(reset);
                localStorage.setItem('dashboard_widgets', JSON.stringify(reset));
              }}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-lg shadow-indigo-100 transition-all hover:-translate-y-0.5"
            >
              Rétablir l'affichage par défaut
            </button>
         </div>
      )}
    </div>
  );
};
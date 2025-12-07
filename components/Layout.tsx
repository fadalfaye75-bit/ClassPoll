
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, ViewState, AppNotification } from '../types';
import { 
  LayoutDashboard, 
  Megaphone, 
  CalendarClock, 
  Vote, 
  Users, 
  LogOut, 
  GraduationCap,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Library,
  ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LayoutProps {
  currentUser: User;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onNavigateBack: () => void;
  onLogout: () => void;
  notifications: AppNotification[];
  schoolName: string;
  logoUrl?: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  currentUser, 
  currentView, 
  onChangeView, 
  onNavigateBack,
  onLogout, 
  notifications,
  schoolName,
  logoUrl,
  children 
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const SidebarItem = ({ view, label, icon: Icon, requiredRole }: { view: ViewState, label: string, icon: any, requiredRole?: UserRole[] }) => {
    if (requiredRole && !requiredRole.includes(currentUser.role)) return null;

    const isActive = currentView === view;
    return (
      <button
        onClick={() => onChangeView(view)}
        className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-x-1' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 transition-colors'} />
        <span className={`font-medium text-sm ${isActive ? 'font-semibold' : ''}`}>{label}</span>
      </button>
    );
  };

  const MobileNavItem = ({ view, label, icon: Icon, requiredRole }: { view: ViewState, label: string, icon: any, requiredRole?: UserRole[] }) => {
    if (requiredRole && !requiredRole.includes(currentUser.role)) return null;
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => onChangeView(view)}
        className={`flex flex-col items-center justify-center w-full py-1 transition-all duration-200 active:scale-95 ${
          isActive ? 'text-indigo-600' : 'text-slate-400'
        }`}
      >
        <div className={`p-1.5 rounded-2xl mb-1 transition-all ${isActive ? 'bg-indigo-50 shadow-sm' : ''}`}>
           <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
      </button>
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={16} className="text-orange-500" />;
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const NotificationList = () => (
    <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] md:w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right z-50 ring-1 ring-black/5">
      <div className="p-4 border-b border-slate-100/50 bg-slate-50/50 flex justify-between items-center">
        <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          {notifications.length} nouvelles
        </span>
      </div>
      <div className="max-h-[60vh] md:max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <div className="bg-slate-50 p-3 rounded-full w-fit mx-auto mb-3">
              <Bell size={20} className="opacity-50" />
            </div>
            <p>Aucune notification pour le moment</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => {
                onChangeView(notif.linkTo);
                setIsNotifOpen(false);
              }}
              className="w-full text-left p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-start gap-3.5 group"
            >
              <div className="mt-1 bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 group-hover:border-indigo-100 transition-colors">
                 {getNotificationIcon(notif.type)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{notif.title}</p>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{notif.message}</p>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                  {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: fr })}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans text-slate-900">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200/60 fixed h-full z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
        <div className="p-8 flex items-center space-x-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain max-w-[50px]" />
          ) : (
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200 flex-shrink-0">
              <GraduationCap className="text-white h-6 w-6" />
            </div>
          )}
          <span className="text-xl font-bold text-slate-900 tracking-tight leading-none line-clamp-2" title={schoolName}>
            {schoolName}
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-2">
          <SidebarItem view="DASHBOARD" label="Tableau de bord" icon={LayoutDashboard} />
          <SidebarItem view="INFOS" label="Infos & Meet" icon={Megaphone} />
          <SidebarItem view="DS" label="Examens" icon={CalendarClock} />
          <SidebarItem view="RESOURCES" label="Ressources" icon={Library} />
          <SidebarItem view="POLLS" label="Sondages" icon={Vote} />
          <div className="pt-6 pb-2">
            <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Administration</p>
            <SidebarItem view="USERS" label="Utilisateurs" icon={Users} requiredRole={[UserRole.ADMIN]} />
            <SidebarItem view="SETTINGS" label="Paramètres" icon={Settings} requiredRole={[UserRole.ADMIN]} />
          </div>
        </nav>

        <div className="p-4 m-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-indigo-700 font-bold border border-slate-200 shadow-sm flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-slate-600 hover:bg-white hover:text-red-600 hover:shadow-sm transition-all text-sm font-semibold border border-transparent hover:border-slate-100"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE TOP BAR --- */}
      <div className="md:hidden fixed top-0 w-full z-30 border-b border-slate-200/60 px-4 h-16 flex justify-between items-center glass">
         <div className="flex items-center space-x-3 overflow-hidden">
            {currentView !== 'DASHBOARD' ? (
              <button 
                onClick={onNavigateBack}
                className="p-2 rounded-full text-slate-600 hover:bg-slate-100/50 active:scale-95 transition-all"
              >
                <ArrowLeft size={22} />
              </button>
            ) : (
               logoUrl ? (
                 <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
               ) : (
                <div className="bg-indigo-600 p-1.5 rounded-lg flex-shrink-0 shadow-md shadow-indigo-200">
                  <GraduationCap className="text-white h-5 w-5" />
                </div>
               )
            )}
            <span className="text-lg font-bold text-slate-800 truncate tracking-tight">
              {currentView === 'DASHBOARD' ? schoolName : 
               currentView === 'INFOS' ? 'Infos & Meet' :
               currentView === 'DS' ? 'Examens' :
               currentView === 'POLLS' ? 'Sondages' :
               currentView === 'RESOURCES' ? 'Ressources' :
               currentView === 'USERS' ? 'Utilisateurs' : 'Paramètres'}
            </span>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2.5 text-slate-500 hover:bg-slate-100/50 rounded-full transition-all relative active:scale-95"
            >
              <Bell size={22} strokeWidth={2} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>
             {isNotifOpen && <NotificationList />}
           </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen pb-24 md:pb-0 pt-16 md:pt-0">
        {/* Desktop Header */}
        <header className="hidden md:flex glass sticky top-0 z-10 px-8 h-20 items-center justify-between">
           <div className="flex items-center">
             {currentView !== 'DASHBOARD' && (
               <button 
                 onClick={onNavigateBack}
                 className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors px-4 py-2 rounded-xl hover:bg-slate-50"
               >
                 <ArrowLeft size={18} />
                 <span className="text-sm font-semibold">Retour</span>
               </button>
             )}
           </div>

           <div className="flex items-center space-x-4">
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`p-2.5 rounded-full transition-all relative ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                >
                  <Bell size={20} strokeWidth={2} />
                  {notifications.length > 0 && (
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                  )}
                </button>
                {isNotifOpen && <NotificationList />}
              </div>
           </div>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto flex-1 w-full max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 w-full glass z-30 pb-safe-area border-t border-slate-200/60 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center px-1 py-2">
          <MobileNavItem view="DASHBOARD" label="Accueil" icon={LayoutDashboard} />
          <MobileNavItem view="INFOS" label="Infos" icon={Megaphone} />
          <MobileNavItem view="DS" label="Examens" icon={CalendarClock} />
          <MobileNavItem view="RESOURCES" label="Biblio" icon={Library} />
          {currentUser.role === UserRole.ADMIN && (
             <MobileNavItem view="SETTINGS" label="Admin" icon={Settings} />
          )}
        </div>
      </nav>
    </div>
  );
};

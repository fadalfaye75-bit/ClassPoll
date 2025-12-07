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
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-150 group ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-sm' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-700'
        }`}
      >
        <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 transition-colors'} />
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
        className={`flex flex-col items-center justify-center w-full py-2 transition-colors duration-150 ${
          isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
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
    <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] md:w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right z-50">
      <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          {notifications.length} nouvelles
        </span>
      </div>
      <div className="max-h-[60vh] md:max-h-80 overflow-y-auto bg-white">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <div className="bg-slate-50 p-2 rounded-full w-fit mx-auto mb-2">
              <Bell size={20} className="opacity-50" />
            </div>
            <p>Aucune notification</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => {
                onChangeView(notif.linkTo);
                setIsNotifOpen(false);
              }}
              className="w-full text-left p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-start gap-3 group"
            >
              <div className="mt-0.5 bg-white p-1 rounded border border-slate-200 group-hover:border-indigo-200 transition-colors">
                 {getNotificationIcon(notif.type)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{notif.title}</p>
                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-snug">{notif.message}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
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
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain max-w-[150px]" />
          ) : (
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg flex-shrink-0">
                <GraduationCap className="text-white h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-slate-800 tracking-tight" title={schoolName}>
                {schoolName}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center text-indigo-700 font-bold border border-slate-200 flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-slate-600 hover:bg-white hover:text-red-600 hover:shadow-sm transition-all text-xs font-semibold border border-transparent hover:border-slate-200"
          >
            <LogOut size={14} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE TOP BAR --- */}
      <div className="md:hidden fixed top-0 w-full z-30 border-b border-slate-200 bg-white px-4 h-16 flex justify-between items-center shadow-sm">
         <div className="flex items-center space-x-3 overflow-hidden">
            {currentView !== 'DASHBOARD' ? (
              <button 
                onClick={onNavigateBack}
                className="p-2 rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
               logoUrl ? (
                 <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
               ) : (
                <div className="bg-indigo-600 p-1.5 rounded-lg flex-shrink-0">
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
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all relative active:scale-95"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>
             {isNotifOpen && <NotificationList />}
           </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen pb-20 md:pb-0 pt-16 md:pt-0">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-white/95 sticky top-0 z-10 px-8 h-16 items-center justify-between border-b border-slate-200 backdrop-blur-sm">
           <div className="flex items-center">
             {currentView !== 'DASHBOARD' && (
               <button 
                 onClick={onNavigateBack}
                 className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
               >
                 <ArrowLeft size={16} />
                 <span className="text-sm font-semibold">Retour</span>
               </button>
             )}
           </div>

           <div className="flex items-center space-x-4">
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`p-2 rounded-full transition-all relative ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
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
      <nav className="md:hidden fixed bottom-0 w-full bg-white z-30 pb-safe-area border-t border-slate-200 shadow-lg">
        <div className="flex justify-around items-center px-1 py-1">
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
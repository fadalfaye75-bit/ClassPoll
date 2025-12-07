import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, UserRole, ViewState, Poll, Exam, Announcement, Resource, AppNotification, SchoolSettings, ClassGroup } from './types';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { InfoBoard } from './components/InfoBoard';
import { ExamSchedule } from './components/ExamSchedule';
import { Polls } from './components/Polls';
import { Resources } from './components/Resources';
import { UserManagement } from './components/UserManagement';
import { Settings } from './components/Settings';
import { differenceInDays, differenceInHours } from 'date-fns';
import { supabase } from './lib/supabase';
import { Loader2, AlertTriangle } from 'lucide-react';

// Default Admin to ensure the system is accessible on first load
const DEFAULT_ADMIN: User = { 
  id: 'admin-init', 
  name: 'Administrateur Principal', 
  email: 'faye@eco.com', 
  password: 'passer25', 
  role: UserRole.ADMIN 
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({ schoolName: 'ClassPoll+', themeColor: 'indigo' });
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Helper for generating IDs
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString() + Math.random().toString(36).substring(2);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(prev => prev ? true : false); // Only show full loader on first load
    setDbError(null);
    try {
      // 0. Fetch Settings & Classes
      const { data: settingsData } = await supabase.from('school_settings').select('*').single();
      if (settingsData) {
        setSchoolSettings({ 
          schoolName: settingsData.school_name || 'ClassPoll+', 
          themeColor: settingsData.theme_color || 'indigo' 
        });
        document.title = settingsData.school_name || 'ClassPoll+';
      }

      const { data: classesData } = await supabase.from('class_groups').select('*').order('name');
      if (classesData) {
        setClassGroups(classesData);
      }

      // 1. Fetch Users
      const { data: userData, error: userError } = await supabase.from('users').select('*');
      if (userError) throw userError;

      // Map DB snake_case to CamelCase
      const mappedUsers: User[] = (userData || []).map((u: any) => ({
        ...u,
        classGroup: u.class_group
      }));

      // Initialize Admin if empty
      if (mappedUsers.length === 0) {
        const { error: initError } = await supabase.from('users').insert({
           id: DEFAULT_ADMIN.id,
           name: DEFAULT_ADMIN.name,
           email: DEFAULT_ADMIN.email,
           password: DEFAULT_ADMIN.password,
           role: DEFAULT_ADMIN.role
        });
        if (initError) console.error("Failed to init admin", initError);
        else mappedUsers.push(DEFAULT_ADMIN);
      }
      setUsers(mappedUsers);

      // --- SESSION RESTORATION ---
      const storedSession = localStorage.getItem('classpoll_session');
      if (storedSession) {
        try {
          const sessionUser = JSON.parse(storedSession);
          const validUser = mappedUsers.find(u => u.id === sessionUser.id);
          if (validUser) {
            setCurrentUser(validUser);
          } else {
            localStorage.removeItem('classpoll_session');
          }
        } catch (e) {
          console.error("Invalid session data", e);
          localStorage.removeItem('classpoll_session');
        }
      }

      // 2. Fetch Announcements
      const { data: annData, error: annError } = await supabase.from('announcements').select('*');
      if (annError) throw annError;
      setAnnouncements((annData || []).map((a: any) => ({
        ...a,
        meetLink: a.meet_link,
        isUrgent: a.is_urgent,
        authorId: a.author_id,
        authorName: a.author_name,
        targetClass: a.target_class,
        date: new Date(a.date)
      })));

      // 3. Fetch Exams
      const { data: examData, error: examError } = await supabase.from('exams').select('*');
      if (examError) throw examError;
      setExams((examData || []).map((e: any) => ({
        ...e,
        startTime: e.start_time,
        durationMinutes: e.duration_minutes,
        createdById: e.created_by_id,
        targetClass: e.target_class,
        date: new Date(e.date)
      })));

      // 4. Fetch Polls
      const { data: pollData, error: pollError } = await supabase.from('polls').select('*');
      if (pollError) throw pollError;
      setPolls((pollData || []).map((p: any) => ({
        ...p,
        isAnonymous: p.is_anonymous,
        createdAt: new Date(p.created_at),
        expiresAt: new Date(p.expires_at),
        createdById: p.created_by_id,
        votedUserIds: p.voted_user_ids || [],
        targetClass: p.target_class,
        options: p.options || []
      })));

      // 5. Fetch Resources
      const { data: resData, error: resError } = await supabase.from('resources').select('*');
      if (resError && resError.code !== '42P01') { // Ignore "table not found" for now if SQL not run
         console.error("Resources fetch error", resError);
      } else if (resData) {
        setResources((resData || []).map((r: any) => ({
          ...r,
          targetClass: r.target_class,
          createdAt: new Date(r.created_at)
        })));
      }

    } catch (error: any) {
      console.error("Database Error:", error);
      setDbError("Erreur de connexion à la base de données. Assurez-vous d'avoir exécuté le script SQL.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filtering Logic for Students ---
  // Students should ONLY see items for their class OR items for "All Schools" (targetClass is null)
  const filteredAnnouncements = useMemo(() => {
    if (!currentUser || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.RESPONSABLE) return announcements;
    return announcements.filter(a => !a.targetClass || a.targetClass === currentUser.classGroup);
  }, [announcements, currentUser]);

  const filteredExams = useMemo(() => {
    if (!currentUser || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.RESPONSABLE) return exams;
    return exams.filter(e => !e.targetClass || e.targetClass === currentUser.classGroup);
  }, [exams, currentUser]);

  const filteredPolls = useMemo(() => {
    if (!currentUser || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.RESPONSABLE) return polls;
    return polls.filter(p => !p.targetClass || p.targetClass === currentUser.classGroup);
  }, [polls, currentUser]);

  const filteredResources = useMemo(() => {
    if (!currentUser || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.RESPONSABLE) return resources;
    return resources.filter(r => !r.targetClass || r.targetClass === currentUser.classGroup);
  }, [resources, currentUser]);


  const handleLogin = (email: string, password: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      localStorage.setItem('classpoll_session', JSON.stringify(user));
      setCurrentUser(user);
      setCurrentView('DASHBOARD');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('classpoll_session');
    setCurrentUser(null);
  };

  // --- Actions with Supabase ---

  const addAnnouncement = async (data: Omit<Announcement, 'id' | 'authorId' | 'authorName'>) => {
    if (!currentUser) return;
    const newId = generateId();
    const newAnn: Announcement = {
      ...data,
      id: newId,
      authorId: currentUser.id,
      authorName: currentUser.name
    };

    setAnnouncements(prev => [newAnn, ...prev]);

    await supabase.from('announcements').insert({
      id: newId,
      title: data.title,
      subject: data.subject,
      meet_link: data.meetLink,
      date: data.date.toISOString(),
      is_urgent: data.isUrgent,
      target_class: data.targetClass,
      author_id: currentUser.id,
      author_name: currentUser.name
    });
  };

  const deleteAnnouncement = async (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    await supabase.from('announcements').delete().eq('id', id);
  };

  const addExam = async (data: Omit<Exam, 'id' | 'createdById'>) => {
    if (!currentUser) return;
    const newId = generateId();
    const newExam: Exam = {
      ...data,
      id: newId,
      createdById: currentUser.id
    };

    setExams(prev => [...prev, newExam]);

    await supabase.from('exams').insert({
      id: newId,
      subject: data.subject,
      date: data.date.toISOString(),
      start_time: data.startTime,
      duration_minutes: data.durationMinutes,
      room: data.room,
      notes: data.notes,
      target_class: data.targetClass,
      created_by_id: currentUser.id
    });
  };

  const deleteExam = async (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
    await supabase.from('exams').delete().eq('id', id);
  };

  const addPoll = async (data: Omit<Poll, 'id' | 'createdById' | 'createdAt' | 'votedUserIds'>) => {
    if (!currentUser) return;
    const newId = generateId();
    const now = new Date();
    const newPoll: Poll = {
      ...data,
      id: newId,
      createdById: currentUser.id,
      createdAt: now,
      votedUserIds: []
    };

    setPolls(prev => [newPoll, ...prev]);

    await supabase.from('polls').insert({
      id: newId,
      title: data.title,
      options: data.options,
      is_anonymous: data.isAnonymous,
      created_at: now.toISOString(),
      expires_at: data.expiresAt.toISOString(),
      target_class: data.targetClass,
      created_by_id: currentUser.id,
      voted_user_ids: []
    });
  };

  const votePoll = async (pollId: string, optionId: string) => {
    if (!currentUser) return;
    const pollToUpdate = polls.find(p => p.id === pollId);
    if (!pollToUpdate || pollToUpdate.votedUserIds.includes(currentUser.id)) return;

    const updatedVotedIds = [...pollToUpdate.votedUserIds, currentUser.id];
    const updatedOptions = pollToUpdate.options.map(o => 
      o.id === optionId ? { ...o, votes: o.votes + 1 } : o
    );

    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p;
      return { ...p, votedUserIds: updatedVotedIds, options: updatedOptions };
    }));

    await supabase.from('polls').update({
      voted_user_ids: updatedVotedIds,
      options: updatedOptions
    }).eq('id', pollId);
  };

  const deletePoll = async (id: string) => {
    setPolls(prev => prev.filter(p => p.id !== id));
    await supabase.from('polls').delete().eq('id', id);
  };

  const addResource = async (data: Omit<Resource, 'id' | 'createdAt'>) => {
    const newId = generateId();
    const newRes: Resource = {
      ...data,
      id: newId,
      createdAt: new Date()
    };
    setResources(prev => [newRes, ...prev]);
    await supabase.from('resources').insert({
      id: newId,
      title: data.title,
      type: data.type,
      content: data.content,
      subject: data.subject,
      description: data.description,
      target_class: data.targetClass
    });
  };

  const deleteResource = async (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id));
    await supabase.from('resources').delete().eq('id', id);
  };

  const addUser = async (user: User) => {
    setUsers(prev => [...prev, user]);
    await supabase.from('users').insert({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      class_group: user.classGroup
    });
  };

  const updateUser = async (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('classpoll_session', JSON.stringify(updatedUser));
    }
    await supabase.from('users').update({
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      password: updatedUser.password,
      class_group: updatedUser.classGroup
    }).eq('id', updatedUser.id);
  };

  const deleteUser = async (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.email === 'faye@eco.com') {
      alert("Impossible de supprimer l'administrateur principal.");
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    await supabase.from('users').delete().eq('id', id);
  };

  const resetUserPassword = async (id: string) => {
    const defaultPassword = 'passer25';
    setUsers(prev => prev.map(u => u.id === id ? { ...u, password: defaultPassword } : u));
    await supabase.from('users').update({ password: defaultPassword }).eq('id', id);
  };

  const updateSettings = async (newSettings: SchoolSettings) => {
    setSchoolSettings(newSettings);
    document.title = newSettings.schoolName;
    await supabase.from('school_settings').upsert({ id: 'config', school_name: newSettings.schoolName, theme_color: newSettings.themeColor });
  };

  const addClassGroup = async (name: string) => {
    const newClass: ClassGroup = { id: generateId(), name };
    setClassGroups(prev => [...prev, newClass]);
    await supabase.from('class_groups').insert(newClass);
  };

  const deleteClassGroup = async (id: string) => {
    setClassGroups(prev => prev.filter(c => c.id !== id));
    await supabase.from('class_groups').delete().eq('id', id);
  };

  // --- Notifications ---
  const notifications = useMemo(() => {
    const notifs: AppNotification[] = [];
    const now = new Date();

    filteredExams.forEach(exam => {
      const daysUntil = differenceInDays(new Date(exam.date), now);
      if (daysUntil >= 0 && daysUntil <= 7) {
        notifs.push({
          id: `exam-${exam.id}`,
          type: 'alert',
          title: 'Examen Approchant',
          message: `DS de ${exam.subject} ${daysUntil === 0 ? "aujourd'hui" : "dans " + daysUntil + " jours"}.`,
          linkTo: 'DS',
          timestamp: new Date(exam.date)
        });
      }
    });

    filteredAnnouncements.forEach(ann => {
      const hoursSincePost = differenceInHours(now, new Date(ann.date));
      const hoursUntilMeet = differenceInHours(new Date(ann.date), now);
      if (ann.meetLink && hoursUntilMeet > 0 && hoursUntilMeet < 24) {
        notifs.push({
          id: `meet-${ann.id}`,
          type: 'info',
          title: 'Visioconférence Bientôt',
          message: `Le cours "${ann.title}" commence bientôt.`,
          linkTo: 'INFOS',
          timestamp: new Date(ann.date)
        });
      } else if (Math.abs(hoursSincePost) < 48) {
         notifs.push({
          id: `ann-${ann.id}`,
          type: ann.isUrgent ? 'alert' : 'info',
          title: ann.isUrgent ? 'Annonce Urgente' : 'Nouvelle Annonce',
          message: ann.title,
          linkTo: 'INFOS',
          timestamp: new Date(ann.date)
         });
      }
    });

    filteredPolls.forEach(poll => {
      const hoursSinceCreation = differenceInHours(now, new Date(poll.createdAt));
      if (hoursSinceCreation < 48 && !poll.votedUserIds.includes(currentUser?.id || '')) {
        notifs.push({
           id: `poll-${poll.id}`,
           type: 'success',
           title: 'Nouveau Sondage',
           message: poll.title,
           linkTo: 'POLLS',
           timestamp: new Date(poll.createdAt)
        });
      }
    });

    // Notify about new resources
    filteredResources.forEach(res => {
      const hoursSince = differenceInHours(now, res.createdAt);
      if (hoursSince < 24) {
        notifs.push({
          id: `res-${res.id}`,
          type: 'info',
          title: 'Nouvelle Ressource',
          message: `Ajout en ${res.subject}: ${res.title}`,
          linkTo: 'RESOURCES',
          timestamp: res.createdAt
        });
      }
    });

    return notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [filteredExams, filteredAnnouncements, filteredPolls, filteredResources, currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium">Chargement des données...</p>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg text-center border border-red-100">
           <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
              <AlertTriangle size={32} />
           </div>
           <h2 className="text-2xl font-bold text-slate-900 mb-2">Configuration Requise</h2>
           <p className="text-slate-600 mb-6">{dbError}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentUser={currentUser} 
      currentView={currentView} 
      onChangeView={setCurrentView}
      onLogout={handleLogout}
      notifications={notifications}
      schoolName={schoolSettings.schoolName}
    >
      {currentView === 'DASHBOARD' && (
        <Dashboard 
          currentUser={currentUser}
          stats={{
            students: users.filter(u => u.role === UserRole.ELEVE).length,
            polls: filteredPolls.length,
            exams: filteredExams.length,
            resources: filteredResources.length
          }}
          upcomingExam={[...filteredExams].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).find(e => new Date(e.date) > new Date())}
          activePoll={filteredPolls.filter(p => new Date(p.expiresAt) > new Date())[0]}
          latestAnnouncement={[...filteredAnnouncements].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]}
          notifications={notifications}
          onChangeView={setCurrentView}
          onRefresh={fetchData}
        />
      )}
      {currentView === 'INFOS' && (
        <InfoBoard 
          currentUser={currentUser}
          announcements={filteredAnnouncements}
          classGroups={classGroups}
          onAdd={addAnnouncement}
          onDelete={deleteAnnouncement}
        />
      )}
      {currentView === 'DS' && (
        <ExamSchedule 
          currentUser={currentUser}
          exams={filteredExams}
          classGroups={classGroups}
          onAdd={addExam}
          onDelete={deleteExam}
        />
      )}
      {currentView === 'RESOURCES' && (
        <Resources 
          currentUser={currentUser}
          resources={filteredResources}
          classGroups={classGroups}
          onAdd={addResource}
          onDelete={deleteResource}
        />
      )}
      {currentView === 'POLLS' && (
        <Polls 
          currentUser={currentUser}
          polls={filteredPolls}
          classGroups={classGroups}
          onAdd={addPoll}
          onVote={votePoll}
          onDelete={deletePoll}
        />
      )}
      {currentView === 'USERS' && currentUser.role === UserRole.ADMIN && (
        <UserManagement 
          users={users}
          classGroups={classGroups}
          onAdd={addUser}
          onUpdate={updateUser}
          onDelete={deleteUser}
          onResetPassword={resetUserPassword}
        />
      )}
      {currentView === 'SETTINGS' && currentUser.role === UserRole.ADMIN && (
        <Settings 
          settings={schoolSettings}
          classGroups={classGroups}
          onUpdateSettings={updateSettings}
          onAddClass={addClassGroup}
          onDeleteClass={deleteClassGroup}
          onNavigateToUsers={() => setCurrentView('USERS')}
        />
      )}
    </Layout>
  );
};

export default App;
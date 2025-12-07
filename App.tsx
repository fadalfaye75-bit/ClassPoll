
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
  const [viewHistory, setViewHistory] = useState<ViewState[]>([]); // Navigation History Stack
  
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
          themeColor: settingsData.theme_color || 'indigo',
          logoUrl: settingsData.logo_url
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
      
      setPolls((pollData || []).map((p: any) => {
        // Handle Migration: If DB has array (old format), convert to empty object or ignore
        // If DB has object (new format), use it
        let votesMap: Record<string, string> = {};
        if (p.voted_user_ids && !Array.isArray(p.voted_user_ids)) {
            votesMap = p.voted_user_ids;
        }

        return {
          ...p,
          isAnonymous: p.is_anonymous,
          createdAt: new Date(p.created_at),
          expiresAt: new Date(p.expires_at),
          createdById: p.created_by_id,
          userVotes: votesMap, // New field
          targetClass: p.target_class,
          options: p.options || []
        };
      }));

      // 5. Fetch Resources
      const { data: resData, error: resError } = await supabase.from('resources').select('*');
      if (resError && resError.code !== '42P01') { 
         console.error("Resources fetch error", resError);
      } else if (resData) {
        setResources((resData || []).map((r: any) => ({
          ...r,
          targetClass: r.target_class,
          createdAt: new Date(r.created_at),
          createdById: r.created_by_id
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

  // --- NAVIGATION LOGIC ---
  const changeView = (newView: ViewState) => {
    if (newView === currentView) return;
    // Push current view to history before changing
    setViewHistory(prev => [...prev, currentView]);
    setCurrentView(newView);
  };

  const navigateBack = () => {
    if (viewHistory.length === 0) {
      setCurrentView('DASHBOARD');
      return;
    }
    const newHistory = [...viewHistory];
    const lastView = newHistory.pop();
    setViewHistory(newHistory);
    if (lastView) {
      setCurrentView(lastView);
    }
  };

  // --- Filtering Logic for Students ---
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
      setViewHistory([]); // Reset history on login
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('classpoll_session');
    setCurrentUser(null);
    setViewHistory([]);
  };

  // --- Optimistic Actions with Supabase ---

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

    try {
      const { error } = await supabase.from('announcements').insert({
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
      if (error) throw error;
    } catch (err: any) {
      console.error("Failed to add announcement", err);
      alert(`Erreur lors de la publication: ${err.message || 'Erreur inconnue'}`);
      setAnnouncements(prev => prev.filter(a => a.id !== newId));
    }
  };

  const updateAnnouncement = async (updatedAnn: Omit<Announcement, 'authorName'>) => {
    const prevAnnouncements = [...announcements];
    setAnnouncements(prev => prev.map(a => a.id === updatedAnn.id ? { ...a, ...updatedAnn } : a));

    try {
      const { error } = await supabase.from('announcements').update({
        title: updatedAnn.title,
        subject: updatedAnn.subject,
        meet_link: updatedAnn.meetLink,
        date: updatedAnn.date.toISOString(),
        is_urgent: updatedAnn.isUrgent,
        target_class: updatedAnn.targetClass
      }).eq('id', updatedAnn.id);
      if (error) throw error;
    } catch (err: any) {
      console.error("Update failed", err);
      alert(`Erreur lors de la mise à jour: ${err.message || 'Erreur inconnue'}`);
      setAnnouncements(prevAnnouncements);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    const prevAnnouncements = [...announcements];
    setAnnouncements(prev => prev.filter(a => a.id !== id));

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error("Delete failed", err);
      alert(`Impossible de supprimer l'annonce. Détails: ${err.message || 'Erreur inconnue'}`);
      setAnnouncements(prevAnnouncements);
    }
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

    try {
      const { error } = await supabase.from('exams').insert({
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
      if (error) throw error;
    } catch (err: any) {
      console.error("Failed to add exam", err);
      alert(`Erreur lors de l'ajout de l'examen: ${err.message}`);
      setExams(prev => prev.filter(e => e.id !== newId));
    }
  };

  const updateExam = async (updatedExam: Exam) => {
    const prevExams = [...exams];
    setExams(prev => prev.map(e => e.id === updatedExam.id ? updatedExam : e));

    try {
      const { error } = await supabase.from('exams').update({
        subject: updatedExam.subject,
        date: updatedExam.date.toISOString(),
        start_time: updatedExam.startTime,
        duration_minutes: updatedExam.durationMinutes,
        room: updatedExam.room,
        notes: updatedExam.notes,
        target_class: updatedExam.targetClass
      }).eq('id', updatedExam.id);
      if (error) throw error;
    } catch (err: any) {
      console.error("Update exam failed", err);
      alert(`Erreur lors de la mise à jour de l'examen: ${err.message}`);
      setExams(prevExams);
    }
  };

  const deleteExam = async (id: string) => {
    const prevExams = [...exams];
    setExams(prev => prev.filter(e => e.id !== id));

    try {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error("Delete failed", err);
      alert(`Impossible de supprimer l'examen. Détails: ${err.message}`);
      setExams(prevExams);
    }
  };

  const addPoll = async (data: Omit<Poll, 'id' | 'createdById' | 'createdAt' | 'userVotes'>) => {
    if (!currentUser) return;
    const newId = generateId();
    const now = new Date();
    const newPoll: Poll = {
      ...data,
      id: newId,
      createdById: currentUser.id,
      createdAt: now,
      userVotes: {}
    };

    setPolls(prev => [newPoll, ...prev]);

    try {
      const { error } = await supabase.from('polls').insert({
        id: newId,
        title: data.title,
        options: data.options,
        is_anonymous: data.isAnonymous,
        created_at: now.toISOString(),
        expires_at: data.expiresAt.toISOString(),
        target_class: data.targetClass,
        created_by_id: currentUser.id,
        voted_user_ids: {} // Initialize as empty object
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Failed to add poll", err);
      alert(`Erreur lors de la création du sondage: ${err.message}`);
      setPolls(prev => prev.filter(p => p.id !== newId));
    }
  };

  const updatePoll = async (updatedPoll: Poll) => {
    const prevPolls = [...polls];
    setPolls(prev => prev.map(p => p.id === updatedPoll.id ? updatedPoll : p));

    try {
      const { error } = await supabase.from('polls').update({
        title: updatedPoll.title,
        options: updatedPoll.options,
        is_anonymous: updatedPoll.isAnonymous,
        target_class: updatedPoll.targetClass
      }).eq('id', updatedPoll.id);
      if (error) throw error;
    } catch (err: any) {
      console.error("Update poll failed", err);
      alert(`Erreur lors de la mise à jour du sondage: ${err.message}`);
      setPolls(prevPolls);
    }
  };

  // CORRECTED VOTE LOGIC: Handle changing votes with robust error handling
  const votePoll = async (pollId: string, optionId: string) => {
    if (!currentUser) return;
    
    // 1. Identify poll and changes
    const pollToUpdate = polls.find(p => p.id === pollId);
    if (!pollToUpdate) return;

    const previousOptionId = pollToUpdate.userVotes[currentUser.id];
    
    // Prevent voting for the same option again
    if (previousOptionId === optionId) return;

    // 2. Compute new state
    const updatedUserVotes = { ...pollToUpdate.userVotes, [currentUser.id]: optionId };
    
    const updatedOptions = pollToUpdate.options.map(o => {
      let voteCount = o.votes;
      // Decrement old vote (if any)
      if (o.id === previousOptionId) voteCount = Math.max(0, voteCount - 1);
      // Increment new vote
      if (o.id === optionId) voteCount += 1;
      return { ...o, votes: voteCount };
    });

    const updatedPoll = { ...pollToUpdate, userVotes: updatedUserVotes, options: updatedOptions };

    // 3. Optimistic Update
    setPolls(prev => prev.map(p => p.id === pollId ? updatedPoll : p));

    try {
      // 4. Send to Supabase
      const { error } = await supabase.from('polls').update({
        voted_user_ids: updatedUserVotes, // Save object map
        options: updatedOptions
      }).eq('id', pollId);
      
      if (error) throw error;
    } catch (err: any) {
      console.error("Vote failed", err);
      alert(`Erreur lors du vote: ${err.message}`);
      // 5. Safe Rollback: Refetch data instead of restoring state to avoid Date object issues
      await fetchData(); 
    }
  };

  const deletePoll = async (id: string) => {
    const prevPolls = [...polls];
    setPolls(prev => prev.filter(p => p.id !== id));

    try {
      const { error } = await supabase.from('polls').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error("Delete poll failed", err);
      alert(`Impossible de supprimer le sondage. Détails: ${err.message}`);
      setPolls(prevPolls);
    }
  };

  // --- RESOURCES ---

  const addResource = async (data: Omit<Resource, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    const newId = generateId();
    const now = new Date();
    const newRes: Resource = {
      ...data,
      id: newId,
      createdAt: now,
      createdById: currentUser.id
    };

    setResources(prev => [newRes, ...prev]);

    try {
      const { error } = await supabase.from('resources').insert({
        id: newId,
        title: data.title,
        type: data.type,
        content: data.content,
        subject: data.subject,
        description: data.description,
        target_class: data.targetClass,
        created_at: now.toISOString(),
        created_by_id: currentUser.id
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Add resource failed", err);
      alert(`Erreur: ${err.message}`);
      setResources(prev => prev.filter(r => r.id !== newId));
    }
  };

  const updateResource = async (updatedRes: Resource) => {
    const prevResources = [...resources];
    setResources(prev => prev.map(r => r.id === updatedRes.id ? updatedRes : r));

    try {
      const { error } = await supabase.from('resources').update({
        title: updatedRes.title,
        type: updatedRes.type,
        content: updatedRes.content,
        subject: updatedRes.subject,
        description: updatedRes.description,
        target_class: updatedRes.targetClass
      }).eq('id', updatedRes.id);
      if (error) throw error;
    } catch (err: any) {
      console.error("Update resource failed", err);
      alert(`Erreur: ${err.message}`);
      setResources(prevResources);
    }
  };

  const deleteResource = async (id: string) => {
    const prevResources = [...resources];
    setResources(prev => prev.filter(r => r.id !== id));

    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error("Delete resource failed", err);
      alert(`Impossible de supprimer la ressource. Détails: ${err.message}`);
      setResources(prevResources);
    }
  };

  // --- USERS MANAGEMENT ---

  const addUser = async (user: User) => {
    setUsers(prev => [...prev, user]);
    try {
      const { error } = await supabase.from('users').insert({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        class_group: user.classGroup
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Add user failed", err);
      alert(`Erreur: ${err.message}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    }
  };

  const updateUser = async (updatedUser: User) => {
    const prevUsers = [...users];
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    try {
      const { error } = await supabase.from('users').update({
        name: updatedUser.name,
        email: updatedUser.email,
        password: updatedUser.password,
        role: updatedUser.role,
        class_group: updatedUser.classGroup
      }).eq('id', updatedUser.id);
      if (error) throw error;
    } catch (err: any) {
      console.error("Update user failed", err);
      alert(`Erreur: ${err.message}`);
      setUsers(prevUsers);
    }
  };

  const resetUserPassword = async (id: string) => {
    const prevUsers = [...users];
    setUsers(prev => prev.map(u => u.id === id ? { ...u, password: 'passer25' } : u));
    try {
      const { error } = await supabase.from('users').update({ password: 'passer25' }).eq('id', id);
      if (error) throw error;
      alert("Mot de passe réinitialisé à 'passer25'");
    } catch (err: any) {
      console.error("Reset password failed", err);
      alert(`Erreur: ${err.message}`);
      setUsers(prevUsers);
    }
  };

  // ROBUST DELETE USER: Database Cascade
  // Assumes the user has run the SQL script to enable ON DELETE CASCADE
  const deleteUser = async (id: string) => {
    const prevUsers = [...users];
    setUsers(prev => prev.filter(u => u.id !== id));

    try {
      // Direct delete - database handles cleanup of related items
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;

    } catch (err: any) {
      console.error("Delete user failed", err);
      // specific hint for foreign key constraint if they didn't run SQL
      if (err.message?.includes('foreign key constraint') || err.code === '23503') {
         alert("Impossible de supprimer : Vous devez exécuter le script SQL 'Cascade' dans Supabase pour autoriser la suppression d'un utilisateur ayant créé du contenu.");
      } else {
         alert(`Impossible de supprimer l'utilisateur. Erreur: ${err.message}`);
      }
      setUsers(prevUsers); // Rollback
      fetchData(); // Refresh to ensure sync
    }
  };

  // --- SETTINGS ---
  const updateSettings = async (settings: SchoolSettings) => {
    setSchoolSettings(settings);
    try {
      const { error } = await supabase.from('school_settings').upsert({
        id: 'config',
        school_name: settings.schoolName,
        theme_color: settings.themeColor,
        logo_url: settings.logoUrl
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Update settings failed", err);
    }
  };

  const addClassGroup = async (name: string) => {
    const newId = generateId();
    const newClass = { id: newId, name };
    setClassGroups(prev => [...prev, newClass]);
    try {
      const { error } = await supabase.from('class_groups').insert(newClass);
      if (error) throw error;
    } catch (err: any) {
      alert(`Erreur ajout classe: ${err.message}`);
      setClassGroups(prev => prev.filter(c => c.id !== newId));
    }
  };

  const deleteClassGroup = async (id: string) => {
    const prevClasses = [...classGroups];
    setClassGroups(prev => prev.filter(c => c.id !== id));
    try {
      const { error } = await supabase.from('class_groups').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      alert(`Impossible de supprimer la classe (peut-être utilisée ?): ${err.message}`);
      setClassGroups(prevClasses);
    }
  };

  // --- NOTIFICATIONS ---
  const notifications: AppNotification[] = useMemo(() => {
    if (!currentUser) return [];
    const notifs: AppNotification[] = [];

    // 1. Upcoming Exams (Alert)
    filteredExams.forEach(exam => {
      const daysLeft = differenceInDays(new Date(exam.date), new Date());
      if (daysLeft >= 0 && daysLeft <= 7) {
        notifs.push({
          id: `exam-${exam.id}`,
          type: 'alert',
          title: `Examen: ${exam.subject}`,
          message: `Le ${new Date(exam.date).toLocaleDateString()} (${exam.startTime})`,
          linkTo: 'DS',
          timestamp: new Date(exam.date)
        });
      }
    });

    // 2. New Announcements (Info)
    filteredAnnouncements.forEach(ann => {
      const hoursAgo = differenceInHours(new Date(), new Date(ann.date));
      if (hoursAgo >= 0 && hoursAgo <= 48) {
        notifs.push({
          id: `ann-${ann.id}`,
          type: 'info',
          title: ann.isUrgent ? `URGENT: ${ann.title}` : `Annonce: ${ann.title}`,
          message: ann.subject,
          linkTo: 'INFOS',
          timestamp: new Date(ann.date)
        });
      }
    });

    // 3. New Polls (Success)
    filteredPolls.forEach(poll => {
       const hoursAgo = differenceInHours(new Date(), new Date(poll.createdAt));
       // Check if user has NOT voted yet
       const hasVoted = poll.userVotes && poll.userVotes[currentUser.id];
       if (hoursAgo >= 0 && hoursAgo <= 48 && !hasVoted) {
         notifs.push({
           id: `poll-${poll.id}`,
           type: 'success',
           title: "Nouveau sondage",
           message: poll.title,
           linkTo: 'POLLS',
           timestamp: new Date(poll.createdAt)
         });
       }
    });

    return notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [filteredExams, filteredAnnouncements, filteredPolls, currentUser]);

  // --- STATS ---
  const stats = useMemo(() => ({
    students: users.filter(u => u.role === UserRole.ELEVE).length,
    exams: filteredExams.filter(e => new Date(e.date) >= new Date()).length,
    polls: filteredPolls.length,
    resources: filteredResources.length
  }), [users, filteredExams, filteredPolls, filteredResources]);

  const upcomingExam = useMemo(() => {
    const futureExams = filteredExams.filter(e => new Date(e.date) >= new Date());
    return futureExams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [filteredExams]);

  const latestAnnouncement = useMemo(() => {
    return [...filteredAnnouncements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [filteredAnnouncements]);

  const activePoll = useMemo(() => {
    return filteredPolls.find(p => !p.userVotes || !p.userVotes[currentUser?.id || '']);
  }, [filteredPolls, currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center animate-pulse">
           <Loader2 size={48} className="text-indigo-600 animate-spin mx-auto mb-4" />
           <p className="text-slate-500 font-medium">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
         <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-red-100 text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Erreur de Connexion</h2>
            <p className="text-slate-600 mb-6">{dbError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Réessayer
            </button>
         </div>
       </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} logoUrl={schoolSettings.logoUrl} />;
  }

  return (
    <Layout 
      currentUser={currentUser} 
      currentView={currentView} 
      onChangeView={changeView}
      onNavigateBack={navigateBack}
      onLogout={handleLogout}
      notifications={notifications}
      schoolName={schoolSettings.schoolName}
      logoUrl={schoolSettings.logoUrl}
    >
      {currentView === 'DASHBOARD' && (
        <Dashboard 
          currentUser={currentUser}
          stats={stats}
          upcomingExam={upcomingExam}
          activePoll={activePoll}
          latestAnnouncement={latestAnnouncement}
          notifications={notifications}
          onChangeView={changeView}
          onRefresh={fetchData}
        />
      )}
      {currentView === 'INFOS' && (
        <InfoBoard 
          currentUser={currentUser} 
          announcements={filteredAnnouncements} 
          classGroups={classGroups}
          onAdd={addAnnouncement}
          onUpdate={updateAnnouncement}
          onDelete={deleteAnnouncement}
        />
      )}
      {currentView === 'DS' && (
        <ExamSchedule 
          currentUser={currentUser} 
          exams={filteredExams} 
          classGroups={classGroups}
          onAdd={addExam}
          onUpdate={updateExam}
          onDelete={deleteExam}
        />
      )}
      {currentView === 'POLLS' && (
        <Polls 
          currentUser={currentUser} 
          polls={filteredPolls} 
          classGroups={classGroups}
          onAdd={addPoll}
          onUpdate={updatePoll}
          onVote={votePoll}
          onDelete={deletePoll}
        />
      )}
      {currentView === 'RESOURCES' && (
        <Resources
          currentUser={currentUser}
          resources={filteredResources}
          classGroups={classGroups}
          onAdd={addResource}
          onUpdate={updateResource}
          onDelete={deleteResource}
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
           onNavigateToUsers={() => changeView('USERS')}
        />
      )}
    </Layout>
  );
};

export default App;

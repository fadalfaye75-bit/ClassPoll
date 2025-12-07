import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, AlertCircle, ShieldCheck, ArrowLeft, Send } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, pass: string) => boolean;
  logoUrl?: string;
}

type AuthView = 'LOGIN' | 'FORGOT_PASSWORD';

export const Login: React.FC<LoginProps> = ({ onLogin, logoUrl }) => {
  const [view, setView] = useState<AuthView>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(email, password);
    if (!success) {
      setError('Identifiants incorrects. Veuillez réessayer.');
    } else {
      setError('');
    }
  };

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setResetSent(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8 space-y-8 animate-fade-in relative z-10">
        
        <div className="text-center">
          {logoUrl ? (
            <div className="mx-auto h-20 w-auto flex items-center justify-center mb-6 drop-shadow-sm">
               <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 transform rotate-3 hover:rotate-6 transition-transform">
               <GraduationCap className="text-white h-8 w-8" />
            </div>
          )}
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">ClassPoll+</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">Votre espace numérique d'apprentissage</p>
        </div>

        {view === 'LOGIN' ? (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white text-slate-900 text-sm placeholder-slate-400 transition-all outline-none font-medium"
                    placeholder="nom@ecole.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mot de passe</label>
                  <button 
                    type="button" 
                    onClick={() => { setView('FORGOT_PASSWORD'); setError(''); }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Oublié ?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white text-slate-900 text-sm placeholder-slate-400 transition-all outline-none font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 border border-red-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Se connecter
            </button>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
             {!resetSent ? (
               <>
                 <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Réinitialisation</h3>
                    <p className="text-sm text-slate-500 mt-1">Entrez votre email pour recevoir le lien.</p>
                 </div>
                 <form onSubmit={handleResetRequest} className="space-y-5">
                    <div>
                      <label htmlFor="reset-email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                          type="email"
                          id="reset-email"
                          className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white text-slate-900 text-sm placeholder-slate-400 transition-all outline-none font-medium"
                          placeholder="nom@ecole.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                      <Send size={18} />
                      Envoyer le lien
                    </button>
                 </form>
               </>
             ) : (
               <div className="text-center py-8 bg-green-50 rounded-2xl border border-green-100 animate-in zoom-in-95">
                  <div className="mx-auto h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 shadow-inner">
                    <Send size={28} />
                  </div>
                  <h3 className="text-green-800 font-bold text-lg">Email envoyé !</h3>
                  <p className="text-green-700 text-sm mt-2 px-6 font-medium">
                    Vérifiez votre boîte de réception pour <strong>{email}</strong>.
                  </p>
               </div>
             )}

             <button 
                onClick={() => { setView('LOGIN'); setResetSent(false); }}
                className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-bold transition-colors mt-4 py-2 hover:bg-slate-50 rounded-lg"
             >
               <ArrowLeft size={16} />
               Retour à la connexion
             </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center space-x-2 text-slate-400">
           <ShieldCheck size={14} />
           <span className="text-[10px] uppercase font-bold tracking-widest">Connexion sécurisée SSL</span>
        </div>
      </div>
    </div>
  );
};
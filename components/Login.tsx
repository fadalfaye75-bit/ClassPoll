import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, AlertCircle, ShieldCheck, ArrowLeft, Send } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, pass: string) => boolean;
}

type AuthView = 'LOGIN' | 'FORGOT_PASSWORD';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
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
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 space-y-8 animate-fade-in relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="text-center relative z-10">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 rotate-3 transform transition-transform hover:rotate-6">
            <GraduationCap className="text-white h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">ClassPoll+</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">Votre Espace Numérique de Travail</p>
        </div>

        {view === 'LOGIN' ? (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 text-sm font-medium placeholder-slate-400 transition-all outline-none"
                    placeholder="nom@ecole.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mot de passe</label>
                  <button 
                    type="button" 
                    onClick={() => { setView('FORGOT_PASSWORD'); setError(''); }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Oublié ?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 text-sm font-medium placeholder-slate-400 transition-all outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50/80 p-4 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-0.5"
            >
              Se connecter
            </button>
          </form>
        ) : (
          <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-left-4">
             {!resetSent ? (
               <>
                 <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Réinitialisation</h3>
                    <p className="text-sm text-slate-500 mt-1">Nous vous enverrons un lien sécurisé.</p>
                 </div>
                 <form onSubmit={handleResetRequest} className="space-y-5">
                    <div>
                      <label htmlFor="reset-email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                          type="email"
                          id="reset-email"
                          className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 text-sm font-medium placeholder-slate-400 transition-all outline-none"
                          placeholder="nom@ecole.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:-translate-y-0.5"
                    >
                      <Send size={18} />
                      Envoyer le lien
                    </button>
                 </form>
               </>
             ) : (
               <div className="text-center py-6 bg-green-50/50 rounded-2xl border border-green-100 animate-in zoom-in-95">
                  <div className="mx-auto h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 shadow-sm">
                    <Send size={24} />
                  </div>
                  <h3 className="text-green-800 font-bold text-lg">Email envoyé !</h3>
                  <p className="text-green-700 text-sm mt-2 px-6 leading-relaxed">
                    Vérifiez votre boîte de réception pour <strong>{email}</strong>.
                  </p>
               </div>
             )}

             <button 
                onClick={() => { setView('LOGIN'); setResetSent(false); }}
                className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-bold transition-colors mt-4 py-2"
             >
               <ArrowLeft size={16} />
               Retour
             </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center space-x-2 text-slate-400">
           <ShieldCheck size={14} />
           <span className="text-[10px] uppercase font-bold tracking-wider">Sécurité SSL garantie</span>
        </div>
      </div>
    </div>
  );
};
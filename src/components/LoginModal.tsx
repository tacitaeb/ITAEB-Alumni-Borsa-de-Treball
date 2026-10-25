import React, { useState } from 'react';
import { Lock, UserCheck, AlertCircle, X, ExternalLink, Mail, Eye, EyeOff, KeyRound } from 'lucide-react';
import { UserSession, AlumniRecord } from '../types';
import { authenticateWithCredentials } from '../utils/jobData';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onGoToRegistration: () => void;
  registeredAlumni: AlumniRecord[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onGoToRegistration,
  registeredAlumni,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = authenticateWithCredentials(email, password, registeredAlumni);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setErrorMsg(result.reason || "Correu o contrasenya incorrectes.");
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    const result = authenticateWithCredentials(demoEmail, demoPass, registeredAlumni);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          aria-label="Tancar finestra d'identificació"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-sky-100 text-sky-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Accés Exclusiu Alumni ITAEB
          </h3>
          <p className="text-xs text-slate-600">
            Introdueix el teu correu electrònic personal (el que vas afegir al formulari d'alta) i la teva contrasenya.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Correu electrònic:
              </label>
              <span className="text-[11px] text-amber-700 font-medium">
                (No pot ser @itaeb.cat)
              </span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ex: marc.martinez@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contrasenya:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="La teva contrasenya de la borsa"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={showPassword ? 'Amagar contrasenya' : 'Mostrar contrasenya'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToRegistration();
                  }}
                  className="font-bold underline text-rose-900 hover:text-rose-950 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Donar-se d'alta a la Borsa de Treball (Formulari oficial)</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
          >
            Entrar a la Borsa de Treball
          </button>
        </form>

        {/* Quick demo credentials */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Comptes d'alumni registrats de prova:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('marc.martinez@gmail.com', 'itaeb2024')}
              className="p-2 text-left bg-slate-50 hover:bg-sky-50 border border-slate-200 rounded-lg transition cursor-pointer"
            >
              <div className="font-semibold text-slate-900 truncate">Marc Martínez</div>
              <div className="text-[10px] text-slate-500 truncate">marc.martinez@gmail.com</div>
              <div className="text-[10px] text-sky-700 font-mono">Clau: itaeb2024</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('laura.vila@gmail.com', 'itaeb2023')}
              className="p-2 text-left bg-slate-50 hover:bg-sky-50 border border-slate-200 rounded-lg transition cursor-pointer"
            >
              <div className="font-semibold text-slate-900 truncate">Laura Vila</div>
              <div className="text-[10px] text-slate-500 truncate">laura.vila@gmail.com</div>
              <div className="text-[10px] text-sky-700 font-mono">Clau: itaeb2023</div>
            </button>
          </div>
        </div>

        {/* Registration CTA */}
        <div className="bg-slate-50 p-3 rounded-xl text-center text-xs text-slate-600">
          Encara no t'has inscrit a la Borsa?{' '}
          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToRegistration();
            }}
            className="font-bold text-sky-700 hover:underline cursor-pointer"
          >
            Inscriu-te aquí
          </button>
        </div>
      </div>
    </div>
  );
};

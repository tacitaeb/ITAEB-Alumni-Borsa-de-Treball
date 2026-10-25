import React, { useState } from 'react';
import { Lock, UserCheck, AlertCircle, X, ExternalLink, Mail, CheckCircle2, Shield } from 'lucide-react';
import { UserSession } from '../types';
import { authenticateAlumniUser, OFFICIAL_REGISTRY_SAMPLE, OFFICIAL_FORMS } from '../utils/jobData';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onGoToRegistration: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onGoToRegistration,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = authenticateAlumniUser(identifier, OFFICIAL_REGISTRY_SAMPLE);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setErrorMsg(result.reason || "No s'ha pogut verificar el document.");
    }
  };

  const handleQuickDemoAlumni = (dni: string) => {
    setIdentifier(dni);
    const result = authenticateAlumniUser(dni, OFFICIAL_REGISTRY_SAMPLE);
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
            Introdueix el teu <strong>DNI / NIE</strong> d'exalumne o el teu correu institucional per consultar les ofertes de treball.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              DNI o Correu d'alumni:
            </label>
            <input
              type="text"
              required
              autoFocus
              value={identifier}
              onChange={e => {
                setIdentifier(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Ex: 47812903K o alumne@itaeb.cat"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
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
                  <span>Donar-se d'alta com a Alumni (Formulari oficial)</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
          >
            Accedir a les Ofertes
          </button>
        </form>

        {/* Demo profiles quick helper */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Alumni registrats de prova:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoAlumni('47812903K')}
              className="p-2 text-left bg-slate-50 hover:bg-sky-50 border border-slate-200 rounded-lg transition cursor-pointer"
            >
              <div className="font-semibold text-slate-900">Marc Martínez</div>
              <div className="text-[10px] text-slate-500">DNI: 47812903K (Il·luminació)</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoAlumni('39482104P')}
              className="p-2 text-left bg-slate-50 hover:bg-sky-50 border border-slate-200 rounded-lg transition cursor-pointer"
            >
              <div className="font-semibold text-slate-900">Laura Vila</div>
              <div className="text-[10px] text-slate-500">DNI: 39482104P (So)</div>
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

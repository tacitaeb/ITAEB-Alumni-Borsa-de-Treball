import React, { useState } from 'react';
import { ShieldAlert, ExternalLink, Mail, CheckCircle, ArrowRight, Lock, AlertCircle, KeyRound } from 'lucide-react';
import { OFFICIAL_FORMS, OFFICIAL_EMAILS, authenticateAlumniUser, OFFICIAL_REGISTRY_SAMPLE } from '../utils/jobData';
import { UserSession } from '../types';

interface AccessDeniedProps {
  onLoginSuccess: (session: UserSession) => void;
  onGoToAlumniInfo: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  onLoginSuccess,
  onGoToAlumniInfo,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const result = authenticateAlumniUser(identifier, OFFICIAL_REGISTRY_SAMPLE);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setLoginError(result.reason || "DNI o correu no trobat al registre oficial.");
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Warning Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 sm:p-8 text-white text-center sm:text-left flex flex-col sm:flex-row items-center gap-5 border-b border-rose-900/50">
          <div className="p-3.5 bg-rose-500/20 text-rose-300 rounded-2xl shrink-0 border border-rose-500/30">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
              Accés Restringit a la Borsa
            </span>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight">
              Només per a membres de alumni@itaeb.cat
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Les ofertes de treball estan reservades exclusivament als exalumnes titulats de l'ITAEB donats d'alta.
            </p>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Direct Login Box for registered alumni */}
          <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-sky-700" />
              <h3 className="font-bold text-slate-900 text-sm">
                Ja ets Alumni de l'ITAEB? Identifica't per entrar
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Introdueix el teu DNI/NIE o correu electrònic oficial per desbloquejar les ofertes de treball:
            </p>

            <form onSubmit={handleQuickLogin} className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                required
                value={identifier}
                onChange={e => {
                  setIdentifier(e.target.value);
                  if (loginError) setLoginError(null);
                }}
                placeholder="El teu DNI (ex: 47812903K) o correu"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-xs cursor-pointer shrink-0"
              >
                Accedir a la Borsa
              </button>
            </form>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}
          </div>

          {/* Action steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Nou a la Borsa?
                </span>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                  Inscriu-te al Formulari d'Alta
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  Omple el formulari oficial amb el teu DNI i Especialitat per ser verificat i afegit a <code className="text-sky-700 font-semibold">alumni@itaeb.cat</code>.
                </p>
              </div>
              <a
                href={OFFICIAL_FORMS.altaExalumnes}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
              >
                <span>Formulari oficial d'alta</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Promocions antigues
                </span>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                  Verificació manual
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  Si no consta el teu expedient a la base digital, el coordinador d'Estada a l'Empresa t'activarà manualment.
                </p>
              </div>
              <a
                href={`mailto:${OFFICIAL_EMAILS.avisosAdmin}?subject=Sol·licitud%20alta%20alumni%20ITAEB`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-xs"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Contactar empresa@itaeb.cat</span>
              </a>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onGoToAlumniInfo}
              className="text-xs font-medium text-sky-700 hover:text-sky-900 underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Llegir la guia completa de funcionament per als alumni</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

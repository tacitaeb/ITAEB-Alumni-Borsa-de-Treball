import React, { useState } from 'react';
import { ExternalLink, Mail, ArrowRight, Lock, AlertCircle, KeyRound, Eye, EyeOff, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { OFFICIAL_FORMS, OFFICIAL_EMAILS } from '../utils/jobData';
import { UserSession, AlumniRecord } from '../types';
import { authenticateAgainstGoogleSheet, getStoredSheetConfig } from '../utils/googleSheetsSync';

interface AccessDeniedProps {
  onLoginSuccess: (session: UserSession) => void;
  onGoToAlumniInfo: () => void;
  registeredAlumni: AlumniRecord[];
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  onLoginSuccess,
  onGoToAlumniInfo,
  registeredAlumni,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const sheetConfig = getStoredSheetConfig();

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsVerifying(true);

    try {
      const result = await authenticateAgainstGoogleSheet(email, password, registeredAlumni);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setLoginError(result.reason || "Correu electrònic o contrasenya no vàlids al full de càlcul.");
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Error durant la verificació');
    } finally {
      setIsVerifying(false);
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
              Les ofertes de feina estan reservades exclusivament als exalumnes registrats al full de càlcul <strong>"ITAEB Borsa de Treball"</strong> (fulla <strong>Exalumnes</strong>).
            </p>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Direct Login Box with email and password */}
          <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Ja ets Alumni de l'ITAEB? Identifica't per entrar
                </h3>
              </div>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
                Fulla: {sheetConfig.sheetName || 'Exalumnes'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Introdueix el teu correu electrònic personal (el que vas posar al formulari d'alta) i la teva contrasenya:
            </p>

            <form onSubmit={handleQuickLogin} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Correu electrònic personal:
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isVerifying}
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="nom.cognom@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Contrasenya:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={isVerifying}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (loginError) setLoginError(null);
                      }}
                      placeholder="Contrasenya de registre"
                      className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      aria-label={showPassword ? 'Amagar contrasenya' : 'Mostrar contrasenya'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-75 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verificant a Google Sheets...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Accedir a la Borsa</span>
                    </>
                  )}
                </button>
              </div>
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
                  Omple el formulari d'alta amb el teu correu personal (no @itaeb.cat), contrasenya, DNI i especialitat per ser afegit al full "Exalumnes" i a <code className="text-sky-700 font-semibold">alumni@itaeb.cat</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={onGoToAlumniInfo}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs cursor-pointer"
              >
                <span>Veure formulari i instruccions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
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
                  Si no consta el teu expedient a la base digital, el coordinador d'Estada a l'Empresa t'activarà manualment al full i al grup.
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
        </div>
      </div>
    </div>
  );
};

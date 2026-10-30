import React, { useState, useEffect } from 'react';
import {
  Lock,
  UserCheck,
  AlertCircle,
  X,
  ExternalLink,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Settings2,
  ShieldCheck
} from 'lucide-react';
import { UserSession, AlumniRecord } from '../types';
import {
  authenticateAgainstGoogleSheet,
  getStoredSheetConfig,
  saveStoredSheetConfig,
  syncAlumniFromGoogleSheet,
  GoogleSheetConfig,
  extractSpreadsheetId
} from '../utils/googleSheetsSync';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onGoToRegistration: () => void;
  registeredAlumni: AlumniRecord[];
  onAlumniSynced?: (alumni: AlumniRecord[]) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onGoToRegistration,
  registeredAlumni,
  onAlumniSynced,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Sheet configuration drawer / inline settings
  const [showSheetConfig, setShowSheetConfig] = useState(false);
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>(getStoredSheetConfig);
  const [tempSheetUrl, setTempSheetUrl] = useState('');
  const [tempSheetTab, setTempSheetTab] = useState('Exalumnes');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSheetConfig();
      setSheetConfig(config);
      setTempSheetUrl(config.spreadsheetUrlOrId || '');
      setTempSheetTab(config.sheetName || 'Exalumnes');
      setErrorMsg(null);
      setVerificationFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setVerificationFeedback(null);
    setIsVerifying(true);

    try {
      const result = await authenticateAgainstGoogleSheet(email, password, registeredAlumni);

      if (result.success && result.user) {
        setVerificationFeedback(
          result.source === 'google_sheets_live' || result.source === 'google_sheets_synced'
            ? `Credencials validades amb la fulla "${sheetConfig.sheetName || 'Exalumnes'}" del full de càlcul!`
            : 'Accés validat correctament.'
        );

        setTimeout(() => {
          onLoginSuccess(result.user!);
          onClose();
        }, 350);
      } else {
        if (result.notConfigured) {
          setShowSheetConfig(true);
        }
        setErrorMsg(result.reason || "Correu electrònic o contrasenya incorrectes a la fulla Exalumnes.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperat durant la verificació');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveAndSyncSheet = async () => {
    if (!tempSheetUrl.trim()) {
      setSyncMsg({ text: 'Si us plau, enganxa un enllaç o ID del full de càlcul.', isError: true });
      return;
    }

    setIsSyncing(true);
    setSyncMsg(null);

    try {
      const res = await syncAlumniFromGoogleSheet(tempSheetUrl.trim(), tempSheetTab.trim() || 'Exalumnes');
      setSheetConfig(res.config);

      if (res.success) {
        setSyncMsg({ text: res.message, isError: false });
        if (onAlumniSynced && res.alumni.length > 0) {
          onAlumniSynced(res.alumni);
        }
      } else {
        setSyncMsg({ text: res.message, isError: true });
      }
    } catch (err) {
      setSyncMsg({
        text: err instanceof Error ? err.message : 'Error de sincronització amb Google Sheets',
        isError: true,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const isSheetConnected = sheetConfig.spreadsheetUrlOrId && sheetConfig.lastSyncStatus === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          aria-label="Tancar finestra d'identificació"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-sky-100 text-sky-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Accés Exclusiu Alumni ITAEB
          </h3>
          <p className="text-xs text-slate-600">
            Verificació en temps real contra el full de càlcul <strong>"ITAEB Borsa de Treball"</strong> (fulla <strong>Exalumnes</strong>).
          </p>
        </div>

        {/* Google Sheets Status Badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isSheetConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div className="truncate">
              <span className="font-semibold text-slate-800 block truncate">
                Fulla: {sheetConfig.sheetName || 'Exalumnes'}
              </span>
              <span className="text-[11px] text-slate-500 block truncate">
                {isSheetConnected
                  ? `Sincronitzat amb Google Sheets (${sheetConfig.totalAlumniInSheet} alumnes)`
                  : 'Validació mitjançant el registre de la borsa'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSheetConfig(!showSheetConfig)}
            className="shrink-0 px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:text-sky-800 hover:bg-sky-50 rounded-lg border border-sky-200 transition cursor-pointer flex items-center gap-1"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{showSheetConfig ? 'Tancar config' : 'Configurar Google Sheet'}</span>
          </button>
        </div>

        {/* Google Sheet Configuration Drawer */}
        {showSheetConfig && (
          <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 space-y-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-sky-700" />
                <span>Enllaç del full "ITAEB Borsa de Treball"</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Copia l'enllaç del full de càlcul de Google Drive (amb permís "Qualsevol persona amb l'enllaç pot veure") i comprova la fulla <strong>Exalumnes</strong>.
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  URL o ID del Google Spreadsheet:
                </label>
                <input
                  type="text"
                  value={tempSheetUrl}
                  onChange={e => setTempSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nom exacte de la pestanya/fulla:
                </label>
                <input
                  type="text"
                  value={tempSheetTab}
                  onChange={e => setTempSheetTab(e.target.value)}
                  placeholder="Exalumnes"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {syncMsg && (
                <div
                  className={`p-2 rounded-lg text-[11px] flex items-start gap-1.5 ${
                    syncMsg.isError
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {syncMsg.isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                  <span>{syncMsg.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleSaveAndSyncSheet}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Connectant amb Google Sheets...' : 'Sincronitzar ara'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Correu electrònic:
              </label>
              <span className="text-[11px] text-amber-700 font-medium">
                (Personal, no @itaeb.cat)
              </span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoFocus
                disabled={isVerifying}
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="nom.cognom@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-50"
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
                disabled={isVerifying}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="La teva contrasenya de registre"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label={showPassword ? 'Amagar contrasenya' : 'Mostrar contrasenya'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Feedback & Error states */}
          {verificationFeedback && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{verificationFeedback}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
              <div className="pt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToRegistration();
                  }}
                  className="font-bold underline text-rose-900 hover:text-rose-950 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Omplir formulari d'alta oficial a la Borsa</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-75 text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verificant a Google Sheets (Exalumnes)...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Entrar a la Borsa de Treball</span>
              </>
            )}
          </button>
        </form>

        {/* Registration CTA */}
        <div className="bg-slate-50 p-3 rounded-xl text-center text-xs text-slate-600">
          Encara no constes a la fulla Exalumnes de la Borsa?{' '}
          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToRegistration();
            }}
            className="font-bold text-sky-700 hover:underline cursor-pointer"
          >
            Donar-se d'alta al formulari
          </button>
        </div>
      </div>
    </div>
  );
};

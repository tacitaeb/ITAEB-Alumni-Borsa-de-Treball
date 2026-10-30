import React, { useState, useEffect } from 'react';
import { AlumniRecord, UserSession, PageId } from '../types';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  IdCard,
  GraduationCap,
  Sparkles,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Briefcase
} from 'lucide-react';
import { ALUMNI_FORM_SECTORS } from '../utils/jobData';
import { updateAlumniProfile } from '../utils/googleSheetsSync';

interface AlumniProfileViewProps {
  userSession: UserSession;
  registeredAlumni: AlumniRecord[];
  onUpdateUserSession: (session: UserSession) => void;
  onAlumniRecordUpdated: (updated: AlumniRecord) => void;
  onNavigate: (page: PageId) => void;
}

export const AlumniProfileView: React.FC<AlumniProfileViewProps> = ({
  userSession,
  registeredAlumni,
  onUpdateUserSession,
  onAlumniRecordUpdated,
  onNavigate,
}) => {
  // Find current alumni record
  const currentRecord = registeredAlumni.find(
    a => a.correu.trim().toLowerCase() === userSession.email.trim().toLowerCase()
  );

  const [nomCognoms, setNomCognoms] = useState(currentRecord?.nomCognoms || userSession.name);
  const [correu, setCorreu] = useState(currentRecord?.correu || userSession.email);
  const [contrasenya, setContrasenya] = useState(currentRecord?.contrasenya || '');
  const [dni, setDni] = useState(currentRecord?.dni || '');
  const [anyGraduacio, setAnyGraduacio] = useState(currentRecord?.anyGraduacio || '2024');
  const [especialitat, setEspecialitat] = useState(
    currentRecord?.especialitat || "Il·luminació, captació i tractament d'imatge"
  );
  const [sectorsInteres, setSectorsInteres] = useState<string[]>(
    currentRecord?.sectorsInteres || ["Il·luminació per arts escèniques"]
  );
  const [notificacionsCorreu, setNotificacionsCorreu] = useState(
    currentRecord?.notificacionsCorreu ?? true
  );

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (currentRecord) {
      setNomCognoms(currentRecord.nomCognoms);
      setCorreu(currentRecord.correu);
      setContrasenya(currentRecord.contrasenya || '');
      setDni(currentRecord.dni);
      setAnyGraduacio(currentRecord.anyGraduacio);
      setEspecialitat(currentRecord.especialitat);
      setSectorsInteres(currentRecord.sectorsInteres || []);
      setNotificacionsCorreu(currentRecord.notificacionsCorreu);
    }
  }, [currentRecord]);

  const toggleSector = (sector: string) => {
    setSectorsInteres(prev =>
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanEmail = correu.trim().toLowerCase();
    if (cleanEmail.endsWith('@itaeb.cat')) {
      setFeedback({
        success: false,
        message: "El correu de contacte no pot ser del domini @itaeb.cat. Ha de ser el teu correu personal.",
      });
      return;
    }

    if (!contrasenya || contrasenya.trim().length < 4) {
      setFeedback({
        success: false,
        message: 'La contrasenya ha de tenir com a mínim 4 caràcters.',
      });
      return;
    }

    if (sectorsInteres.length === 0) {
      setFeedback({
        success: false,
        message: "Selecciona com a mínim un sector d'interès per rebre ofertes afins.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const res = await updateAlumniProfile(userSession.email, {
        nomCognoms: nomCognoms.trim(),
        correu: cleanEmail,
        contrasenya: contrasenya.trim(),
        dni: dni.trim().toUpperCase(),
        anyGraduacio: anyGraduacio.trim(),
        especialitat: especialitat.trim(),
        sectorsInteres,
        notificacionsCorreu,
      });

      if (res.success && res.updatedRecord) {
        setFeedback({ success: true, message: res.message });
        onAlumniRecordUpdated(res.updatedRecord);
        onUpdateUserSession({
          ...userSession,
          name: res.updatedRecord.nomCognoms,
          email: res.updatedRecord.correu,
        });
      } else {
        setFeedback({ success: false, message: res.message });
      }
    } catch (err) {
      setFeedback({
        success: false,
        message: err instanceof Error ? err.message : 'Error inesperat en desar les dades.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb / Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('ofertes')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tornar a les ofertes</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Estat: Verificat (Accés actiu)</span>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-sky-500/20 text-sky-200 border border-sky-400/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Gestió del Compte Alumni
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            El teu perfil a la Borsa de Treball
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Aquí pots actualitzar les teves dades personals, contrasenya d'accés, correu de contacte i sectors preferits per rebre ofertes.
          </p>
        </div>
      </div>

      {/* Main Edit Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-xs">
        {/* Banner Informatiu sobre el camp Verificat */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-slate-900 block">
              Camp "Verificat" protegit oficialment
            </span>
            <p className="text-slate-600 leading-relaxed">
              Pots modificar qualsevol dada del teu registre (nom, correu personal, contrasenya, estudis i sectors d'interès). 
              L'estat de validació acadèmica <strong>(Verificat = SÍ)</strong> es manté sempre actiu i no és editable per l'usuari per garantir la seguretat del registre.
            </p>
          </div>
        </div>

        {/* Secció 1: Dades d'accés i personals */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-sky-800 flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>1. Dades d'accés i contacte</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom i Cognoms:
              </label>
              <input
                type="text"
                required
                value={nomCognoms}
                onChange={e => setNomCognoms(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                DNI / NIE:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={dni}
                  onChange={e => setDni(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-mono uppercase"
                />
                <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-mono">
                  Oficial
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correu electrònic personal (Login i notificacions):
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={correu}
                  onChange={e => setCorreu(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                No pot ser @itaeb.cat. Ha de ser Gmail, Outlook, iCloud, etc.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contrasenya d'accés a la Borsa:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={contrasenya}
                  onChange={e => setContrasenya(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Mínim 4 caràcters. Es guardarà a la teva fila de la borsa.
              </span>
            </div>
          </div>
        </div>

        {/* Secció 2: Dades Acadèmiques */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-sky-800 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span>2. Especialitat i Promoció</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Especialitat cursada a l'ITAEB:
              </label>
              <select
                value={especialitat}
                onChange={e => setEspecialitat(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              >
                <option value="Il·luminació, captació i tractament d'imatge">
                  Il·luminació, captació i tractament d'imatge
                </option>
                <option value="Sonorització per a arts escèniques i espectacles">
                  Sonorització per a arts escèniques i espectacles
                </option>
                <option value="Realització de projectes d'audiovisuals i espectacles">
                  Realització de projectes d'audiovisuals i espectacles
                </option>
                <option value="Producció d'audiovisuals i espectacles">
                  Producció d'audiovisuals i espectacles
                </option>
                <option value="Animacions 3D, jocs i entorns interactius">
                  Animacions 3D, jocs i entorns interactius
                </option>
                <option value="Maquinària escènica i tecnologia de l'espectacle">
                  Maquinària escènica i tecnologia de l'espectacle
                </option>
                <option value="Tècniques de l'Espectacle en Viu (Especialitats combinades)">
                  Tècniques de l'Espectacle en Viu (Especialitats combinades)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Any de graduació:
              </label>
              <input
                type="text"
                required
                value={anyGraduacio}
                onChange={e => setAnyGraduacio(e.target.value)}
                placeholder="2024"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Secció 3: Sectors d'Interès i alertes */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-sky-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>3. Sectors d'interès per rebre ofertes</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona els àmbits en què t'interessa rebre oportunitats laborals:
              </p>
            </div>

            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200 shrink-0">
              {sectorsInteres.length} seleccionats
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {ALUMNI_FORM_SECTORS.map(sec => {
              const checked = sectorsInteres.includes(sec);
              return (
                <button
                  type="button"
                  key={sec}
                  onClick={() => toggleSector(sec)}
                  className={`p-2.5 rounded-xl text-xs font-medium text-left border transition flex items-center justify-between gap-2 cursor-pointer ${
                    checked
                      ? 'bg-sky-50 border-sky-500 text-sky-950 font-semibold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{sec}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      checked
                        ? 'bg-sky-600 border-sky-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {checked && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Notificacions */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <BellRing className="w-4 h-4 text-sky-700" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Rebre notificacions per correu de noves ofertes coincidents
                </span>
                <span className="text-[11px] text-slate-500">
                  L'ITAEB t'enviarà un correu automàtic quan es publiqui una oferta d'aquests sectors.
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notificacionsCorreu}
                onChange={e => setNotificacionsCorreu(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
              feedback.success
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border border-rose-300 text-rose-950'
            }`}
          >
            {feedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => onNavigate('ofertes')}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Cancel·lar canvis
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardant canvis...' : 'Desar canvis al perfil'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

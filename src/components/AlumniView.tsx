import React, { useState } from 'react';
import { PageId, AlumniRecord, UserSession } from '../types';
import {
  GraduationCap,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Mail,
  Send,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  BellRing
} from 'lucide-react';
import {
  OFFICIAL_FORMS,
  OFFICIAL_EMAILS,
  OFFICIAL_REGISTRY_SAMPLE,
  ALUMNI_FORM_SECTORS,
  registerNewAlumni,
  verifyAlumniAgainstRegistry
} from '../utils/jobData';

interface AlumniViewProps {
  onNavigate: (page: PageId) => void;
  onRegisterAlumni: (record: AlumniRecord) => void;
  onLoginDirect: (session: UserSession) => void;
}

export const AlumniView: React.FC<AlumniViewProps> = ({
  onNavigate,
  onRegisterAlumni,
  onLoginDirect,
}) => {
  // Registration Form State
  const [nomCognoms, setNomCognoms] = useState('');
  const [dni, setDni] = useState('');
  const [correu, setCorreu] = useState('');
  const [contrasenya, setContrasenya] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [anyGraduacio, setAnyGraduacio] = useState('2024');
  const [especialitat, setEspecialitat] = useState("Il·luminació, captació i tractament d'imatge");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([
    "Il·luminació per arts escèniques",
    "Sonorització per arts escèniques"
  ]);
  const [notificacionsCorreu, setNotificacionsCorreu] = useState(true);

  // Form submission feedback
  const [regResult, setRegResult] = useState<{
    submitted: boolean;
    success: boolean;
    autoAddedToGroup?: boolean;
    message?: string;
    record?: AlumniRecord;
  } | null>(null);

  const toggleSector = (sec: string) => {
    setSelectedSectors(prev =>
      prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]
    );
  };

  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setRegResult(null);

    if (selectedSectors.length === 0) {
      setRegResult({
        submitted: true,
        success: false,
        message: "Has de seleccionar com a mínim un sector d'interès.",
      });
      return;
    }

    const res = registerNewAlumni(
      {
        nomCognoms,
        dni,
        correu,
        contrasenya,
        anyGraduacio,
        especialitat,
        sectorsInteres: selectedSectors,
        notificacionsCorreu,
      },
      OFFICIAL_REGISTRY_SAMPLE
    );

    if (!res.success) {
      setRegResult({
        submitted: true,
        success: false,
        message: res.reason,
      });
      return;
    }

    if (res.newRecord) {
      onRegisterAlumni(res.newRecord);
      setRegResult({
        submitted: true,
        success: true,
        autoAddedToGroup: res.autoAddedToGroup,
        record: res.newRecord,
        message: res.autoAddedToGroup
          ? `Alumni verificat oficialment! S'ha afegit una nova fila al full de càlcul "Exalumnes" i el correu ${res.newRecord.correu} s'ha incorporat al grup oficial alumni@itaeb.cat.`
          : `Registre guardat. Les dades del DNI o especialitat es revisaran manualment pel Coordinador d'Estada a l'Empresa (empresa@itaeb.cat) per afegir-te al grup alumni@itaeb.cat.`,
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8">
        <span className="text-xs font-bold text-sky-700 tracking-wider uppercase">
          Guia per a Graduats de l'ITAEB
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
          Com donar-se d'alta com a Alumni a la Borsa de Treball
        </h1>
        <p className="text-base text-slate-600 mt-3 max-w-3xl leading-relaxed">
          Si has finalitzat els teus estudis a l'ITAEB, tens dret a formar part de la nostra borsa d'ocupació oficial, rebre ofertes de feina filtrades pel teu perfil i accedir a la borsa en línia amb el teu correu personal i contrasenya.
        </p>

        {/* Warning Banner regarding personal email */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Important sobre el correu electrònic d'alta:</span>
            <span>
              Has d'escriure un correu electrònic personal (Gmail, Outlook, iCloud, etc.) que <strong>NO sigui @itaeb.cat</strong>. El compte institucional d'estudiant de l'ITAEB es dona de baixa en finalitzar els estudis. Aquest correu personal serà el que s'afegirà al grup de Google Workspace <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-sky-800">alumni@itaeb.cat</code> per donar-te accés a la borsa de treball.
            </span>
          </div>
        </div>
      </div>

      {/* The Official Form Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-lg space-y-8">
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Formulari d'Inscripció</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            ITAEB Borsa de Treball - Alta alumni
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            * Indica que la pregunta és obligatòria. Les dades s'incorporen automàticament al full "Exalumnes" de Google Sheets.
          </p>
        </div>

        {regResult && regResult.submitted && (
          <div
            className={`p-5 rounded-2xl border text-xs sm:text-sm flex flex-col gap-3 ${
              regResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-start gap-3">
              {regResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-bold block text-sm">
                  {regResult.success ? "Inscripció processada correctament" : "No s'ha pogut completar l'alta"}
                </span>
                <p className="leading-relaxed">{regResult.message}</p>
              </div>
            </div>

            {regResult.success && regResult.record && (
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onLoginDirect({
                      email: regResult.record!.correu,
                      name: regResult.record!.nomCognoms,
                      isMemberOfAlumniGroup: true,
                      role: 'alumni',
                    });
                    onNavigate('ofertes');
                  }}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Accedir ara mateix a les Ofertes de Treball</span>
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmitRegistration} className="space-y-6">
          {/* Nom i cognoms */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              Nom i cognoms <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={nomCognoms}
              onChange={e => setNomCognoms(e.target.value)}
              placeholder="Ex: Clara Navarro Pons"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* DNI */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              Número de DNI o document <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={dni}
              onChange={e => setDni(e.target.value)}
              placeholder="Ex: 53891023Z"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-[11px] text-slate-500">
              S'utilitza per verificar automàticament que has estat alumne/a de l'ITAEB.
            </p>
          </div>

          {/* Correu electrònic */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              Correu electrònic <span className="text-rose-600">*</span>
            </label>
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md inline-block mb-1">
              No pot ser @itaeb.cat
            </span>
            <input
              type="email"
              required
              value={correu}
              onChange={e => setCorreu(e.target.value)}
              placeholder="Ex: clara.navarro@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-[11px] text-slate-500">
              Aquest correu s'afegirà al grup <code className="text-slate-800 font-semibold">alumni@itaeb.cat</code> i serà el teu usuari d'accés a la borsa.
            </p>
          </div>

          {/* Contrasenya */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              Contrasenya <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={4}
                value={contrasenya}
                onChange={e => setContrasenya(e.target.value)}
                placeholder="Tria la teva contrasenya per entrar a la web"
                className="w-full px-4 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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
            <p className="text-[11px] text-slate-500">
              Amb aquest correu i aquesta contrasenya podràs iniciar sessió directament al web de la borsa de treball.
            </p>
          </div>

          {/* Any de graduació */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              Any de graduació <span className="text-rose-600">*</span>
            </label>
            <select
              value={anyGraduacio}
              onChange={e => setAnyGraduacio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="Abans de 2020">Abans de 2020</option>
            </select>
          </div>

          {/* Especialitat cursada */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              Especialitat cursada <span className="text-rose-600">*</span>
            </label>
            <select
              value={especialitat}
              onChange={e => setEspecialitat(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              <option value="Maquinària escènica i tecnologia de l'espectacle">
                Maquinària escènica i tecnologia de l'espectacle
              </option>
            </select>
          </div>

          {/* Sectors d'interès */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              Sectors d'interès <span className="text-rose-600">*</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Marca tots els àmbits dels quals vols rebre convocatòries:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALUMNI_FORM_SECTORS.map((sectorName, idx) => {
                const checked = selectedSectors.includes(sectorName);
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                      checked
                        ? 'bg-sky-50 border-sky-300 text-sky-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSector(sectorName)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                    />
                    <span>{sectorName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Notificacions per correu */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              Vols rebre notificacions de noves ofertes de treball per correu electrònic? <span className="text-rose-600">*</span>
            </label>
            <div className="flex gap-4 text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="notificacions"
                  checked={notificacionsCorreu === true}
                  onChange={() => setNotificacionsCorreu(true)}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span>Sí, vull rebre alertes d'ofertes coincidents</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="notificacions"
                  checked={notificacionsCorreu === false}
                  onChange={() => setNotificacionsCorreu(false)}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span>No, consultaré la web pel meu compte</span>
              </label>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
            <a
              href={OFFICIAL_FORMS.altaExalumnes}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-sky-700 hover:text-sky-900 font-semibold inline-flex items-center gap-1.5"
            >
              <span>Obrir formulari extern a Google Forms</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
            >
              Enviar Alta d'Alumni
            </button>
          </div>
        </form>
      </div>

      {/* 5-Step Process Timeline */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Com funciona el procés després d'enviar el formulari
        </h2>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex gap-4 items-start shadow-xs">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-sm">
              1
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-900 text-base">
                Registre al full "Exalumnes" de Google Sheets
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                El formulari afegeix automàticament una nova fila al full de càlcul de la Borsa de Treball amb el teu nom, DNI, el teu correu personal de contacte, contrasenya triada i sectors d'interès.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex gap-4 items-start shadow-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-sm">
              2
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-900 text-base">
                Afegit automàtic al grup de Google Workspace
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                En comprovar-se que el DNI i l'especialitat consten al registre acadèmic oficial, el teu correu personal s'afegeix directament al grup de Google <code className="text-sky-800 font-bold font-mono">alumni@itaeb.cat</code>.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex gap-4 items-start shadow-xs">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-sm">
              3
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-900 text-base">
                Accés immediat a la web amb el teu correu i contrasenya
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Ja no cal esperar: entres a la web de la borsa de treball, fas clic a <strong>"Accés Alumni"</strong>, escrius el teu correu personal i la contrasenya triada i tens accés complet a totes les convocatòries de feina.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

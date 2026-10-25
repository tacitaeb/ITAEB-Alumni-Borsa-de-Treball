import React, { useState } from 'react';
import { PageId } from '../types';
import {
  GraduationCap,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Mail,
  Send,
  Search,
  ArrowRight,
  ShieldAlert,
  BellRing
} from 'lucide-react';
import {
  OFFICIAL_FORMS,
  OFFICIAL_EMAILS,
  verifyAlumniAgainstRegistry,
  OFFICIAL_REGISTRY_SAMPLE
} from '../utils/jobData';

interface AlumniViewProps {
  onNavigate: (page: PageId) => void;
}

export const AlumniView: React.FC<AlumniViewProps> = ({ onNavigate }) => {
  // Test checker state
  const [testDni, setTestDni] = useState('');
  const [testSpecialty, setTestSpecialty] = useState("Il·luminació, captació i tractament d'imatge");
  const [checkResult, setCheckResult] = useState<{
    tested: boolean;
    verified: boolean;
    message?: string;
    studentName?: string;
  } | null>(null);

  const handleTestVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testDni.trim()) return;

    const res = verifyAlumniAgainstRegistry(testDni, testSpecialty, OFFICIAL_REGISTRY_SAMPLE);
    if (res.verified && res.match) {
      setCheckResult({
        tested: true,
        verified: true,
        studentName: `${res.match.nom} ${res.match.cognoms}`,
        message: `Exalumne verificat amb èxit! Pertany a l'expedient ${res.match.idalu} (${res.match.estudis}).`,
      });
    } else {
      setCheckResult({
        tested: true,
        verified: false,
        message: res.reason || 'No coincideix amb el registre oficial.',
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
          Si has finalitzat els teus estudis a l'ITAEB, tens dret a formar part de la nostra borsa d'ocupació oficial, rebre ofertes de feina filtrades pel teu perfil i accedir a la borsa en línia.
        </p>

        {/* Big Banner Button to Form */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a
            href={OFFICIAL_FORMS.altaExalumnes}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <span>Obrir Formulari Oficial d'Alta Exalumnes</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={() => onNavigate('ofertes')}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition cursor-pointer"
          >
            <span>Consultar Ofertes Vigents</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5-Step Process Timeline */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">
          El procés d'alta pas a pas
        </h2>

        <div className="space-y-4">
          {/* Pas 1 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex gap-4 items-start shadow-xs">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-sm">
              1
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-900 text-base">
                Omplir el formulari oficial d'inscripció
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Accedeix al formulari de Google i introdueix les teves dades: nom i cognoms, número de DNI/NIE, correu electrònic, any de graduació, especialitat cursada a l'ITAEB i els teus sectors d'interès.
              </p>
              <div className="pt-1">
                <a
                  href={OFFICIAL_FORMS.altaExalumnes}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1"
                >
                  <span>Anar al formulari oficial d'inscripció</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Pas 2 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex gap-4 items-start shadow-xs">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-sm">
              2
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-900 text-base">
                Verificació automàtica del teu expedient
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Quan s'envia el formulari, el sistema llegeix automàticament el teu <strong>DNI</strong> i l'<strong>Especialitat cursada</strong> i els cerca al full oficial <em>Llistat alumni ITAEB</em>.
              </p>
            </div>
          </div>

          {/* Pas 3 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex gap-4 items-start shadow-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-sm">
              3
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Quan ets verificat correctament</span>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                  Immediat
                </span>
              </h3>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>S'afegeix el teu correu automàticament al grup de Google <code className="text-sky-800 font-semibold">{OFFICIAL_EMAILS.grupGoogleAccés}</code>.</li>
                <li>Això et dona accés immediat al lloc web de la borsa de treball.</li>
                <li>Reps un correu oficial de benvinguda des de <code className="text-sky-800 font-semibold">{OFFICIAL_EMAILS.aliesRemitent}</code> amb les instruccions.</li>
              </ul>
            </div>
          </div>

          {/* Pas 4 */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex gap-4 items-start shadow-xs">
            <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center shrink-0 text-sm">
              4
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
                <span>Què passa si no es pot verificar automàticament?</span>
                <span className="text-[11px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                  Verificació manual
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Si hi ha algun error de format en el DNI o l'especialitat no coincideix exactament, el sistema envia un avís automàtic a <code className="font-semibold text-slate-900">{OFFICIAL_EMAILS.avisosAdmin}</code>. El <strong>Coordinador d’Estada a l’Empresa</strong> comprova manualment les teves dades a secretaria i t'afegeix manualment al grup per no deixar-te fora.
              </p>
            </div>
          </div>

          {/* Pas 5 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex gap-4 items-start shadow-xs">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0 text-sm">
              5
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BellRing className="w-4 h-4 text-sky-600" />
                <span>Notificacions automàtiques segons els teus sectors</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Si has marcat "Sí" a les notificacions per correu, cada vegada que una empresa publiqui una oferta d'un dels teus sectors d'interès (com Il·luminació o Sonorització), rebràs una alerta personalitzada a la teva bústia amb tots els detalls del lloc de treball.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Verification Tester */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <Search className="w-4 h-4" />
            <span>Simulador de Comprovació Oficial</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
            Comprova com valida el sistema el teu DNI i Especialitat
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Pots provar el funcionament del mecanisme de creuament del sistema. Per provar-ho pots emprar un DNI d'exemple del registre oficial com <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">47812903K</code> (Marc Martínez), <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">39482104P</code> (Laura Vila) o posar el teu.
          </p>
        </div>

        <form onSubmit={handleTestVerification} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              DNI o Document d'identitat
            </label>
            <input
              type="text"
              value={testDni}
              onChange={e => setTestDni(e.target.value)}
              placeholder="Ex: 47812903K"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Especialitat cursada a l'ITAEB
            </label>
            <select
              value={testSpecialty}
              onChange={e => setTestSpecialty(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
            >
              Comprovar
            </button>
          </div>
        </form>

        {checkResult && checkResult.tested && (
          <div
            className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-all ${
              checkResult.verified
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                : 'bg-rose-950/80 border-rose-700 text-rose-200'
            }`}
          >
            {checkResult.verified ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">
                {checkResult.verified ? 'Verificació correcta' : 'No verificat automàticament'}
              </div>
              <div className="mt-1 opacity-90">{checkResult.message}</div>
              {checkResult.verified && (
                <div className="mt-2 text-[11px] text-emerald-300">
                  Acció del sistema: S'afegeix automàticament al grup Google <strong>{OFFICIAL_EMAILS.grupGoogleAccés}</strong> i s'envia benvinguda des de <strong>{OFFICIAL_EMAILS.aliesRemitent}</strong>.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Motius habituals per a la no verificació */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-600" />
          <span>Motius habituals per a la no verificació automàtica</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Si no has rebut la confirmació en 24h, sol deure's a un d'aquests motius habituals:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-semibold text-xs text-slate-900 mb-1">Format del DNI</h4>
            <p className="text-xs text-slate-600">
              S'ha introduït amb guions, espais o caràcters especials que han impedit la concordança automàtica.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-semibold text-xs text-slate-900 mb-1">Denominació del Cicle</h4>
            <p className="text-xs text-slate-600">
              L'especialitat escrita difereix del nom del títol oficial registrat al centre.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-semibold text-xs text-slate-900 mb-1">Promocions Antigues</h4>
            <p className="text-xs text-slate-600">
              Els expedients previs a la digitalització del registre requereixen validació manual per part de secretaria.
            </p>
          </div>
        </div>

        <div className="pt-2 text-xs text-slate-500">
          Per qualsevol consulta o incidència, pots escriure directament a:{' '}
          <a
            href={`mailto:${OFFICIAL_EMAILS.avisosAdmin}`}
            className="font-semibold text-sky-700 hover:underline"
          >
            {OFFICIAL_EMAILS.avisosAdmin}
          </a>
        </div>
      </div>
    </div>
  );
};

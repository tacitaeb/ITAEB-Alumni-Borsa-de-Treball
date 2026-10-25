import React, { useState } from 'react';
import { JobOffer, OfficialAlumniEntry } from '../types';
import {
  Shield,
  FileSpreadsheet,
  Mail,
  Users,
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  BookOpen,
  Send,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import {
  OFFICIAL_FORMS,
  OFFICIAL_EMAILS,
  OFFICIAL_REGISTRY_SAMPLE,
  doSectorsMatch,
  verifyAlumniAgainstRegistry,
  normalizeText
} from '../utils/jobData';

interface CoordinatorViewProps {
  offers: JobOffer[];
  onToggleOfferStatus: (id: string) => void;
  onAddOffer: (newOffer: JobOffer) => void;
}

export const CoordinatorView: React.FC<CoordinatorViewProps> = ({
  offers,
  onToggleOfferStatus,
  onAddOffer,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'gestio' | 'simulador'>('manual');

  // Simulator states
  const [simOfferSector, setSimOfferSector] = useState("Il·luminació per arts escèniques");
  const [simAlumniSectors, setSimAlumniSectors] = useState("il·luminacio d'espectacles, So en directe");
  const [simMatchResult, setSimMatchResult] = useState<boolean | null>(null);

  // New offer form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newReqs, setNewReqs] = useState('');
  const [newContract, setNewContract] = useState('Indefinit');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newSectors, setNewSectors] = useState('Sonorització per arts escèniques');
  const [newDeadline, setNewDeadline] = useState('30/11/2026');

  const handleTestMatch = () => {
    const match = doSectorsMatch(simAlumniSectors, simOfferSector);
    setSimMatchResult(match);
  };

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newJobTitle.trim()) return;

    const offer: JobOffer = {
      id: `oft-${Date.now()}`,
      empresa: newCompany.trim(),
      llocTreball: newJobTitle.trim(),
      personaContacte: newContactPerson.trim(),
      descripcio: newDesc.trim(),
      requisits: newReqs.trim(),
      tipusContracte: newContract,
      dataAlta: new Date().toLocaleDateString('ca-ES'),
      dataLimitCV: newDeadline,
      dataInici: 'Immediata',
      contacte: newContactEmail.trim() || 'rrhh@empresa.com',
      sector: newSectors.split(',').map(s => s.trim()).filter(Boolean),
      estat: 'Oberta',
      notificat: 'SÍ',
      marcaTemps: new Date().toLocaleString('ca-ES'),
    };

    onAddOffer(offer);
    setShowAddModal(false);
    // Reset
    setNewCompany('');
    setNewJobTitle('');
    setNewDesc('');
    setNewReqs('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-700 tracking-wider uppercase">
              Àrea del Coordinador Digital
            </span>
            <span className="text-xs bg-slate-900 text-amber-300 font-mono px-2 py-0.5 rounded-full font-semibold">
              tac@itaeb.cat
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Manual de Gestió & Eines del Sistema
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Guia operativa completa per administrar la Borsa de Treball de l'ITAEB sense cost ni intermediaris.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manual del Coordinador</span>
          </button>

          <button
            onClick={() => setActiveTab('gestio')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gestio'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Gestió d'Ofertes ({offers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('simulador')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'simulador'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulador de Regles</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Complete Official Manual */}
      {activeTab === 'manual' && (
        <div className="space-y-10">
          {/* Section 1: Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <span>Secció 1</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              1. Visió general del sistema
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              La Borsa de Treball de l'ITAEB connecta els exalumnes de l'Institut de Tècniques Audiovisuals i de l'Espectacle de Barcelona amb empreses del sector audiovisual i de l'espectacle. Està construïda íntegrament sobre eines que no tenen cap cost econòmic.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">1. Lloc web</span>
                <p className="text-xs text-slate-600">El portal que veuen els exalumnes verificats i on es publiquen les ofertes.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">2. Google Sheets</span>
                <p className="text-xs text-slate-600">Base de dades central amb 3 fulls: Ofertes, Exalumnes i Llistat Alumni ITAEB.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">3. Google Forms</span>
                <p className="text-xs text-slate-600">Formularis públics d'inscripció d'exalumnes i d'alta d'ofertes per a empreses.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Accounts & Emails */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <span>Secció 2</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              2. Comptes i correus del sistema
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Abans de fer qualsevol canvi, cal conèixer els comptes i correus que utilitza el sistema:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-800 font-bold">
                  <tr>
                    <th className="p-3 border-b border-slate-200">Compte / Correu</th>
                    <th className="p-3 border-b border-slate-200">Funció exacta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-mono font-bold text-sky-700">{OFFICIAL_EMAILS.admin}</td>
                    <td className="p-3 text-slate-700">Compte administrador del lloc web i gestió del full "ITAEB Borsa de Treball"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-amber-700">{OFFICIAL_EMAILS.aliesRemitent}</td>
                    <td className="p-3 text-slate-700">Àlies remitent de tots els correus automàtics (benvingudes i ofertes)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-700">{OFFICIAL_EMAILS.avisosAdmin}</td>
                    <td className="p-3 text-slate-700">Destinatari dels avisos d'administrador i incidències de verificació</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-indigo-700">{OFFICIAL_EMAILS.grupGoogleAccés}</td>
                    <td className="p-3 text-slate-700">Grup de Google que dona accés exclusiu al lloc web i la borsa</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Google Sheets structure */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <span>Secció 4</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              4. Estructura de la Base de Dades (Google Sheets)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Fitxer: <strong>"ITAEB Borsa de Treball"</strong> administrat per <code className="text-sky-700 font-semibold">{OFFICIAL_EMAILS.admin}</code>. Té 3 fulls:
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 mb-2">
                  Full 1: "Ofertes" (15 columnes)
                </h3>
                <div className="text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>0: Empresa</div>
                  <div>1: Lloc de treball</div>
                  <div>2: Persona de contacte</div>
                  <div>3: Descripció</div>
                  <div>4: Requisits</div>
                  <div>5: Tipus de contracte</div>
                  <div>6: Data d'alta</div>
                  <div>7: Data límit CV</div>
                  <div>8: Data Inici</div>
                  <div>9: Contacte</div>
                  <div>10: Sector (separat per comes)</div>
                  <div>11: Estat ("Oberta" / "Tancada")</div>
                  <div>12: Notificat ("SÍ" o buit)</div>
                  <div>13: Alumni (ús intern)</div>
                  <div>14: Marca de temps</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 mb-2">
                  Full 2: "Exalumnes" (Columnes oficials del formulari)
                </h3>
                <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>0: <strong>Marca de temps</strong> (Data i hora)</div>
                  <div>1: <strong>Nom i cognoms</strong></div>
                  <div>2: <strong>Número de DNI o document</strong> (per validar)</div>
                  <div>3: <strong>Correu electrònic</strong> (personal, NO @itaeb.cat)</div>
                  <div>4: <strong>Contrasenya</strong> (per iniciar sessió a la web)</div>
                  <div>5: <strong>Any de graduació</strong></div>
                  <div>6: <strong>Especialitat cursada</strong></div>
                  <div>7: <strong>Sectors d'interès</strong> (11 sectors, per alertes)</div>
                  <div>8: <strong>Notificacions per correu</strong> (Sí / No)</div>
                </div>
                <div className="mt-3 text-[11px] text-sky-800 bg-sky-50 p-2 rounded-lg border border-sky-200">
                  Nota: El correu afegit és personal (no @itaeb.cat perquè el compte institucional d'alumne es dona de baixa). Quan es verifica l'alta, aquest correu s'afegeix directament al grup de Google Workspace <strong>alumni@itaeb.cat</strong>.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 mb-2">
                  Full 3: "Llistat alumni ITAEB" (Registre oficial per verificar)
                </h3>
                <div className="text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>0: Estudis</div>
                  <div>1: IDALU</div>
                  <div>2: DNI</div>
                  <div>3: Cognoms</div>
                  <div>4: Nom</div>
                </div>
              </div>
            </div>

            {/* How to publish / close offers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-900 block mb-1">Per publicar una nova oferta:</span>
                <ol className="list-decimal list-inside text-slate-700 space-y-1">
                  <li>S'afegeix una fila nova al full "Ofertes".</li>
                  <li>S'omplen tots els camps.</li>
                  <li>Poseu "Oberta" al camp Estat.</li>
                  <li>Deixeu el camp Notificat BUIT (el sistema l'omplirà).</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <span className="font-bold text-rose-900 block mb-1">Per tancar una oferta coberta:</span>
                <ol className="list-decimal list-inside text-slate-700 space-y-1">
                  <li>Localitzeu l'oferta al full "Ofertes".</li>
                  <li>Canvieu el camp Estat de "Oberta" a "Tancada".</li>
                  <li>L'oferta desapareixerà automàticament de la web.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Section 5: Alta d'exalumnes & Manual Google Workspace handling */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <span>Secció 5</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              5. Procediment d'afegir manualment un exalumne a admin.google.com
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Quan un exalumne no es pot verificar automàticament (per exemple perquè és d'una promoció antiga o va escriure el DNI diferent), el coordinador fa el tràmit manual a la consola de Google Workspace:
            </p>
            <ol className="text-xs sm:text-sm text-slate-700 space-y-1.5 list-decimal list-inside p-4 rounded-xl bg-slate-50 border border-slate-200">
              <li>Aneu a <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold">admin.google.com</code> amb el compte d'administrador.</li>
              <li>Aneu a <strong>"Directori → Grups"</strong>.</li>
              <li>Cerqueu el grup <code className="text-sky-700 font-bold">{OFFICIAL_EMAILS.grupGoogleAccés}</code>.</li>
              <li>Cliqueu a <strong>"Afegir membres"</strong>.</li>
              <li>Afegiu el correu electrònic de l'exalumne i deseu.</li>
            </ol>
          </div>

          {/* Section 7: Email Flows */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <span>Secció 7</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              7. Fluxos de correu del sistema
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Tots els correus surten des de <code className="text-sky-800 font-bold">{OFFICIAL_EMAILS.aliesRemitent}</code>:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-800 font-bold">
                  <tr>
                    <th className="p-3 border-b border-slate-200">Correu</th>
                    <th className="p-3 border-b border-slate-200">Destinatari</th>
                    <th className="p-3 border-b border-slate-200">Quan s'envia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Benvinguda a la borsa</td>
                    <td className="p-3">Exalumne</td>
                    <td className="p-3">Quan es verifica correctament en inscriure's</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Nova oferta de treball</td>
                    <td className="p-3">Exalumnes amb sectors coincidents</td>
                    <td className="p-3">Cada hora, si hi ha ofertes noves sense notificar</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Inscripció no verificada</td>
                    <td className="p-3">{OFFICIAL_EMAILS.avisosAdmin}</td>
                    <td className="p-3">Quan un exalumne no es pot verificar automàticament</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Error tècnic</td>
                    <td className="p-3">{OFFICIAL_EMAILS.avisosAdmin}</td>
                    <td className="p-3">Si hi ha algun problema tècnic amb el sistema</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Recordatori de perfil pendent</td>
                    <td className="p-3">Exalumne</td>
                    <td className="p-3">24 hores després del registre sense informació completa</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Offers (Open / Close & Add test offers) */}
      {activeTab === 'gestio' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Control d'Estat d'Ofertes (Full "Ofertes")
              </h3>
              <p className="text-xs text-slate-600">
                Segons el manual, quan es canvia l'estat d'Oberta a Tancada, l'oferta desapareix automàticament de la vista pública dels alumni.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar Oferta de Prova</span>
            </button>
          </div>

          {/* Table of offers */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Empresa & Lloc</th>
                    <th className="p-3.5">Data Alta</th>
                    <th className="p-3.5">Límit CV</th>
                    <th className="p-3.5">Sectors</th>
                    <th className="p-3.5">Notificat</th>
                    <th className="p-3.5">Estat actual</th>
                    <th className="p-3.5 text-right">Acció</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {offers.map(offer => {
                    const isOpen = offer.estat === 'Oberta';
                    return (
                      <tr key={offer.id} className="hover:bg-slate-50/70">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{offer.llocTreball}</div>
                          <div className="text-slate-500 text-[11px]">{offer.empresa}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">{offer.dataAlta}</td>
                        <td className="p-3.5 whitespace-nowrap text-amber-800 font-medium">
                          {offer.dataLimitCV || '-'}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {offer.sector.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              offer.notificat === 'SÍ'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {offer.notificat || 'Pendent'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              isOpen
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isOpen ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>{offer.estat}</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => onToggleOfferStatus(offer.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              isOpen
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {isOpen ? 'Tancar oferta' : 'Reobrir oferta'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Match & Verification Simulator */}
      {activeTab === 'simulador' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sector matcher tester */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Simulador de Coincidència de Sectors</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Comprova la regla d'accents i majúscules
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              El manual estableix que la comparació de sectors ignora majúscules, minúscules i accents. Per exemple, <em>"Il·luminació d'espectacles"</em> i <em>"il·luminacio d'espectacles"</em> són idèntics.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sector de l'oferta nova (Full "Ofertes"):
                </label>
                <input
                  type="text"
                  value={simOfferSector}
                  onChange={e => setSimOfferSector(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sectors d'interès de l'exalumne (separats per comes):
                </label>
                <input
                  type="text"
                  value={simAlumniSectors}
                  onChange={e => setSimAlumniSectors(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                onClick={handleTestMatch}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Comprovar si coincideix i envia correu
              </button>

              {simMatchResult !== null && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                    simMatchResult
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {simMatchResult ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {simMatchResult
                      ? "COINCIDÈNCIA DETECTADA! El sistema enviaria el correu automàtic d'avís d'oferta a aquest alumni des de BorsaTreball@itaeb.cat."
                      : "SENSE COINCIDÈNCIA. L'exalumne no rebrà notificació d'aquesta oferta."}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Official Registry Reference Sample */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Full "Llistat alumni ITAEB"</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Alumnes Oficials de Prova Registrats
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Registre oficial utilitzat pel sistema automàtic per verificar nous exalumnes que omplen el formulari d'alta:
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {OFFICIAL_REGISTRY_SAMPLE.map((alumni, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900">
                      {alumni.nom} {alumni.cognoms}
                    </span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-sky-700">
                      {alumni.dni}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">{alumni.estudis}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Expedient: {alumni.idalu}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal to add test offer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                Afegir Nova Oferta al Google Sheet "Ofertes"
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Empresa</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  placeholder="Ex: Teatre Nacional de Catalunya"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lloc de treball</label>
                <input
                  type="text"
                  required
                  value={newJobTitle}
                  onChange={e => setNewJobTitle(e.target.value)}
                  placeholder="Ex: Tècnic/a de so i microfonia"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Persona de contacte</label>
                <input
                  type="text"
                  value={newContactPerson}
                  onChange={e => setNewContactPerson(e.target.value)}
                  placeholder="Ex: Joan Ribas"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripció</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Detall de les funcions del lloc..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requisits</label>
                <textarea
                  rows={2}
                  value={newReqs}
                  onChange={e => setNewReqs(e.target.value)}
                  placeholder="Requisits tècnics i formatius..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipus de contracte</label>
                  <input
                    type="text"
                    value={newContract}
                    onChange={e => setNewContract(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data límit CV</label>
                  <input
                    type="text"
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sectors (separats per comes)</label>
                <input
                  type="text"
                  value={newSectors}
                  onChange={e => setNewSectors(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correu / Contacte per a CV</label>
                <input
                  type="text"
                  value={newContactEmail}
                  onChange={e => setNewContactEmail(e.target.value)}
                  placeholder="borsa@teatrenacional.cat"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel·lar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold"
                >
                  Publicar oferta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

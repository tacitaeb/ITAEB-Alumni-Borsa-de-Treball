import React, { useState, useMemo } from 'react';
import { JobOffer } from '../types';
import {
  Briefcase,
  Search,
  Filter,
  Calendar,
  Clock,
  Building2,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Tag,
  Copy,
  Check,
  Share2,
  X,
  FileSpreadsheet,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { doSectorsMatch } from '../utils/jobData';
import { PageId } from '../types';

interface OffersViewProps {
  offers: JobOffer[];
  selectedOffer: JobOffer | null;
  onSelectOffer: (offer: JobOffer | null) => void;
  onRefreshData?: () => void;
  onNavigate?: (page: PageId) => void;
}

export const OffersView: React.FC<OffersViewProps> = ({
  offers,
  selectedOffer,
  onSelectOffer,
  onRefreshData,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('Tots');
  const [selectedContract, setSelectedContract] = useState<string>('Tots');
  const [showClosedOffers, setShowClosedOffers] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Available unique sectors across offers
  const allSectors = useMemo(() => {
    const s = new Set<string>();
    offers.forEach(o => {
      o.sector.forEach(sec => s.add(sec.trim()));
    });
    return ['Tots', ...Array.from(s)];
  }, [offers]);

  // Filtered offers
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      // 1. Estat check
      if (!showClosedOffers && offer.estat === 'Tancada') {
        return false;
      }

      // 2. Sector check
      if (selectedSector !== 'Tots') {
        const matchesSector = offer.sector.some(sec => doSectorsMatch(sec, selectedSector));
        if (!matchesSector) return false;
      }

      // 3. Contract check
      if (selectedContract !== 'Tots') {
        if (!offer.tipusContracte.toLowerCase().includes(selectedContract.toLowerCase())) {
          return false;
        }
      }

      // 4. Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          offer.empresa.toLowerCase().includes(q) ||
          offer.llocTreball.toLowerCase().includes(q) ||
          offer.descripcio.toLowerCase().includes(q) ||
          offer.requisits.toLowerCase().includes(q) ||
          offer.contacte.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [offers, showClosedOffers, selectedSector, selectedContract, searchQuery]);

  const openOffersCount = offers.filter(o => o.estat === 'Oberta').length;

  const handleCopyEmail = (contact: string) => {
    // Extract email from contact string
    const emailMatch = contact.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const textToCopy = emailMatch ? emailMatch[0] : contact;
    navigator.clipboard.writeText(textToCopy);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-700 tracking-wider uppercase">
              Catàleg Oficial en Temps Real
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sincronitzat amb Google Sheets
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Ofertes de Treball per a Alumni
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Convocatòries laborals del sector audiovisual, arts escèniques i esdeveniments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('perfil')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              title="Modifica les teves dades personals, contrasenya i sectors d'interès"
            >
              <User className="w-3.5 h-3.5" />
              <span>El meu compte</span>
            </button>
          )}

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-xs cursor-pointer"
              title="Actualitzar ofertes des del Google Sheets"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Actualitzar</span>
            </button>
          )}

          <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 text-right">
            <div className="text-xs text-sky-700 font-medium">Vacants actives</div>
            <div className="text-lg font-extrabold text-sky-900 leading-tight">
              {openOffersCount} ofertes obertes
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cercar per càrrec, empresa, municipi o requisits (ex: 'teatre', 'so', 'Vilanova', 'càmera')..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Rows */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
          {/* Sector Chips */}
          <div className="space-y-1.5 flex-1 min-w-[280px]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar per sector:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allSectors.map(sec => {
                const isSelected = selectedSector === sec;
                return (
                  <button
                    key={sec}
                    onClick={() => setSelectedSector(sec)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contract & Status Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Tipus de contracte
              </label>
              <select
                value={selectedContract}
                onChange={e => setSelectedContract(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Tots">Tots els contractes</option>
                <option value="Indefinit">Indefinit</option>
                <option value="Temporal">Temporal</option>
                <option value="Fix discontinu">Fix discontinu / Autònom</option>
              </select>
            </div>

            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showClosedOffers}
                  onChange={e => setShowClosedOffers(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Mostrar ofertes tancades (històric)
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">
            No s'ha trobat cap oferta amb aquests criteris
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Prova de canviar el text de cerca, seleccionar un altre sector o reiniciar els filtres.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSector('Tots');
              setSelectedContract('Tots');
            }}
            className="text-xs font-semibold text-sky-600 hover:text-sky-800 underline mt-2 inline-block cursor-pointer"
          >
            Netejar tots els filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOffers.map(offer => {
            const isClosed = offer.estat === 'Tancada';
            return (
              <div
                key={offer.id}
                onClick={() => onSelectOffer(offer)}
                className={`rounded-2xl border p-6 transition-all duration-200 flex flex-col justify-between cursor-pointer group shadow-xs hover:shadow-md ${
                  isClosed
                    ? 'bg-slate-50/70 border-slate-200 opacity-80'
                    : 'bg-white border-slate-200 hover:border-sky-300'
                }`}
              >
                <div>
                  {/* Card top tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          isClosed
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isClosed ? (
                          <XCircle className="w-3 h-3 text-slate-500" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>{offer.estat}</span>
                      </span>

                      {offer.tipusContracte && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {offer.tipusContracte.split('(')[0].trim()}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{offer.dataAlta}</span>
                    </div>
                  </div>

                  {/* Title and Company */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-700 transition leading-snug mb-1">
                    {offer.llocTreball}
                  </h3>

                  <div className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{offer.empresa}</span>
                  </div>

                  {/* Description preview */}
                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed whitespace-pre-line">
                    {offer.descripcio}
                  </p>
                </div>

                <div>
                  {/* Sectors */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {offer.sector.map((sec, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-100"
                      >
                        {sec}
                      </span>
                    ))}
                  </div>

                  {/* Footer of Card */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1 text-amber-700 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Límit: {offer.dataLimitCV || 'No especificada'}</span>
                    </div>

                    <span className="font-bold text-sky-700 group-hover:underline flex items-center gap-1">
                      <span>Veure convocatòria</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Offer Detail Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    selectedOffer.estat === 'Oberta'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {selectedOffer.estat}
                </span>
                <span className="text-xs text-slate-500">Publicat el {selectedOffer.dataAlta}</span>
              </div>

              <button
                onClick={() => onSelectOffer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                aria-label="Tancar finestra de detall"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {selectedOffer.llocTreball}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700 mt-2 font-medium">
                  <span className="flex items-center gap-1.5 text-sky-800 font-bold">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    {selectedOffer.empresa}
                  </span>
                  {selectedOffer.personaContacte && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <User className="w-3.5 h-3.5" />
                      Contacte: {selectedOffer.personaContacte}
                    </span>
                  )}
                </div>
              </div>

              {/* Badges and dates info bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Data límit CV:</span>
                  <span className="font-bold text-amber-700 text-sm mt-0.5 block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedOffer.dataLimitCV || 'Fins a cobrir vacant'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Data d'inici prevista:</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {selectedOffer.dataInici || 'A convenir'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Tipus de contracte:</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {selectedOffer.tipusContracte || 'Segons conveni'}
                  </span>
                </div>
              </div>

              {/* Sectors */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Sectors professionals
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedOffer.sector.map((sec, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold px-3 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-100"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Descripció del lloc de treball
                </h3>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedOffer.descripcio}
                </div>
              </div>

              {/* Requirements */}
              {selectedOffer.requisits && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Requisits i competències
                  </h3>
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {selectedOffer.requisits}
                  </div>
                </div>
              )}

              {/* Contact and How to Apply */}
              <div className="p-5 rounded-2xl bg-sky-900 text-white space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-300 uppercase tracking-wider">
                  <Mail className="w-4 h-4" />
                  <span>Com presentar la teva candidatura</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {selectedOffer.contacte}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href={`mailto:${
                      selectedOffer.contacte.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || ''
                    }?subject=Candidatura%20ITAEB%20Alumni%20-%20${encodeURIComponent(
                      selectedOffer.llocTreball
                    )}&body=Benvolguts,%0A%0AEm%20poso%20en%20contacte%20amb%20vosaltres%20en%20referència%20a%20l'oferta%20de%20treball%20de%20%22${encodeURIComponent(
                      selectedOffer.llocTreball
                    )}%22%20publicada%20a%20la%20Borsa%20de%20Treball%20de%20l'ITAEB.%0A%0ASóc%20graduat/da%20a%20l'ITAEB%20i%20adjunto%20el%20meu%20currículum%20per%20a%20la%20vostra%20consideració.%0A%0ACordialment,%0A[Nom%20i%20Cognoms]%0A[Telèfon]`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Enviar candidatura per correu</span>
                  </a>

                  <button
                    onClick={() => handleCopyEmail(selectedOffer.contacte)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Correu copiat!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar adreça de contacte</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => onSelectOffer(null)}
                className="px-5 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Tancar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

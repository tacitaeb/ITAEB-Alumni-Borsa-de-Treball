import React from 'react';
import { PageId, JobOffer } from '../types';
import {
  Briefcase,
  GraduationCap,
  Building2,
  Sparkles,
  ArrowRight,
  Sliders,
  Volume2,
  Video,
  Clapperboard,
  Tv,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';
import { OFFICIAL_FORMS } from '../utils/jobData';

interface HomeViewProps {
  onNavigate: (page: PageId) => void;
  offers: JobOffer[];
  onSelectOffer: (offer: JobOffer) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  offers,
  onSelectOffer,
}) => {
  const openOffers = offers.filter(o => o.estat === 'Oberta');
  const recentOffers = openOffers.slice(0, 3);

  const sectorsList = [
    {
      name: "Sonorització per arts escèniques",
      icon: <Volume2 className="w-5 h-5 text-sky-600" />,
      desc: "Taules de so en directe, ajust de sistemes line-array, microfonia RF i broadcast.",
      badge: "Arts Escèniques & Música"
    },
    {
      name: "Il·luminació escènica i d'espectacles",
      icon: <Sliders className="w-5 h-5 text-amber-600" />,
      desc: "Programació de consoles DMX/GrandMA, disseny lumínic, robòtica i teatre.",
      badge: "Gires & Teatre"
    },
    {
      name: "Realització d'audiovisuals i espectacles",
      icon: <Video className="w-5 h-5 text-rose-600" />,
      desc: "Operació de càmeres de plató i exteriors, realització multicàmera i streaming.",
      badge: "Televisió & Esdeveniments"
    },
    {
      name: "Creació de continguts & Postproducció",
      icon: <Clapperboard className="w-5 h-5 text-indigo-600" />,
      desc: "Edició de vídeo professional, motion graphics, storytelling i format vertical.",
      badge: "Digital & Màrqueting"
    },
    {
      name: "Maquinària escènica i estructures",
      icon: <Tv className="w-5 h-5 text-emerald-600" />,
      desc: "Muntatge de trusses, motors, seguretat en alçada i regidoria tècnica escènica.",
      badge: "Infraestructures"
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-6 p-8 sm:p-12 lg:p-16 border border-slate-700/60 shadow-2xl">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-medium text-sky-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Servei Oficial de la Borsa de Treball de l'ITAEB</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            El portal d'ocupació dels professionals de l'
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-amber-300">
              Audiovisual i l'Espectacle
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Connectem el talent dels graduats de l'<strong>Institut de Tècniques Audiovisuals i de l'Espectacle de Barcelona</strong> amb teatres, productores, festivals i empreses del sector cultural.
          </p>

          {/* Call to action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
            <button
              onClick={() => onNavigate('ofertes')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-sky-500/20 hover:shadow-sky-400/30 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Briefcase className="w-4 h-4" />
              <span>Explorar Ofertes de Treball</span>
              <span className="ml-1 px-2 py-0.5 text-xs font-extrabold bg-slate-950/20 text-slate-900 rounded-full">
                {openOffers.length} actives
              </span>
            </button>

            <button
              onClick={() => onNavigate('alumni')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-sky-400" />
              <span>Inscripció d'Alumni</span>
            </button>

            <button
              onClick={() => onNavigate('empreses')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Per a Empreses</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{openOffers.length}</div>
              <div className="text-xs text-slate-400 mt-1">Ofertes obertes avui</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">Gratuït i sense cost</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">5</div>
              <div className="text-xs text-slate-400 mt-1">Especialitats tècniques</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">Directe</div>
              <div className="text-xs text-slate-400 mt-1">Notificacions per sector</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Open Offers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs uppercase tracking-wider">
              <Briefcase className="w-4 h-4" />
              <span>Convocatòries Vigents</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Últimes ofertes publicades
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Actualitzades en temps real des de la base de dades oficial de l'ITAEB.
            </p>
          </div>

          <button
            onClick={() => onNavigate('ofertes')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-900 cursor-pointer group"
          >
            <span>Veure totes les {openOffers.length} ofertes</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentOffers.map(offer => (
            <div
              key={offer.id}
              onClick={() => {
                onSelectOffer(offer);
                onNavigate('ofertes');
              }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:border-sky-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {offer.estat}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {offer.dataAlta}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg group-hover:text-sky-700 transition leading-snug mb-1">
                  {offer.llocTreball}
                </h3>
                <div className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{offer.empresa}</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                  {offer.descripcio}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {offer.sector.map((sec, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                    >
                      {sec}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Límit: {offer.dataLimitCV}
                  </span>
                  <span className="font-semibold text-sky-700 group-hover:underline">
                    Detalls →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sectors Professional ITAEB */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
            Especialitats tècniques
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Àmbits professionals de la Borsa
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Els nostres alumni estan formats directament amb la tecnologia i equips utilitzats en la indústria de l'espectacle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectorsList.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-100">{item.icon}</div>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">{item.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}

          {/* Registration card for quick access */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white flex flex-col justify-between shadow-md">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-3">
                Comença avui
              </span>
              <h3 className="text-lg font-bold mb-2">Ets alumni de l'ITAEB?</h3>
              <p className="text-xs text-sky-100 leading-relaxed mb-4">
                Dona't d'alta en menys de 2 minuts al formulari oficial. Rebràs alertes automàtiques de feina al teu correu.
              </p>
            </div>
            <a
              href={OFFICIAL_FORMS.altaExalumnes}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white text-sky-900 font-bold text-xs hover:bg-sky-50 transition shadow-sm"
            >
              <span>Formulari d'Alta d'Exalumnes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* How it works 3-step banner */}
      <section className="bg-slate-100/80 py-12 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Com funciona el sistema
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Un model 100% àgil, sense intermediaris i automatitzat amb Google Sheets i grups institucionals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                1
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Inscripció i Verificació</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  L'exalumne s'inscriu mitjançant el Google Form oficial. El sistema creua automàticament el DNI i l'especialitat amb el registre oficial del centre.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                2
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Accés a alumni@itaeb.cat</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Un cop verificat, s'incorpora automàticament al grup de Google institucional que li dona accés complet a la borsa i rep el correu de benvinguda.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                3
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Alertes personalitzades</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Quan una empresa publica una oferta, el sistema envia un correu des de <code className="text-slate-800 font-semibold">BorsaTreball@itaeb.cat</code> només als alumni amb sectors coincidents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

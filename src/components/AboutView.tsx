import React from 'react';
import { PageId } from '../types';
import {
  ShieldCheck,
  HeartHandshake,
  FileCheck2,
  Users2,
  Mail,
  GraduationCap,
  Building2,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { OFFICIAL_EMAILS, OFFICIAL_FORMS } from '../utils/jobData';

interface AboutViewProps {
  onNavigate: (page: PageId) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Page Title & Intro */}
      <div className="border-b border-slate-200 pb-8">
        <span className="text-xs font-bold text-sky-700 tracking-wider uppercase">
          Informació Institucional
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
          Sobre la Borsa de Treball de l'ITAEB
        </h1>
        <p className="text-base text-slate-600 mt-3 max-w-3xl leading-relaxed">
          Un servei gratuït i públic creat per l'<strong>Institut de Tècniques Audiovisuals i de l'Espectacle de Barcelona</strong> amb l'objectiu de connectar directament els nostres graduats amb el teixit professional i empresarial del sector cultural i dels mitjans de comunicació.
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Servei 100% Gratuït</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            La borsa no té cap cost econòmic ni per a les empreses contractants ni per als exalumnes. Està construïda íntegrament sobre la infraestructura de Google Workspace de l'ITAEB per garantir sostenibilitat i màxima eficiència.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Qualitat i Verificació Oficial</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Només poden accedir a les ofertes aquelles persones que han estat formalment verificades com a titulats de l'ITAEB mitjançant el creuament automàtic de DNI i especialitat amb el registre acadèmic oficial.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Transparència i Condicions Laborals</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Fomentem ofertes de feina que respectin els convenis col·lectius del sector audiovisual i de les arts escèniques, amb descripció clara de tasques, tipus de contracte i condicions econòmiques.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Filtratge Intel·ligent per Sector</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            El sistema segmenta les convocatòries automàticament. Els exalumnes reben notificacions per correu únicament d'aquelles ofertes que coincideixen amb els sectors professionals que han seleccionat com a d'interès.
          </p>
        </div>
      </div>

      {/* Detailed Technical Structure & Roles */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-6">
        <div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            Arquitectura del Servei
          </span>
          <h2 className="text-2xl font-bold mt-1 text-white">
            Com s'organitzen els canals de l'ITAEB
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            El funcionament de la borsa de treball descansa sobre quatre canals de comunicació i gestió estandarditzats:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="text-xs font-semibold text-slate-400">Compte administrador</div>
            <div className="font-mono text-sm text-sky-300 font-bold mt-0.5">{OFFICIAL_EMAILS.admin}</div>
            <p className="text-xs text-slate-300 mt-1">
              Compte administrador del lloc web i gestió del Google Sheets central.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="text-xs font-semibold text-slate-400">Àlies remitent automàtic</div>
            <div className="font-mono text-sm text-amber-300 font-bold mt-0.5">{OFFICIAL_EMAILS.aliesRemitent}</div>
            <p className="text-xs text-slate-300 mt-1">
              Remitent de tots els correus de benvinguda i notificacions d'ofertes noves.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="text-xs font-semibold text-slate-400">Coordinador d'Estada a l'Empresa</div>
            <div className="font-mono text-sm text-emerald-300 font-bold mt-0.5">{OFFICIAL_EMAILS.avisosAdmin}</div>
            <p className="text-xs text-slate-300 mt-1">
              Destinatari dels avisos d'alumnes pendents de revisió manual i atenció a empreses.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="text-xs font-semibold text-slate-400">Grup de membres oficials</div>
            <div className="font-mono text-sm text-indigo-300 font-bold mt-0.5">{OFFICIAL_EMAILS.grupGoogleAccés}</div>
            <p className="text-xs text-slate-300 mt-1">
              Grup de Google Workspace que autoritza l'accés a les ofertes de la borsa.
            </p>
          </div>
        </div>
      </div>

      {/* Two action pathways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="p-6 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-800 font-bold text-base mb-2">
              <GraduationCap className="w-5 h-5 text-sky-600" />
              <span>Ets exalumne/a de l'ITAEB?</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
              Consulta els passos per inscriure't, passar la verificació automàtica i rebre convocatòries directes per correu.
            </p>
          </div>
          <button
            onClick={() => onNavigate('alumni')}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition cursor-pointer"
          >
            <span>Guia per als Alumni</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-bold text-base mb-2">
              <Building2 className="w-5 h-5 text-amber-700" />
              <span>Ets una empresa o productora?</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
              Publica la teva oferta de forma ràpida i sense cost mitjançant el formulari oficial d'alta d'ofertes.
            </p>
          </div>
          <button
            onClick={() => onNavigate('empreses')}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition cursor-pointer"
          >
            <span>Guia per a les Empreses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

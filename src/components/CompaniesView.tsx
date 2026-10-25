import React from 'react';
import { PageId } from '../types';
import {
  Building2,
  ExternalLink,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  Send,
  Mail,
  HelpCircle,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { OFFICIAL_FORMS, OFFICIAL_EMAILS } from '../utils/jobData';

interface CompaniesViewProps {
  onNavigate: (page: PageId) => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-8">
        <span className="text-xs font-bold text-amber-700 tracking-wider uppercase">
          Empreses, Productores i Teatres
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
          Publicació d'Ofertes per a Empreses
        </h1>
        <p className="text-base text-slate-600 mt-3 max-w-3xl leading-relaxed">
          Necessiteu tècnics d'il·luminació, de so, de realització, maquinària o creadors de contingut formats per a la indústria professional? Publiqueu la vostra vacant de forma gratuïta i connecteu directament amb la comunitat de graduats de l'ITAEB.
        </p>

        {/* Primary CTA */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a
            href={OFFICIAL_FORMS.altaOfertes}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <span>Publicar Oferta de Feina (Formulari Oficial)</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href={`mailto:${OFFICIAL_EMAILS.avisosAdmin}?subject=Consulta%20empresa%20oferta%20ITAEB`}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition cursor-pointer"
          >
            <Mail className="w-4 h-4 text-slate-600" />
            <span>Contactar el Coordinador d'Estada a l'Empresa</span>
          </a>
        </div>
      </div>

      {/* Why hire from ITAEB */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">
          Per què incorporar talent titulat de l'ITAEB?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Formació Tècnica Rigorosa</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Els nostres programes capaciten els alumnes amb tecnologia d'última generació: taules digitals, robòtica DMX, software de postproducció, càmeres broadcast i estructures escèniques.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Agilitat i Difusió Directa</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              En quant registreu la vostra oferta, el sistema la notifica directament a la bústia de tots els alumni amb perfils i sectors coincidents sense intermediaris ni demores.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Gratuït i Sense Compromisos</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Com a institut públic especialitzat, la nostra missió és fomentar l'ocupació digna del sector sense aplicar cap comissió ni taxa d'intermediació.
            </p>
          </div>
        </div>
      </div>

      {/* Instructions for publishing offers */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Com publicar una oferta pas a pas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              Pas 1: Omplir el Formulari
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Dades de la Convocatòria
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Al formulari heu d'especificar:
            </p>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li><strong>Nom de l'empresa</strong> i persona de contacte</li>
              <li><strong>Lloc de treball</strong> i municipi/ubicació</li>
              <li><strong>Descripció de funcions</strong> i tasques a realitzar</li>
              <li><strong>Requisits</strong> (coneixements tècnics, carnet de conduir, etc.)</li>
              <li><strong>Tipus de contracte</strong>, durada i condicions econòmiques</li>
              <li><strong>Data límit</strong> d'enviament de CV i data d'inici prevista</li>
              <li><strong>Sector o sectors</strong> (Il·luminació, So, Realització, etc.)</li>
              <li><strong>Instruccions de contacte</strong> (correu o telèfon per rebre CVs)</li>
            </ul>
            <div className="pt-2">
              <a
                href={OFFICIAL_FORMS.altaOfertes}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1"
              >
                <span>Obrir formulari d'alta d'ofertes</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Pas 2: Publicació & Notificació
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Difusió Automàtica als Candidats
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Un cop enviat el formulari:
            </p>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>S'incorpora al full oficial <strong>Ofertes</strong> amb estat <strong>Oberta</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Apareix immediatament a la <strong>pàgina web de la Borsa de Treball</strong> perquè els alumni la consultin.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>S'envia un correu automàtic des de <code className="text-slate-800 font-semibold">{OFFICIAL_EMAILS.aliesRemitent}</code> als exalumnes que coincideixin amb el sector.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Rebeu les candidatures directament a la vostra adreça sense filtres opacs.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Closing an offer */}
      <div className="p-6 rounded-2xl bg-slate-100 border border-slate-200 space-y-3">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-700" />
          <span>Com tancar l'oferta un cop coberta la plaça</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Quan hàgiu finalitzat el procés de selecció o la plaça quedi coberta, només cal que envieu un breu correu a{' '}
          <a
            href={`mailto:${OFFICIAL_EMAILS.avisosAdmin}?subject=Tancar%20oferta%20ITAEB`}
            className="font-bold text-sky-700 hover:underline"
          >
            {OFFICIAL_EMAILS.avisosAdmin}
          </a>
          . El coordinador canviarà l'estat a <em>"Tancada"</em> i l'oferta desapareixerà automàticament de la web d'alumni.
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import { ShieldAlert, ExternalLink, Mail, CheckCircle, ArrowRight } from 'lucide-react';
import { OFFICIAL_FORMS, OFFICIAL_EMAILS } from '../utils/jobData';

interface AccessDeniedProps {
  onSimulateAlumniLogin: () => void;
  onGoToAlumniInfo: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  onSimulateAlumniLogin,
  onGoToAlumniInfo,
}) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Warning Header */}
        <div className="bg-gradient-to-r from-rose-600 to-amber-600 p-6 text-white text-center sm:text-left flex flex-col sm:flex-row items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xs shrink-0">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
              Accés Restringit
            </span>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight">
              Només per a membres de alumni@itaeb.cat
            </h2>
            <p className="text-sm text-rose-100 mt-1">
              No s'ha detectat que la teva sessió pertanyi al grup oficial d'exalumnes de l'ITAEB.
            </p>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="prose text-slate-600 text-sm leading-relaxed">
            <p>
              D'acord amb la normativa de la <strong>Borsa de Treball de l'ITAEB</strong>, l'accés a les ofertes de treball està reservat exclusivament als graduats oficials de l'Institut de Tècniques Audiovisuals i de l'Espectacle de Barcelona que han completat el procés d'alta.
            </p>
          </div>

          {/* Action steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/60 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-sky-800 uppercase tracking-wider block mb-1">
                  Opció 1: Ets exalumne/a?
                </span>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                  Dona't d'alta a la Borsa de Treball
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  Omple el formulari oficial amb el teu DNI i Especialitat cursada. El sistema et verificarà automàticament i t'afegirà al grup <code className="text-sky-700 bg-white px-1 py-0.5 rounded">alumni@itaeb.cat</code>.
                </p>
              </div>
              <a
                href={OFFICIAL_FORMS.altaExalumnes}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition shadow-xs"
              >
                <span>Formulari d'alta d'exalumnes</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/60 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-1">
                  Opció 2: Ja et vas registrar?
                </span>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                  Verificació manual o suport
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  Si ets d'una promoció antiga o hi ha hagut alguna discrepància en el DNI o l'especialitat, el coordinador d'Estada a l'Empresa et donarà d'alta manualment.
                </p>
              </div>
              <a
                href={`mailto:${OFFICIAL_EMAILS.avisosAdmin}?subject=Sol·licitud%20alta%20alumni%20ITAEB&body=Hola,%20sóc%20exalumne/a%20de%20l'ITAEB%20i%20demano%20la%20verificació%20manual%20per%20accedir%20a%20la%20Borsa%20de%20Treball.%20DNI:%20`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition shadow-xs"
              >
                <Mail className="w-3.5 h-3.5 text-amber-700" />
                <span>Contactar empresa@itaeb.cat</span>
              </a>
            </div>
          </div>

          {/* Quick simulator helper */}
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Estàs provant la plataforma com a avaluador o coordinador?</h4>
                <p className="text-xs text-slate-600">
                  Pots activar immediatament el perfil simulat d'Alumni verificat per comprovar el catàleg complet d'ofertes.
                </p>
              </div>
              <button
                onClick={onSimulateAlumniLogin}
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Simular sessió Alumni</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onGoToAlumniInfo}
              className="text-xs font-medium text-sky-700 hover:text-sky-900 underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Llegir la guia completa de funcionament per als alumni</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

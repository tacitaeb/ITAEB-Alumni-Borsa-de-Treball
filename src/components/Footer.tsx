import React from 'react';
import { PageId } from '../types';
import { Mail, ExternalLink, ShieldCheck, Heart } from 'lucide-react';
import { OFFICIAL_EMAILS, OFFICIAL_FORMS } from '../utils/jobData';

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Identity & Logo */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/itaeblogo_2da403ed.jpg"
                alt="Logo ITAEB"
                className="h-10 w-auto object-contain bg-white p-1 rounded-lg"
              />
              <div>
                <span className="block font-bold text-white text-sm">ITAEB Alumni</span>
                <span className="block text-[11px] text-slate-400">Borsa de Treball</span>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Institut de Tècniques Audiovisuals i de l'Espectacle de Barcelona. Connectant el talent jove amb les indústries culturals de Catalunya.
            </p>
          </div>

          {/* Column 2: Nav links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Navegació
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('inici')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Inici
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('sobre')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Sobre la borsa
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('alumni')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Per als alumni
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('empreses')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Per a les empreses
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('ofertes')}
                  className="hover:text-white transition cursor-pointer font-medium text-sky-400"
                >
                  Ofertes de treball
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('coordinador')}
                  className="hover:text-white transition cursor-pointer text-amber-400"
                >
                  Manual del Coordinador
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Forms & Direct Access */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Formularis Oficials
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={OFFICIAL_FORMS.altaExalumnes}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition"
                >
                  <span>Formulari Alta Exalumnes</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href={OFFICIAL_FORMS.altaOfertes}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition"
                >
                  <span>Formulari Alta d'Ofertes</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li className="pt-2">
                <span className="block text-[11px] text-slate-500">
                  Accés al lloc web reservat als membres de:
                </span>
                <span className="font-mono text-sky-400 font-semibold text-[11px]">
                  {OFFICIAL_EMAILS.grupGoogleAccés}
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & System Accounts */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Contacte & Suport
            </h4>
            <div className="space-y-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Coordinació i verificació:</span>
                <a
                  href={`mailto:${OFFICIAL_EMAILS.avisosAdmin}`}
                  className="text-slate-300 hover:text-white transition font-mono"
                >
                  {OFFICIAL_EMAILS.avisosAdmin}
                </a>
              </div>
              <div>
                <span className="text-slate-500 block">Notificacions automàtiques:</span>
                <span className="text-slate-300 font-mono">{OFFICIAL_EMAILS.aliesRemitent}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Administrador tècnic:</span>
                <span className="text-slate-300 font-mono">{OFFICIAL_EMAILS.admin}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} Institut de Tècniques Audiovisuals i de l'Espectacle de Barcelona (ITAEB). Tots els drets reservats.
          </div>
          <div className="flex items-center gap-1">
            <span>Plataforma pública i gratuïta per a la promoció de l'ocupació cultural.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React from 'react';
import { PageId, UserSession } from '../types';
import {
  Briefcase,
  Info,
  GraduationCap,
  Building2,
  Shield,
  Menu,
  X,
  CheckCircle2,
  Lock,
  LogOut,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  userSession: UserSession;
  onChangeUserSession: (session: UserSession) => void;
  openOffersCount: number;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  userSession,
  openOffersCount,
  onOpenLogin,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks: { id: PageId; label: string; icon: React.ReactNode; badge?: number; locked?: boolean }[] = [
    { id: 'inici', label: 'Inici', icon: null },
    { id: 'sobre', label: 'Sobre la borsa', icon: <Info className="w-4 h-4" /> },
    { id: 'alumni', label: 'Per als alumni', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'empreses', label: 'Per a les empreses', icon: <Building2 className="w-4 h-4" /> },
    {
      id: 'ofertes',
      label: 'Ofertes de treball',
      icon: <Briefcase className="w-4 h-4" />,
      badge: openOffersCount,
      locked: !userSession.isMemberOfAlumniGroup,
    },
    { id: 'coordinador', label: 'Coordinador Digital', icon: <Shield className="w-4 h-4" /> },
  ];

  const handleSelectPage = (id: PageId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top clean micro-bar (without bulky buttons) */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">Institut de Tècniques Audiovisuals i de l'Espectacle de Barcelona</span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline font-medium text-slate-300">Borsa de Treball Oficial</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Accés reservat exclusivament al grup oficial <strong>alumni@itaeb.cat</strong></span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Title */}
          <div
            onClick={() => handleSelectPage('inici')}
            className="flex items-center gap-2 sm:gap-3.5 cursor-pointer group select-none min-w-0"
          >
            <img
              src="/assets/aistudio/itaeblogo_2da403ed.jpg"
              alt="Logo ITAEB"
              className="h-9 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 shrink-0"
            />
            <div className="border-l border-slate-300 pl-2 sm:pl-3.5 py-0.5 truncate">
              <span className="block text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-sky-700">
                ITAEB Alumni
              </span>
              <span className="block text-sm sm:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
                Borsa de Treball
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleSelectPage(link.id)}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                  {link.locked && (
                    <Lock className="w-3 h-3 text-slate-400" />
                  )}
                  {link.badge !== undefined && (
                    <span
                      className={`inline-flex items-center justify-center text-xs font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-sky-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Container: Accés Alumni button placed directly to the left of the mobile menu button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {userSession.isMemberOfAlumniGroup ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-50 border border-emerald-200 px-2 sm:px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-900 max-w-[85px] sm:max-w-[160px] truncate">
                  {userSession.name}
                </span>
                <button
                  onClick={onLogout}
                  className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="Tancar sessió (Sortir)"
                  aria-label="Tancar sessió"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-all cursor-pointer shrink-0"
                title="Identifica't amb el teu correu personal i contrasenya"
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Accés Alumni (Identifica't)</span>
                <span className="sm:hidden">Accés Alumni</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <div className="flex lg:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer border border-slate-200"
                aria-label="Obrir menú principal"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map(link => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleSelectPage(link.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 text-sky-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {link.icon}
                  <span>{link.label}</span>
                  {link.locked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                </div>
                {link.badge !== undefined && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

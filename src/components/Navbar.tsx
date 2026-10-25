import React from 'react';
import { Briefcase, Info, GraduationCap, Building2, Shield, Menu, X, CheckCircle2, AlertTriangle, UserCheck, Lock, LogOut } from 'lucide-react';

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
  onChangeUserSession,
  openOffersCount,
  onOpenLogin,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [sessionDropdownOpen, setSessionDropdownOpen] = React.useState(false);

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
      {/* Top micro-bar with access status & switcher */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">Institut de Tècniques Audiovisuals i de l'Espectacle de Barcelona</span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline font-medium text-slate-300">Borsa de Treball Oficial</span>
          </div>

          <div className="relative flex items-center gap-2 sm:gap-3">
            {userSession.isMemberOfAlumniGroup ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="max-w-[140px] sm:max-w-none truncate">{userSession.name}</span>
                </span>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Tancar sessió"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sortir</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-xs transition cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>Accés Alumni (Identifica't)</span>
                </button>
              </div>
            )}

            {/* Quick simulator dropdown toggle */}
            <button
              onClick={() => setSessionDropdownOpen(!sessionDropdownOpen)}
              className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
              title="Canviar rol o simular un altre usuari"
            >
              [Canviar rol]
            </button>

            {sessionDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-semibold text-xs text-slate-900">Simulador de permís de grup Google</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Segons el manual, el lloc web només és accessible pels membres del grup <strong>alumni@itaeb.cat</strong>.
                  </p>
                </div>
                <div className="p-1 space-y-1">
                  <button
                    onClick={() => {
                      onChangeUserSession({
                        email: 'alumni.verificat@itaeb.cat',
                        name: 'Marc Martínez (Alumni ITAEB)',
                        isMemberOfAlumniGroup: true,
                        role: 'alumni',
                      });
                      setSessionDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-start gap-2.5 transition ${
                      userSession.isMemberOfAlumniGroup && userSession.role === 'alumni'
                        ? 'bg-sky-50 text-sky-900 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Alumni donat d'alta (Verificat)</div>
                      <div className="text-[11px] text-slate-500">Membre oficial de alumni@itaeb.cat. Accés complet a les ofertes.</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onChangeUserSession({
                        email: 'tac@itaeb.cat',
                        name: 'Coordinador Digital ITAEB',
                        isMemberOfAlumniGroup: true,
                        role: 'coordinador',
                      });
                      setSessionDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-start gap-2.5 transition ${
                      userSession.role === 'coordinador'
                        ? 'bg-sky-50 text-sky-900 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Administrador / Coordinador Digital</div>
                      <div className="text-[11px] text-slate-500">Compte tac@itaeb.cat. Gestió de dades i comprovació de fulls.</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onChangeUserSession({
                        email: 'usuari.extern@gmail.com',
                        name: 'Visitant No Verificat',
                        isMemberOfAlumniGroup: false,
                        role: 'convidat',
                      });
                      setSessionDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-start gap-2.5 transition ${
                      !userSession.isMemberOfAlumniGroup
                        ? 'bg-rose-50 text-rose-900 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Usuari No Membre (Convidat)</div>
                      <div className="text-[11px] text-slate-500">Simula una persona externa o no verificada (missatge d'error).</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Title */}
          <div
            onClick={() => handleSelectPage('inici')}
            className="flex items-center gap-3.5 cursor-pointer group select-none"
          >
            <img
              src="/assets/aistudio/itaeblogo_2da403ed.jpg"
              alt="Logo ITAEB"
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="border-l border-slate-300 pl-3.5 py-0.5">
              <span className="block text-xs uppercase tracking-wider font-semibold text-sky-700">
                ITAEB Alumni
              </span>
              <span className="block text-lg font-bold text-slate-900 tracking-tight leading-tight">
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
                  className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
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

          {/* Mobile menu toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              aria-label="Obrir menú principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
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

import React, { useState, useEffect } from 'react';
import { PageId, UserSession, JobOffer } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { AboutView } from './components/AboutView';
import { AlumniView } from './components/AlumniView';
import { CompaniesView } from './components/CompaniesView';
import { OffersView } from './components/OffersView';
import { CoordinatorView } from './components/CoordinatorView';
import { AccessDenied } from './components/AccessDenied';
import { LoginModal } from './components/LoginModal';
import { INITIAL_OFFERS } from './utils/jobData';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('inici');
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [offers, setOffers] = useState<JobOffer[]>(() => {
    try {
      const saved = localStorage.getItem('itaeb_offers');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading stored offers:', e);
    }
    return INITIAL_OFFERS;
  });

  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);

  // Per defecte: visitant NO autenticat (accés protegit fins que no s'identifiqui com a alumni)
  const [userSession, setUserSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem('itaeb_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isMemberOfAlumniGroup === 'boolean') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading stored session:', e);
    }
    return {
      email: '',
      name: 'Visitant no identificat',
      isMemberOfAlumniGroup: false,
      role: 'convidat',
    };
  });

  // Guardar canvis d'ofertes al localStorage
  useEffect(() => {
    try {
      localStorage.setItem('itaeb_offers', JSON.stringify(offers));
    } catch (e) {
      console.warn('Error saving offers:', e);
    }
  }, [offers]);

  // Guardar canvis de sessió
  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    try {
      localStorage.setItem('itaeb_user_session', JSON.stringify(session));
    } catch (e) {
      console.warn('Error saving session:', e);
    }
  };

  const handleLogout = () => {
    const guestSession: UserSession = {
      email: '',
      name: 'Visitant no identificat',
      isMemberOfAlumniGroup: false,
      role: 'convidat',
    };
    setUserSession(guestSession);
    try {
      localStorage.removeItem('itaeb_user_session');
    } catch (e) {
      console.warn('Error removing session:', e);
    }
    if (currentPage === 'ofertes') {
      setCurrentPage('inici');
    }
  };

  // Support ?autostart=1 or direct page deep-linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page') as PageId | null;
    if (pageParam && ['inici', 'sobre', 'alumni', 'empreses', 'ofertes', 'coordinador'].includes(pageParam)) {
      setCurrentPage(pageParam);
    }
    const roleParam = params.get('role');
    if (roleParam === 'alumni') {
      handleLoginSuccess({
        email: 'alumni.verificat@itaeb.cat',
        name: 'Marc Martínez (Alumni ITAEB)',
        isMemberOfAlumniGroup: true,
        role: 'alumni',
      });
    } else if (roleParam === 'guest' || roleParam === 'unverified') {
      handleLogout();
    }
  }, []);

  const openOffersCount = offers.filter(o => o.estat === 'Oberta').length;

  const handleToggleOfferStatus = (id: string) => {
    setOffers(prev =>
      prev.map(o => {
        if (o.id === id) {
          const nextState: 'Oberta' | 'Tancada' = o.estat === 'Oberta' ? 'Tancada' : 'Oberta';
          return { ...o, estat: nextState };
        }
        return o;
      })
    );
  };

  const handleAddOffer = (newOffer: JobOffer) => {
    setOffers(prev => [newOffer, ...prev]);
  };

  const handleRefreshData = () => {
    setOffers(INITIAL_OFFERS);
    localStorage.removeItem('itaeb_offers');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'inici':
        return (
          <HomeView
            onNavigate={setCurrentPage}
            offers={offers}
            onSelectOffer={setSelectedOffer}
            isMemberOfAlumniGroup={userSession.isMemberOfAlumniGroup}
            onOpenLogin={() => setLoginModalOpen(true)}
          />
        );

      case 'sobre':
        return <AboutView onNavigate={setCurrentPage} />;

      case 'alumni':
        return <AlumniView onNavigate={setCurrentPage} />;

      case 'empreses':
        return <CompaniesView onNavigate={setCurrentPage} />;

      case 'ofertes':
        // Mandatory requirement: Only accessible to members of alumni@itaeb.cat
        if (!userSession.isMemberOfAlumniGroup) {
          return (
            <AccessDenied
              onLoginSuccess={handleLoginSuccess}
              onGoToAlumniInfo={() => setCurrentPage('alumni')}
            />
          );
        }
        return (
          <OffersView
            offers={offers}
            selectedOffer={selectedOffer}
            onSelectOffer={setSelectedOffer}
            onRefreshData={handleRefreshData}
          />
        );

      case 'coordinador':
        return (
          <CoordinatorView
            offers={offers}
            onToggleOfferStatus={handleToggleOfferStatus}
            onAddOffer={handleAddOffer}
          />
        );

      default:
        return (
          <HomeView
            onNavigate={setCurrentPage}
            offers={offers}
            onSelectOffer={setSelectedOffer}
            isMemberOfAlumniGroup={userSession.isMemberOfAlumniGroup}
            onOpenLogin={() => setLoginModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-sky-200 selection:text-sky-900">
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        userSession={userSession}
        onChangeUserSession={handleLoginSuccess}
        openOffersCount={openOffersCount}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      <Footer onNavigate={setCurrentPage} />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onGoToRegistration={() => setCurrentPage('alumni')}
      />
    </div>
  );
}

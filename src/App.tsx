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
import { INITIAL_OFFERS } from './utils/jobData';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('inici');
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

  // Default session: verified alumni member of alumni@itaeb.cat
  const [userSession, setUserSession] = useState<UserSession>({
    email: 'alumni.verificat@itaeb.cat',
    name: 'Marc Martínez (Alumni ITAEB)',
    isMemberOfAlumniGroup: true,
    role: 'alumni',
  });

  // Save offers changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('itaeb_offers', JSON.stringify(offers));
    } catch (e) {
      console.warn('Error saving offers:', e);
    }
  }, [offers]);

  // Support ?autostart=1 or direct page deep-linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page') as PageId | null;
    if (pageParam && ['inici', 'sobre', 'alumni', 'empreses', 'ofertes', 'coordinador'].includes(pageParam)) {
      setCurrentPage(pageParam);
    }
    const roleParam = params.get('role');
    if (roleParam === 'guest' || roleParam === 'unverified') {
      setUserSession({
        email: 'convidat@extern.cat',
        name: 'Visitant Extern',
        isMemberOfAlumniGroup: false,
        role: 'convidat',
      });
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
    // Reset to official initial dataset
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
              onSimulateAlumniLogin={() => {
                setUserSession({
                  email: 'alumni.verificat@itaeb.cat',
                  name: 'Marc Martínez (Alumni ITAEB)',
                  isMemberOfAlumniGroup: true,
                  role: 'alumni',
                });
              }}
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
        onChangeUserSession={setUserSession}
        openOffersCount={openOffersCount}
      />

      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      <Footer onNavigate={setCurrentPage} />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { type SiteSettings } from '@/lib/settings';
import UserMenu from '@/components/UserMenu';
import AuthModal from '@/components/AuthModal';
import ChatWidget from '@/components/ChatWidget';

export default function EvenementsPage() {
  const [selectedMonth, setSelectedMonth] = useState('janvier');
  const [viewMode, setViewMode] = useState('grid');
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    general: {
      name: 'SORadio',
      slogan: 'Just hits, so fun!',
      frequency: '105.7 MHz',
      email: 'contact@soradio.fr',
      phone: '+33 5 56 12 34 56',
      address: '123 Rue de la République, 33000 Bordeaux, France',
    },
    streaming: {
      primaryUrl: '',
      backupUrl: '',
      bitrate: '320',
      format: 'mp3',
      maxListeners: '5000',
      sourcePassword: '',
    },
    social: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      spotify: '',
      tiktok: '',
    },
    email: {
      smtpServer: '',
      smtpPort: '587',
      emailUser: '',
      emailPassword: '',
      audienceNotif: true,
      techAlerts: true,
      newUsers: true,
      dailyReports: false,
    },
    api: {
      publicKey: '',
      secretKey: '',
      webhookStats: '',
      webhookListeners: '',
    },
    system: {
      maintenanceMode: false,
      maintenanceReason: '',
      maintenanceEndTime: '',
    },
  });
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: 'login',
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setTimeout(async () => {
          try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
              console.warn('Erreur session (non-bloquante):', sessionError);
              setUser(null);
              return;
            }

            if (session?.user) {
              setUser(session.user);
            } else {
              setUser(null);
            }
          } catch (error) {
            console.warn('Erreur vérification session (ignorée):', error);
            setUser(null);
          }
        }, 50);

        setTimeout(async () => {
          try {
            const { data: settingsData } = await supabase
              .from('site_settings')
              .select('category, key, value');

            if (settingsData && settingsData.length > 0) {
              const newSettings: any = { ...settings };

              settingsData.forEach((item) => {
                if (newSettings[item.category]) {
                  if ((item.category === 'email' && ['audienceNotif', 'techAlerts', 'newUsers', 'dailyReports'].includes(item.key)) ||
                      (item.category === 'system' && item.key === 'maintenanceMode')) {
                    newSettings[item.category][item.key] = item.value === 'true';
                  } else {
                    newSettings[item.category][item.key] = item.value;
                  }
                }
              });

              setSettings(newSettings);
            }
          } catch (error) {
            console.warn('Erreur chargement paramètres (non-critique):', error);
          }
        }, 200);
      } catch (error) {
        console.warn('Erreur initialisation générale (non-critique):', error);
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = async () => {
    setAuthModal({ ...authModal, isOpen: false });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur après auth:', error);
    }
  };

  const showAuthButtons = !user;
  const showUserMenu = !!user;

  const mois = [
    { key: 'janvier', label: 'Janvier' },
    { key: 'fevrier', label: 'Février' },
    { key: 'mars', label: 'Mars' },
    { key: 'avril', label: 'Avril' },
    { key: 'mai', label: 'Mai' },
    { key: 'juin', label: 'Juin' }
  ];

  const categories = [
    { key: 'concert', label: 'Concert', color: 'bg-purple-100 text-purple-800' },
    { key: 'festival', label: 'Festival', color: 'bg-pink-100 text-pink-800' },
    { key: 'soiree', label: 'Soirée', color: 'bg-indigo-100 text-indigo-800' },
    { key: 'showcase', label: 'Showcase', color: 'bg-orange-100 text-orange-800' }
  ];

  const allEvents = [
    {
      id: 1,
      title: 'Festival Électro Bordeaux 2024',
      category: 'festival',
      date: '15 Janvier',
      time: '20:00',
      location: 'Parc des Expositions',
      price: 'À partir de 45€',
      tickets: 'Disponibles',
      image: 'Electronic music festival in Bordeaux with colorful stage lights, crowd dancing, modern DJ setup, night atmosphere, vibrant neon colors, professional event photography',
      description: 'Le plus grand festival de musique électronique du Sud-Ouest revient avec une programmation exceptionnelle...',
      featured: true
    },
    {
      id: 2,
      title: 'Concert Acoustique au Darwin',
      category: 'concert',
      date: '22 Janvier',
      time: '19:30',
      location: 'Darwin Écosystème',
      price: '25€',
      tickets: 'Dernières places',
      image: 'Intimate acoustic concert in unique industrial venue, warm lighting, small audience, acoustic guitars and microphones, cozy atmosphere',
      description: 'Soirée acoustique intimiste dans l\'écosystème alternatif bordelais...',
      featured: false
    },
    {
      id: 3,
      title: 'Soirée Hip-Hop Underground',
      category: 'soiree',
      date: '28 Janvier',
      time: '21:00',
      location: 'Le Rocher de Palmer',
      price: '18€',
      tickets: 'En vente',
      image: 'Underground hip-hop event with graffiti walls, urban atmosphere, DJ turntables, young crowd, street art background, energetic vibe',
      description: 'Découvrez les talents émergents de la scène hip-hop bordelaise...',
      featured: true
    },
    {
      id: 4,
      title: 'Jazz Sessions Mensuelle',
      category: 'showcase',
      date: '5 Février',
      time: '18:00',
      location: 'Le Blue Note',
      price: '12€',
      tickets: 'Disponibles',
      image: 'Elegant jazz club with saxophone players, dim lighting, intimate setting, classic jazz atmosphere, professional musicians',
      description: 'Rendez-vous mensuel des amateurs de jazz dans l\'ambiance feutrée du Blue Note...',
      featured: false
    }
  ];

  const currentEvents = allEvents.filter(event => {
    const eventMonth = event.date.toLowerCase().includes(selectedMonth.substring(0, 3));
    return eventMonth || selectedMonth === 'janvier'; // Afficher tous les événements pour janvier par défaut
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=Beautiful%20panoramic%20view%20of%20Bordeaux%20city%20with%20Place%20de%20la%20Bourse%20reflecting%20in%20water%2C%20golden%20hour%20lighting%2C%20elegant%20French%20architecture%2C%20stone%20buildings%20along%20Garonne%20river%2C%20warm%20sunset%20colors%2C%20classic%20European%20cityscape%2C%20professional%20photography&width=1920&height=400&seq=bordeaux-header&orientation=landscape')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/60"></div>

        <div className="relative container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <i className="ri-radio-line text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-['Pacifico'] text-white drop-shadow-lg">
                  {settings.general.name}
                </h1>
                <p className="text-orange-300 text-sm font-medium">
                  {settings.general.slogan}
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-white hover:text-orange-300 transition-colors cursor-pointer font-medium">
                Accueil
              </Link>

              <div className="relative group">
                <button className="text-white hover:text-orange-300 transition-colors cursor-pointer font-medium flex items-center space-x-1">
                  <span>Programmes</span>
                  <i className="ri-arrow-down-s-line text-sm"></i>
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-orange-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <Link href="/programmes/morning-show" className="block px-4 py-3 text-gray-800 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <i className="ri-sun-line text-orange-500"></i>
                        <div>
                          <div className="font-medium">Morning Show</div>
                          <div className="text-sm text-gray-600">06:00 - 10:00</div>
                        </div>
                      </div>
                    </Link>
                    <Link href="/programmes/mix-afternoon" className="block px-4 py-3 text-gray-800 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <i className="ri-music-line text-orange-500"></i>
                        <div>
                          <div className="font-medium">Mix Afternoon</div>
                          <div className="text-sm text-gray-600">14:00 - 18:00</div>
                        </div>
                      </div>
                    </Link>
                    <Link href="/programmes/night-session" className="block px-4 py-3 text-gray-800 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <i className="ri-moon-line text-orange-500"></i>
                        <div>
                          <div className="font-medium">Night Session</div>
                          <div className="text-sm text-gray-600">20:00 - 02:00</div>
                        </div>
                      </div>
                    </Link>
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <Link href="/programmes" className="block px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer font-medium">
                        Voir tous les programmes
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button className="text-orange-300 transition-colors cursor-pointer font-medium flex items-center space-x-1">
                  <span>Contenu</span>
                  <i className="ri-arrow-down-s-line text-sm"></i>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-orange-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <Link href="/podcasts" className="block px-4 py-3 text-gray-800 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <i className="ri-headphone-line text-orange-500"></i>
                        <span>Podcasts</span>
                      </div>
                    </Link>
                    <Link href="/playlist" className="block px-4 py-3 text-gray-800 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <i className="ri-play-list-line text-orange-500"></i>
                        <span>Playlist</span>
                      </div>
                    </Link>
                    <Link href="/actualites" className="block px-4 py-3 text-gray-800 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <i className="ri-newspaper-line text-orange-500"></i>
                        <span>Actualités</span>
                      </div>
                    </Link>
                    <Link href="/evenements" className="block px-4 py-3 text-gray-800 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <i className="ri-calendar-event-line text-orange-500"></i>
                        <span>Événements</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              <Link href="/equipe" className="text-white hover:text-orange-300 transition-colors cursor-pointer font-medium">
                Équipe
              </Link>
              <Link href="/contact" className="text-white hover:text-orange-300 transition-colors cursor-pointer font-medium">
                Contact
              </Link>
            </nav>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-orange-300 transition-colors cursor-pointer"
              >
                <i className={`${mobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'} text-2xl`}></i>
              </button>
            </div>

            <div className="hidden md:flex items-center space-x-4 min-w-0">
              {showUserMenu && (
                <div className="flex items-center">
                  <UserMenu />
                </div>
              )}

              {showAuthButtons && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
                    className="text-white hover:text-orange-300 transition-colors cursor-pointer whitespace-nowrap font-medium"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap shadow-lg"
                  >
                    Inscription
                  </button>
                </div>
              )}
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-6 bg-black/20 backdrop-blur-md rounded-xl border border-white/20">
              <div className="p-4 space-y-2">
                <Link href="/" className="block px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                  Accueil
                </Link>
                <Link href="/programmes" className="block px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                  Programmes
                </Link>
                <Link href="/podcasts" className="block px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                  Podcasts
                </Link>
                <Link href="/equipe" className="block px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                  Équipe
                </Link>
                <Link href="/contact" className="block px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                  Contact
                </Link>

                {showAuthButtons && (
                  <div className="border-t border-white/20 pt-4 space-y-2">
                    <button
                      onClick={() => {
                        setAuthModal({ isOpen: true, mode: 'login' });
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    >
                      Connexion
                    </button>
                    <button
                      onClick={() => {
                        setAuthModal({ isOpen: true, mode: 'signup' });
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      Inscription
                    </button>
                  </div>
                )}

                {showUserMenu && (
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex items-center space-x-3 px-4 py-3 text-white">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <i className="ri-user-line text-white text-sm"></i>
                      </div>
                      <span className="font-medium">{user?.email || 'Utilisateur'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-purple-500 to-pink-600">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Événements SORadio</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Rejoignez-nous pour des soirées inoubliables et des rencontres musicales uniques
          </p>
        </div>
      </section>

      {/* Contrôles */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Sélecteur de mois */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-700 font-medium">Mois :</span>
              <div className="flex space-x-2">
                {mois.map((month) => (
                  <button
                    key={month.key}
                    onClick={() => setSelectedMonth(month.key)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedMonth === month.key
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {month.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode d'affichage */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-700 font-medium">Affichage :</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  <i className="ri-grid-line mr-2"></i>
                  Grille
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  <i className="ri-list-check mr-2"></i>
                  Liste
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Événements à la Une */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">À la Une</h2>
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {allEvents.filter(event => event.featured).map((event) => (
              <div key={event.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="relative">
                  <div className="h-64 overflow-hidden">
                    <img
                      src={`https://readdy.ai/api/search-image?query=$%7Bevent.image%7D&width=600&height=400&seq=event-${event.id}&orientation=landscape`}
                      alt={event.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      À la Une
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {event.price}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${categories.find(cat => cat.key === event.category)?.color || 'bg-gray-100 text-gray-700'}`}>
                      {categories.find(cat => cat.key === event.category)?.label || event.category}
                    </span>
                    <span className="text-purple-600 font-semibold">{event.tickets}</span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors">
                    {event.title}
                  </h3>

                  <div className="flex items-center space-x-4 mb-4 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <i className="ri-calendar-line text-purple-500"></i>
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <i className="ri-time-line text-purple-500"></i>
                      <span>{event.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-4 text-gray-600">
                    <i className="ri-map-pin-line text-purple-500"></i>
                    <span>{event.location}</span>
                  </div>

                  <p className="text-gray-600 mb-6 leading-relaxed">{event.description}</p>

                  <div className="flex items-center justify-between">
                    <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap">
                      <i className="ri-ticket-line mr-2"></i>
                      Réserver
                    </button>
                    <div className="flex space-x-2">
                      <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors cursor-pointer">
                        <i className="ri-heart-line text-gray-600"></i>
                      </button>
                      <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors cursor-pointer">
                        <i className="ri-share-line text-gray-600"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Événements du mois */}
          <h2 className="text-3xl font-bold text-gray-800 mb-8 capitalize">
            Événements de {selectedMonth} 2024
          </h2>

          {viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentEvents.filter(event => !event.featured).map((event) => (
                <div key={event.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                  <div className="relative">
                    <div className="h-48 overflow-hidden">
                      <img
                        src={`https://readdy.ai/api/search-image?query=$%7Bevent.image%7D&width=400&height=300&seq=event-grid-${event.id}&orientation=landscape`}
                        alt={event.title}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                        {event.price}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${categories.find(cat => cat.key === event.category)?.color || 'bg-gray-100 text-gray-700'}`}>
                        {categories.find(cat => cat.key === event.category)?.label || event.category}
                      </span>
                      <span className="text-purple-600 font-semibold text-sm">{event.tickets}</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors">
                      {event.title}
                    </h3>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <i className="ri-calendar-line text-purple-500"></i>
                        <span>{event.date} à {event.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <i className="ri-map-pin-line text-purple-500"></i>
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">{event.description}</p>

                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap">
                      <i className="ri-ticket-line mr-2"></i>
                      Réserver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {currentEvents.filter(event => !event.featured).map((event) => (
                <div key={event.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-start space-x-6">
                    <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={`https://readdy.ai/api/search-image?query=$%7Bevent.image%7D&width=200&height=200&seq=event-list-${event.id}&orientation=squarish`}
                        alt={event.title}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${categories.find(cat => cat.key === event.category)?.color || 'bg-gray-100 text-gray-700'}`}>
                          {categories.find(cat => cat.key === event.category)?.label || event.category}
                        </span>
                        <span className="text-purple-600 font-semibold">{event.tickets}</span>
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                          {event.price}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-800 mb-3 hover:text-purple-600 transition-colors">
                        {event.title}
                      </h3>

                      <div className="flex items-center space-x-6 mb-3 text-gray-600">
                        <div className="flex items-center space-x-2">
                          <i className="ri-calendar-line text-purple-500"></i>
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="ri-time-line text-purple-500"></i>
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="ri-map-pin-line text-purple-500"></i>
                          <span>{event.location}</span>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4 leading-relaxed">{event.description}</p>

                      <div className="flex items-center space-x-4">
                        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap">
                          <i className="ri-ticket-line mr-2"></i>
                          Réserver
                        </button>
                        <div className="flex space-x-2">
                          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors cursor-pointer">
                            <i className="ri-heart-line text-gray-600"></i>
                          </button>
                          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors cursor-pointer">
                            <i className="ri-share-line text-gray-600"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Organisez votre événement */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-12 text-center border border-purple-200">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-calendar-event-line text-white text-3xl"></i>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-4">Organisez votre Événement</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              SORadio vous accompagne dans l'organisation de vos événements musicaux
            </p>

            <div className="flex items-center justify-center space-x-4 flex-wrap gap-4">
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap">
                <i className="ri-add-circle-line mr-2"></i>
                Proposer un Événement
              </button>
              <button className="border-2 border-purple-500 text-purple-500 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-phone-line mr-2"></i>
                Nous Contacter
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=Beautiful%20evening%20view%20of%20Bordeaux%20with%20Place%20de%20la%20Bourse%20illuminated%2C%20golden%20reflections%20in%20water%2C%20elegant%20French%20architecture%2C%20warm%20city%20lights%2C%20romantic%20atmosphere%2C%20professional%20night%20photography&width=1920&height=400&seq=bordeaux-footer&orientation=landscape')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40"></div>

        <div className="relative container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <i className="ri-radio-line text-white"></i>
                </div>
                <div>
                  <h3 className="text-xl font-['Pacifico'] text-white">
                    SORadio
                  </h3>
                  <p className="text-orange-400 text-sm">Sud Ouest Radio</p>
                </div>
              </div>
              <p className="text-white/80">{settings.general.slogan}, 24h/24 depuis Bordeaux.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-white/70 hover:text-orange-400 transition-colors cursor-pointer">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link href="/programmes" className="text-white/70 hover:text-orange-400 transition-colors cursor-pointer">
                    Programmes
                  </Link>
                </li>
                <li>
                  <Link href="/podcasts" className="text-white/70 hover:text-orange-400 transition-colors cursor-pointer">
                    Podcasts
                  </Link>
                </li>
                <li>
                  <Link href="/equipe" className="text-white/70 hover:text-orange-400 transition-colors cursor-pointer">
                    Équipe
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-white/70">
                <li className="flex items-center space-x-2">
                  <i className="ri-map-pin-line text-orange-400"></i>
                  <span>Bordeaux, France</span>
                </li>
                <li className="flex items-center space-x-2">
                  <i className="ri-phone-line text-orange-400"></i>
                  <span>{settings.general.phone}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <i className="ri-mail-line text-orange-400"></i>
                  <span>{settings.general.email}</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Fréquences</h4>
              <ul className="space-y-2 text-white/70">
                <li>FM: {settings.general.frequency}</li>
                <li>DAB+: 11D</li>
                <li>Streaming: soradio.fr</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-white/60">&copy; 2024 SORadio - Sud Ouest Radio. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      <ChatWidget user={user} onAuthRequest={() => setAuthModal({ isOpen: true, mode: 'login' })} />

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        mode={authModal.mode as 'login' | 'signup'}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
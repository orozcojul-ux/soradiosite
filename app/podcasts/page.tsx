
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ChatWidget from '@/components/ChatWidget';
import { supabase } from '@/lib/supabase';
import { type SiteSettings } from '@/lib/settings';
import UserMenu from '@/components/UserMenu';
import AuthModal from '@/components/AuthModal';

export default function PodcastsPage() {
  const [selectedCategory, setSelectedCategory] = useState('tous');
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
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: 'login' | 'signup';
  }>({
    isOpen: false,
    mode: 'login' as 'login' | 'signup',
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

  const podcasts = [
    {
      id: 1,
      title: 'Bordeaux Stories',
      category: 'culture',
      host: 'Marie Laurent',
      description: 'Découvrez les histoires fascinantes de Bordeaux et de sa région',
      episodes: 24,
      duration: '25 min',
      image: 'Historic Bordeaux architecture storytelling podcast cover, elegant French buildings, vintage microphone, warm golden lighting, professional podcast studio setup',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 2,
      title: 'Tech Talk',
      category: 'technologie',
      host: 'David Numérique',
      description: 'L\'actualité tech décryptée simplement',
      episodes: 18,
      duration: '30 min',
      image: 'Modern technology podcast studio with digital screens, futuristic microphone setup, blue LED lights, high-tech broadcast equipment',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 3,
      title: 'Musique & Découvertes',
      category: 'musique',
      host: 'Claire Mélodie',
      description: 'Plongez dans l\'univers des artistes émergents',
      episodes: 31,
      duration: '40 min',
      image: 'Music discovery podcast studio with vinyl records, vintage instruments, warm ambient lighting, professional audio equipment, artistic atmosphere',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 4,
      title: 'Cuisine du Sud-Ouest',
      category: 'lifestyle',
      host: 'Chef Antoine',
      description: 'Les secrets de la gastronomie régionale',
      episodes: 15,
      duration: '35 min',
      image: 'French culinary podcast kitchen studio, professional chef with microphone, traditional Southwest France ingredients, warm cooking atmosphere',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 5,
      title: 'Sport Bordelais',
      category: 'sport',
      host: 'Lucas Sport',
      description: 'Toute l\'actualité sportive de la région',
      episodes: 42,
      duration: '45 min',
      image: 'Sports podcast studio with Bordeaux team jerseys, microphone setup, sports equipment, energetic atmosphere, professional broadcast setup',
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 6,
      title: 'Économie Locale',
      category: 'economie',
      host: 'Sarah Business',
      description: 'L\'économie du Sud-Ouest analysée',
      episodes: 28,
      duration: '50 min',
      image: 'Business podcast studio with financial charts, professional microphone, modern office setting, economic analysis graphics, clean corporate atmosphere',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const categories = [
    { key: 'tous', label: 'Tous les podcasts', icon: 'ri-grid-line' },
    { key: 'culture', label: 'Culture', icon: 'ri-building-line' },
    { key: 'technologie', label: 'Technologie', icon: 'ri-smartphone-line' },
    { key: 'musique', label: 'Musique', icon: 'ri-music-line' },
    { key: 'lifestyle', label: 'Lifestyle', icon: 'ri-heart-line' },
    { key: 'sport', label: 'Sport', icon: 'ri-football-line' },
    { key: 'economie', label: 'Économie', icon: 'ri-line-chart-line' }
  ];

  const filteredPodcasts = selectedCategory === 'tous'
    ? podcasts
    : podcasts.filter(podcast => podcast.category === selectedCategory);

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
                <h1 className="text-3xl font-[\\\'Pacifico\\\'] text-white drop-shadow-lg">
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
      <section className="py-20 bg-gradient-to-r from-purple-500 to-indigo-600">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Nos Podcasts</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Écoutez quand vous voulez, où vous voulez. Des contenus exclusifs créés par notre équipe
          </p>
        </div>
      </section>

      {/* Catégories */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex justify-center">
            <div className="bg-gray-50 rounded-2xl p-2">
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === category.key
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <i className={category.icon}></i>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Podcasts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPodcasts.map((podcast) => (
              <div key={podcast.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="relative">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={`https://readdy.ai/api/search-image?query=${podcast.image}&width=400&height=300&seq=podcast-${podcast.id}&orientation=landscape`}
                      alt={podcast.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className={`bg-gradient-to-r ${podcast.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                      {podcast.episodes} épisodes
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <button className="w-full bg-white/90 backdrop-blur-sm text-gray-800 py-3 rounded-xl font-semibold hover:bg-white transition-colors cursor-pointer">
                      <i className="ri-play-fill mr-2"></i>
                      Écouter
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{podcast.title}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <i className="ri-time-line mr-1"></i>
                      {podcast.duration}
                    </div>
                  </div>
                  <p className="text-orange-600 font-semibold mb-3">
                    <i className="ri-user-voice-line mr-2"></i>
                    {podcast.host}
                  </p>
                  <p className="text-gray-600 mb-4 leading-relaxed">{podcast.description}</p>
                  <div className="flex items-center justify-between">
                    <button className="text-orange-500 hover:text-orange-600 font-medium cursor-pointer">
                      Voir tous les épisodes
                    </button>
                    <div className="flex space-x-2">
                      <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-orange-100 transition-colors cursor-pointer">
                        <i className="ri-heart-line text-gray-600"></i>
                      </button>
                      <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-orange-100 transition-colors cursor-pointer">
                        <i className="ri-share-line text-gray-600"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Derniers épisodes */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Derniers Épisodes</h2>
            <p className="text-xl text-gray-600">Ne manquez pas nos dernières publications</p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            {[
              {
                podcast: 'Bordeaux Stories',
                title: 'Les Secrets de la Place de la Bourse',
                date: '15 janvier 2024',
                duration: '28 min',
                plays: '2.1k'
              },
              {
                podcast: 'Tech Talk',
                title: 'Intelligence Artificielle : Révolution ou Évolution ?',
                date: '14 janvier 2024',
                duration: '35 min',
                plays: '1.8k'
              },
              {
                podcast: 'Musique & Découvertes',
                title: 'Portrait : Les Nouveaux Talents Bordelais',
                date: '13 janvier 2024',
                duration: '42 min',
                plays: '3.2k'
              },
              {
                podcast: 'Cuisine du Sud-Ouest',
                title: 'Le Canelé : Histoire d\'une Pâtisserie Iconique',
                date: '12 janvier 2024',
                duration: '31 min',
                plays: '2.7k'
              }
            ].map((episode, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors group">
                <div className="flex items-center space-x-6">
                  <button className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-lg">
                    <i className="ri-play-fill text-white text-xl"></i>
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-orange-500 font-semibold text-sm">{episode.podcast}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 text-sm">{episode.date}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-500 transition-colors">{episode.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <i className="ri-time-line mr-1"></i>
                        {episode.duration}
                      </span>
                      <span className="flex items-center">
                        <i className="ri-play-circle-line mr-1"></i>
                        {episode.plays} lectures
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors cursor-pointer shadow-sm">
                      <i className="ri-download-line text-gray-600"></i>
                    </button>
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors cursor-pointer shadow-sm">
                      <i className="ri-share-line text-gray-600"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-purple-500 to-indigo-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Abonnez-vous à nos Podcasts</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Retrouvez tous nos podcasts sur vos plateformes préférées
          </p>
          <div className="flex items-center justify-center space-x-4 flex-wrap gap-4">
            <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-2">
              <i className="ri-spotify-fill"></i>
              <span>Spotify</span>
            </button>
            <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-2">
              <i className="ri-apple-fill"></i>
              <span>Apple Podcasts</span>
            </button>
            <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-2">
              <i className="ri-google-fill"></i>
              <span>Google Podcasts</span>
            </button>
            <button className="border-2 border-white text-white px-6 py-3 rounded-xl font-bold hover:bg-white hover:text-purple-600 transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-2">
              <i className="ri-rss-line"></i>
              <span>Flux RSS</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer Bordeaux */}
      <footer className="bg-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <i className="ri-radio-line text-white"></i>
                </div>
                <div>
                  <h3 className="text-xl font-[\\\'Pacifico\\\'] text-white">
                    SORadio
                  </h3>
                  <p className="text-orange-400 text-sm">Sud Ouest Radio</p>
                </div>
              </div>
              <p className="text-gray-400">{settings.general.slogan}, 24h/24 depuis Bordeaux.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-orange-400 transition-colors cursor-pointer">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link href="/programmes" className="text-gray-400 hover:text-orange-400 transition-colors cursor-pointer">
                    Programmes
                  </Link>
                </li>
                <li>
                  <Link href="/podcasts" className="text-gray-400 hover:text-orange-400 transition-colors cursor-pointer">
                    Podcasts
                  </Link>
                </li>
                <li>
                  <Link href="/equipe" className="text-gray-400 hover:text-orange-400 transition-colors cursor-pointer">
                    Équipe
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
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
              <ul className="space-y-2 text-gray-400">
                <li>FM: {settings.general.frequency}</li>
                <li>DAB+: 11D</li>
                <li>Streaming: soradio.fr</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 SORadio - Sud Ouest Radio. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      <ChatWidget user={user} onAuthRequest={() => setAuthModal({ isOpen: true, mode: 'login' })} />

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        mode={authModal.mode}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

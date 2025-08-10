
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { type SiteSettings } from '@/lib/settings';
import UserMenu from '@/components/UserMenu';
import AuthModal from '@/components/AuthModal';
import ChatWidget from '@/components/ChatWidget';

export default function ActualitesPage() {
  const [selectedCategory, setSelectedCategory] = useState('toutes');
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

  const actualites = [
    {
      id: 1,
      title: 'Bordeaux : Nouveau Festival de Musique Électronique',
      category: 'culture',
      date: '16 janvier 2024',
      author: 'Marie Laurent',
      image: 'Electronic music festival in Bordeaux with colorful stage lights, crowd dancing, modern DJ setup, night atmosphere, vibrant neon colors',
      excerpt: 'Un nouveau festival dédié à la musique électronique verra le jour cet été sur les quais de Bordeaux...',
      readTime: '3 min',
      featured: true
    },
    {
      id: 2,
      title: 'Les Girondins de Bordeaux Remportent le Derby',
      category: 'sport',
      date: '15 janvier 2024',
      author: 'Lucas Sport',
      image: 'Bordeaux football stadium celebration, team players celebrating victory, enthusiastic crowd, evening match lighting',
      excerpt: 'Match mémorable hier soir au Matmut Atlantique où les Girondins ont dominé leurs adversaires...',
      readTime: '4 min',
      featured: false
    },
    {
      id: 3,
      title: 'Startup Bordelaise Lève 5 Millions d\'Euros',
      category: 'economie',
      date: '14 janvier 2024',
      author: 'Sarah Business',
      image: 'Modern Bordeaux startup office with young entrepreneurs, laptops, innovative workspace, contemporary business environment',
      excerpt: 'TechBordeaux, spécialisée dans l\'IA, annonce une levée de fonds record pour développer ses activités...',
      readTime: '5 min',
      featured: false
    },
    {
      id: 4,
      title: 'Rénovation du Tramway : Nouvelles Lignes Prévues',
      category: 'local',
      date: '13 janvier 2024',
      author: 'Thomas Dubois',
      image: 'Modern Bordeaux tram system renovation, construction work, urban development, public transportation infrastructure',
      excerpt: 'La métropole bordelaise annonce un plan ambitieux d\'extension du réseau de tramway...',
      readTime: '6 min',
      featured: true
    },
    {
      id: 5,
      title: 'Festival des Vins de Bordeaux : Programme 2024',
      category: 'culture',
      date: '12 janvier 2024',
      author: 'Chef Antoine',
      image: 'Bordeaux wine festival with elegant wine tasting setup, vineyard backdrop, sommelier presenting wines, sophisticated atmosphere',
      excerpt: 'Le plus grand événement œnologique de la région dévoile sa programmation exceptionnelle...',
      readTime: '4 min',
      featured: false
    },
    {
      id: 6,
      title: 'Nouvelle Zone Verte au Parc Bordelais',
      category: 'environnement',
      date: '11 janvier 2024',
      author: 'Emma Verte',
      image: 'Beautiful green park in Bordeaux with new landscaping, walking paths, families enjoying nature, sustainable urban development',
      excerpt: 'Un projet écologique d\'envergure transforme l\'un des poumons verts de la ville...',
      readTime: '3 min',
      featured: false
    }
  ];

  const categories = [
    { key: 'toutes', label: 'Toutes les actualités', icon: 'ri-newspaper-line' },
    { key: 'local', label: 'Local', icon: 'ri-map-pin-line' },
    { key: 'culture', label: 'Culture', icon: 'ri-palette-line' },
    { key: 'sport', label: 'Sport', icon: 'ri-football-line' },
    { key: 'economie', label: 'Économie', icon: 'ri-line-chart-line' },
    { key: 'environnement', label: 'Environnement', icon: 'ri-leaf-line' }
  ];

  const filteredActualites = selectedCategory === 'toutes'
    ? actualites
    : actualites.filter(article => article.category === selectedCategory);

  const featuredArticles = actualites.filter(article => article.featured);
  const regularArticles = actualites.filter(article => !article.featured);

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
      <section className="py-20 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Actualités</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Restez informé avec toute l'actualité de Bordeaux et du Sud-Ouest
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
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
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

      {/* Articles à la Une */}
      {selectedCategory === 'toutes' && (
        <section className="py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">À la Une</h2>
            <div className="grid lg:grid-cols-2 gap-8">
              {featuredArticles.map((article) => (
                <div key={article.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                  <div className="relative">
                    <div className="h-64 overflow-hidden">
                      <img
                        src={`https://readdy.ai/api/search-image?query=${article.image}&width=600&height=400&seq=news-${article.id}&orientation=landscape`}
                        alt={article.title}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        À la Une
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                      <span className="capitalize bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {article.category}
                      </span>
                      <span>{article.date}</span>
                      <span>{article.readTime} de lecture</span>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>

                    <p className="text-gray-600 mb-4 leading-relaxed">{article.excerpt}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                          <i className="ri-user-line text-white text-sm"></i>
                        </div>
                        <span className="text-gray-700 font-medium">{article.author}</span>
                      </div>

                      <button className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                        Lire la suite →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Grille d'articles */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {selectedCategory !== 'toutes' && (
            <h2 className="text-3xl font-bold text-gray-800 mb-8 capitalize">
              Actualités {selectedCategory}
            </h2>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(selectedCategory === 'toutes' ? regularArticles : filteredActualites).map((article) => (
              <div key={article.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="relative">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={`https://readdy.ai/api/search-image?query=${article.image}&width=400&height=300&seq=article-${article.id}&orientation=landscape`}
                      alt={article.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-3 text-sm text-gray-500">
                    <span className="capitalize bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {article.category}
                    </span>
                    <span>{article.date}</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>

                  <p className="text-gray-600 mb-4 leading-relaxed">{article.excerpt}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <i className="ri-user-line text-white text-xs"></i>
                      </div>
                      <span className="text-gray-600 text-sm">{article.author}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <i className="ri-time-line"></i>
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-12 text-center border border-blue-200">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-mail-line text-white text-3xl"></i>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-4">Newsletter SORadio</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Recevez chaque matin un résumé de l'actualité bordelaise directement dans votre boîte mail
            </p>

            <div className="max-w-md mx-auto">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="flex-1 px-6 py-4 rounded-l-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                />
                <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-r-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-colors cursor-pointer whitespace-nowrap">
                  S'abonner
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Gratuit • Pas de spam • Désabonnement simple
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Flash Info */}
      <section className="py-8 bg-red-500">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center space-x-4 text-white">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-bold">FLASH INFO</span>
            </div>
            <div className="flex items-center space-x-8 overflow-hidden">
              <span className="whitespace-nowrap animate-pulse">
                🚨 Circulation perturbée sur la rocade suite à un accident
              </span>
              <span className="whitespace-nowrap animate-pulse" style={{ animationDelay: '1s' }}>
                🎵 Concert exceptionnel ce soir à l'Arkéa Arena
              </span>
              <span className="whitespace-nowrap animate-pulse" style={{ animationDelay: '2s' }}>
                ⚽ Les Girondins qualifiés pour les quarts de finale
              </span>
            </div>
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

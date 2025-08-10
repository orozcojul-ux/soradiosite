
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { type SiteSettings } from '@/lib/settings';
import UserMenu from '@/components/UserMenu';
import AuthModal from '@/components/AuthModal';
import ChatWidget from '@/components/ChatWidget';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
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
  const [authInitialized, setAuthInitialized] = useState(true);
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: 'login',
  });

  useEffect(() => {
    console.log('Initialisation page principale ULTRA RAPIDE');

    const initializeApp = async () => {
      try {
        setTimeout(async () => {
          try {
            console.log('Vérification session utilisateur en arrière-plan...');
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
              console.warn('Erreur session (non-bloquante):', sessionError);
              setUser(null);
              return;
            }

            if (session?.user) {
              console.log('Session utilisateur trouvée:', session.user.email);
              setUser(session.user);
            } else {
              console.log('Aucune session utilisateur active');
              setUser(null);
            }
          } catch (error) {
            console.warn('Erreur vérification session (ignorée):', error);
            setUser(null);
          }
        }, 50);

        setTimeout(async () => {
          try {
            console.log('Chargement paramètres site en arrière-plan...');
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
              console.log('Paramètres site mis à jour');
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
        console.log('Événement auth:', event, session?.user?.email || 'no user');

        if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('Déconnexion détectée');
          setUser(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('Connexion réussie détectée:', session.user.email);
          setUser(session.user);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token rafraîchi pour:', session.user.email);
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = async () => {
    console.log('Authentification réussie - Récupération utilisateur');
    setAuthModal({ ...authModal, isOpen: false });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Utilisateur récupéré après auth:', session.user.email);
        setUser(session.user);
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur après auth:', error);
    }
  };

  const showAuthButtons = !user;
  const showUserMenu = !!user;

  console.log('RENDU PAGE PRINCIPAL:');
  console.log('   - Utilisateur connecté:', user?.email || 'Aucun');
  console.log('   - Affichage boutons auth:', showAuthButtons);
  console.log('   - Affichage menu utilisateur:', showUserMenu);

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
                <button className="text-white hover:text-orange-300 transition-colors cursor-pointer font-medium flex items-center space-x-1">
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

      <section className="relative py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
                {settings.general.slogan}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                  depuis Bordeaux
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Découvrez SORadio, la station qui fait vibrer le Sud-Ouest. Musique,
                actualités locales et programmes exclusifs, 24h/24.
              </p>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 mb-8 border border-orange-200">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg"
                  >
                    <i className={`${isPlaying ? 'ri-pause-fill' : 'ri-play-fill'} text-white text-2xl`}></i>
                  </button>
                  <div>
                    <p className="text-gray-800 font-bold text-lg"> En Direct</p>
                    <p className="text-orange-600 font-medium">
                      Morning Show • Sophie & Marc
                    </p>
                    <p className="text-gray-500 text-sm">
                      {settings.general.frequency} • soradio.fr
                    </p>
                  </div>
                </div>
                {isPlaying && (
                  <div className="mt-6 flex items-center justify-center space-x-1">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-orange-500 to-red-500 rounded animate-pulse"
                        style={{
                          height: `${8 + Math.random() * 24}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '1.5s',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <img
                src="https://readdy.ai/api/search-image?query=Modern%20radio%20studio%20with%20professional%20microphones%20and%20mixing%20console%2C%20warm%20lighting%2C%20view%20of%20Bordeaux%20city%20through%20large%20windows%2C%20elegant%20French%20architecture%20visible%20outside%2C%20contemporary%20broadcast%20equipment%2C%20professional%20radio%20host%20workspace%2C%20golden%20hour%20natural%20light&width=600&height=500&seq=hero-studio&orientation=portrait"
                alt="Studio SORadio"
                className="rounded-3xl shadow-2xl object-cover w-full h-96 object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent rounded-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Nos Programmes</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une programmation riche et variée pour accompagner vos journées
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6">
                <i className="ri-sun-line text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Morning Show</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Réveillez-vous en douceur avec Sophie et Marc. Actualités, météo,
                musique et bonne humeur pour bien commencer la journée.
              </p>
              <p className="text-orange-500 font-bold text-lg">06:00 - 10:00</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6">
                <i className="ri-music-line text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Mix Afternoon</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Les meilleurs hits et découvertes musicales. Pop, rock, électro... la
                playlist parfaite pour votre après-midi.
              </p>
              <p className="text-orange-500 font-bold text-lg">14:00 - 18:00</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <i className="ri-moon-line text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Night Session</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Ambiance nocturne avec des sons électroniques et alternatifs. Pour les
                noctambules et les amateurs de découvertes.
              </p>
              <p className="text-orange-500 font-bold text-lg">20:00 - 02:00</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-8">
                Depuis le cœur de
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                  Bordeaux
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                SORadio est née de la passion pour la musique et la culture
                bordelaise. Nous diffusons 24h/24 depuis nos studios du centre-ville,
                en proposant une programmation éclectique qui mélange talents locaux et
                hits internationaux.
              </p>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-2">24/7</div>
                  <div className="text-gray-600 font-medium">Diffusion</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-2">50k+</div>
                  <div className="text-gray-600 font-medium">Auditeurs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-2">15</div>
                  <div className="text-gray-600 font-medium">Animateurs</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://readdy.ai/api/search-image?query=Professional%20radio%20broadcast%20team%20in%20modern%20Bordeaux%20studio%2C%20diverse%20group%20of%20radio%20hosts%20and%20producers%2C%20mixing%20console%20and%20professional%20equipment%2C%20large%20windows%20showing%20Bordeaux%20cityscape%2C%20warm%20professional%20lighting%2C%20contemporary%20French%20radio%20station%20environment&width=600&height=400&seq=team-studio&orientation=landscape"
                alt="Équipe SORadio"
                className="rounded-3xl shadow-2xl object-cover w-full h-80 object-top"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Rejoignez la Communauté SORadio
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Ne manquez aucune de nos émissions et participez à la vie de votre radio
            préférée
          </p>
          <div className="flex items-center justify-center space-x-6">
            <a
              href="#"
              className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
            >
              <i className="ri-facebook-fill text-white text-xl"></i>
            </a>
            <a
              href="#"
              className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
            >
              <i className="ri-instagram-line text-white text-xl"></i>
            </a>
            <a
              href="#"
              className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
            >
              <i className="ri-twitter-x-line text-white text-xl"></i>
            </a>
            <a
              href="#"
              className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
            >
              <i className="ri-spotify-fill text-white text-xl"></i>
            </a>
          </div>
        </div>
      </section>

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

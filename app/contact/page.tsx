
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ChatWidget from '@/components/ChatWidget';
import { supabase } from '@/lib/supabase';
import UserMenu from '@/components/UserMenu';
import AuthModal from '@/components/AuthModal';

export default function ContactPage() {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: 'login',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Simuler l'envoi
    alert('Message envoyé avec succès !');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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

  const handleAuthRequest = () => {
    setAuthModal({ isOpen: true, mode: 'login' });
  };

  const showAuthButtons = !user;
  const showUserMenu = !!user;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
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
                <h1 className="text-3xl font-[\'Pacifico\'] text-white drop-shadow-lg">
                  SORadio
                </h1>
                <p className="text-orange-300 text-sm font-medium">
                  Just hits, so fun!
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
              <Link href="/contact" className="text-orange-300 font-medium cursor-pointer">
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
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Contactez-nous</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Une question, une suggestion, ou envie de nous rejoindre ? N'hésitez pas à nous écrire
          </p>
        </div>
      </section>

      {/* Informations de contact */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-map-pin-line text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Adresse</h3>
              <p className="text-gray-600">
                123 Rue de la République<br />
                33000 Bordeaux, France
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-phone-line text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Téléphone</h3>
              <p className="text-gray-600">
                Standard : +33 5 56 12 34 56<br />
                Antenne : +33 5 56 12 34 57
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-mail-line text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Email</h3>
              <p className="text-gray-600">
                contact@soradio.fr<br />
                redaction@soradio.fr
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Formulaire de contact */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Écrivez-nous</h2>
              <p className="text-xl text-gray-600">Nous vous répondrons dans les plus brefs délais</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <form id="contact-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="Votre nom et prénom"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors pr-8"
                  >
                    <option value="">Choisissez un sujet</option>
                    <option value="general">Question générale</option>
                    <option value="technique">Problème technique</option>
                    <option value="programmation">Programmation</option>
                    <option value="partenariat">Partenariat</option>
                    <option value="recrutement">Recrutement</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    maxLength={500}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-vertical"
                    placeholder="Votre message... (500 caractères maximum)"
                  ></textarea>
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {formData.message.length}/500 caractères
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formData.message.length > 500}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <i className="ri-send-plane-line mr-2"></i>
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Horaires et infos pratiques */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Infos Pratiques</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Horaires d'ouverture</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-semibold text-gray-700">Lundi - Vendredi</span>
                  <span className="text-orange-600 font-bold">08:00 - 19:00</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-semibold text-gray-700">Samedi</span>
                  <span className="text-orange-600 font-bold">09:00 - 17:00</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-semibold text-gray-700">Dimanche</span>
                  <span className="text-gray-500">Fermé</span>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <p className="text-orange-700 font-medium">
                    L'antenne est ouverte 24h/24 !
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Comment nous écouter</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3 mb-2">
                    <i className="ri-radio-line text-orange-500 text-xl"></i>
                    <span className="font-semibold text-gray-700">FM</span>
                  </div>
                  <p className="text-gray-600">105.7 MHz dans toute la région bordelaise</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3 mb-2">
                    <i className="ri-signal-tower-line text-orange-500 text-xl"></i>
                    <span className="font-semibold text-gray-700">DAB+</span>
                  </div>
                  <p className="text-gray-600">Canal 11D - Qualité numérique</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3 mb-2">
                    <i className="ri-global-line text-orange-500 text-xl"></i>
                    <span className="font-semibold text-gray-700">En ligne</span>
                  </div>
                  <p className="text-gray-600">soradio.fr - Partout dans le monde</p>
                </div>
              </div>
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
                  <h3 className="text-xl font-[\'Pacifico\'] text-white">
                    SORadio
                  </h3>
                  <p className="text-orange-400 text-sm">Sud Ouest Radio</p>
                </div>
              </div>
              <p className="text-gray-400">Just hits, so fun!, 24h/24 depuis Bordeaux.</p>
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
                  <span>+33 5 56 12 34 56</span>
                </li>
                <li className="flex items-center space-x-2">
                  <i className="ri-mail-line text-orange-400"></i>
                  <span>contact@soradio.fr</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Fréquences</h4>
              <ul className="space-y-2 text-gray-400">
                <li>FM: 105.7 MHz</li>
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

      <ChatWidget user={user} onAuthRequest={handleAuthRequest} />

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        mode={authModal.mode as 'login' | 'signup'}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

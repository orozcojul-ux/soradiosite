
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ChatWidget from '../../components/ChatWidget';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import UserMenu from '../../components/UserMenu';
import AuthModal from '../../components/AuthModal';

export default function PlaylistPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedGenre, setSelectedGenre] = useState('tous');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: 'login',
  });

  const playlists = [
    {
      id: 1,
      name: 'Morning Hits',
      genre: 'pop',
      tracks: 45,
      duration: '3h 12min',
      image: 'Modern morning playlist cover with sunrise colors, energetic pop music theme, vibrant orange and yellow gradients, musical notes floating',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      id: 2,
      name: 'Rock Legends',
      genre: 'rock',
      tracks: 38,
      duration: '2h 45min',
      image: 'Classic rock playlist cover with electric guitar, vintage amplifier, dark atmosphere with red lighting, legendary rock music theme',
      color: 'from-red-500 to-gray-700'
    },
    {
      id: 3,
      name: 'Jazz Lounge',
      genre: 'jazz',
      tracks: 28,
      duration: '2h 18min',
      image: 'Elegant jazz playlist cover with saxophone silhouette, warm amber lighting, sophisticated lounge atmosphere, musical notes',
      color: 'from-amber-500 to-yellow-600'
    },
    {
      id: 4,
      name: 'Electronic Vibes',
      genre: 'electronic',
      tracks: 52,
      duration: '3h 45min',
      image: 'Futuristic electronic music playlist cover with neon lights, synthesizer, digital waveforms, purple and blue cyber aesthetic',
      color: 'from-purple-500 to-blue-600'
    },
    {
      id: 5,
      name: 'French Touch',
      genre: 'french',
      tracks: 33,
      duration: '2h 28min',
      image: 'French music playlist cover with Eiffel Tower silhouette, tricolor theme, accordion, elegant Parisian atmosphere',
      color: 'from-blue-500 to-red-500'
    },
    {
      id: 6,
      name: 'Chill Out',
      genre: 'chill',
      tracks: 41,
      duration: '3h 05min',
      image: 'Relaxing chill out playlist cover with sunset beach scene, palm trees, peaceful ocean waves, soft pastel colors',
      color: 'from-teal-400 to-blue-500'
    }
  ];

  const currentPlaylist = [
    {
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      duration: '3:20',
      album: 'After Hours'
    },
    {
      title: 'Watermelon Sugar',
      artist: 'Harry Styles',
      duration: '2:54',
      album: 'Fine Line'
    },
    {
      title: 'Levitating',
      artist: 'Dua Lipa',
      duration: '3:23',
      album: 'Future Nostalgia'
    },
    {
      title: 'Good 4 U',
      artist: 'Olivia Rodrigo',
      duration: '2:58',
      album: 'SOUR'
    },
    {
      title: 'Stay',
      artist: 'The Kid LAROI, Justin Bieber',
      duration: '2:21',
      album: 'F*CK LOVE 3'
    }
  ];

  const genres = [
    { key: 'tous', label: 'Toutes les playlists', icon: 'ri-grid-line' },
    { key: 'pop', label: 'Pop', icon: 'ri-music-line' },
    { key: 'rock', label: 'Rock', icon: 'ri-guitar-line' },
    { key: 'jazz', label: 'Jazz', icon: 'ri-music-2-line' },
    { key: 'electronic', label: 'Électronique', icon: 'ri-equalizer-line' },
    { key: 'french', label: 'Français', icon: 'ri-flag-line' },
    { key: 'chill', label: 'Chill', icon: 'ri-leaf-line' }
  ];

  const filteredPlaylists = selectedGenre === 'tous' 
    ? playlists 
    : playlists.filter(playlist => playlist.genre === selectedGenre);

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
    <div className="min-h-screen bg-white">
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
                <button className="text-orange-300 font-medium flex items-center space-x-1">
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

      <section className="py-20 bg-gradient-to-r from-green-500 to-teal-600">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Nos Playlists</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Découvrez nos sélections musicales soigneusement orchestrées pour tous les moments
          </p>
        </div>
      </section>

      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-lg"
                >
                  <i className={`${isPlaying ? 'ri-pause-fill' : 'ri-play-fill'} text-white text-2xl`}></i>
                </button>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">En Direct - Morning Hits</h3>
                  <p className="text-orange-600">Actuellement : {currentPlaylist[currentTrack].title} - {currentPlaylist[currentTrack].artist}</p>
                  <p className="text-gray-500 text-sm">105.7 MHz • soradio.fr</p>
                </div>
              </div>

              {isPlaying && (
                <div className="flex items-center space-x-1">
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
        </div>
      </section>

      <section className="py-8 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex justify-center">
            <div className="bg-gray-50 rounded-2xl p-2">
              <div className="flex flex-wrap justify-center gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre.key}
                    onClick={() => setSelectedGenre(genre.key)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedGenre === genre.key
                        ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <i className={genre.icon}></i>
                    <span>{genre.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlaylists.map((playlist) => (
              <div key={playlist.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="relative">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={`https://readdy.ai/api/search-image?query=$%7Bplaylist.image%7D&width=400&height=300&seq=playlist-${playlist.id}&orientation=landscape`}
                      alt={playlist.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="absolute top-4 left-4">
                    <div className={`bg-gradient-to-r ${playlist.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                      {playlist.tracks} titres
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
                    <h3 className="text-xl font-bold text-gray-800">{playlist.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <i className="ri-time-line mr-1"></i>
                      {playlist.duration}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 capitalize">{playlist.genre}</span>
                    <div className="flex space-x-2">
                      <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-orange-100 transition-colors cursor-pointer">
                        <i className="ri-heart-line text-gray-600"></i>
                      </button>
                      <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-orange-100 transition-colors cursor-pointer">
                        <i className="ri-share-line text-gray-600"></i>
                      </button>
                      <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-orange-100 transition-colors cursor-pointer">
                        <i className="ri-download-line text-gray-600"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Top des Titres</h2>
            <p className="text-xl text-gray-600">Les morceaux les plus écoutés cette semaine</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="space-y-4">
                {currentPlaylist.map((track, index) => (
                  <div key={index} className={`flex items-center space-x-4 p-4 rounded-xl transition-colors hover:bg-white ${index === currentTrack && isPlaying ? 'bg-orange-50 border border-orange-200' : 'hover:bg-white'}`}>
                    <div className="text-2xl font-bold text-orange-500 w-8">
                      #{index + 1}
                    </div>

                    <button 
                      onClick={() => {
                        setCurrentTrack(index);
                        setIsPlaying(true);
                      }}
                      className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-lg"
                    >
                      <i className={`${index === currentTrack && isPlaying ? 'ri-pause-fill' : 'ri-play-fill'} text-white`}></i>
                    </button>

                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{track.title}</h3>
                      <p className="text-gray-600">{track.artist} • {track.album}</p>
                    </div>

                    <div className="text-gray-500 text-sm">
                      {track.duration}
                    </div>

                    <div className="flex space-x-2">
                      <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors cursor-pointer shadow-sm">
                        <i className="ri-heart-line text-gray-600"></i>
                      </button>
                      <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors cursor-pointer shadow-sm">
                        <i className="ri-more-line text-gray-600"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Rejoignez Notre Communauté Audio
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Découvrez de nouveaux contenus, partagez vos favoris et connectez-vous avec des passionnés d'audio
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/profile" 
              className="bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              Créer un Compte
            </Link>
            <Link 
              href="/contact" 
              className="border-2 border-purple-600 text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              Nous Contacter
            </Link>
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

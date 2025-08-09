
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ChatWidget from '../../components/ChatWidget';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

export default function PlaylistPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedGenre, setSelectedGenre] = useState('tous');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);

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
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthRequest = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <i className="ri-radio-line text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-[\'Pacifico\'] text-gray-800">SORadio</h1>
                <p className="text-orange-500 text-sm">Playlists</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-orange-300 transition-colors cursor-pointer font-medium">
                Accueil
              </Link>

              <div className="relative group">
                <button className="text-gray-600 hover:text-orange-300 transition-colors cursor-pointer font-medium flex items-center space-x-1">
                  <span>Programmes</span>
                  <i className="ri-arrow-down-s-line text-sm"></i>
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-orange-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <Link href="/programmes" className="block px-4 py-3 text-gray-800 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <i className="ri-calendar-line text-orange-500"></i>
                        <span>Grille des programmes</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button className="text-orange-500 font-medium flex items-center space-x-1">
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

              <Link href="/equipe" className="text-gray-600 hover:text-orange-300 transition-colors cursor-pointer font-medium">
                Équipe
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-orange-300 transition-colors cursor-pointer font-medium">
                Contact
              </Link>
            </nav>
          </div>
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

      <ChatWidget user={user} onAuthRequest={handleAuthRequest} />
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ChatWidget from '@/components/ChatWidget';

export default function ProgrammesPage() {
  const [selectedDay, setSelectedDay] = useState('lundi');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthRequest = () => {
    window.location.href = '/';
  };

  const programmes = {
    lundi: [
      { time: '06:00 - 10:00', show: 'Morning Show', hosts: ['Sophie Moreau', 'Marc Dubois'], description: 'Réveillez-vous en douceur avec l\'actualité et les hits du moment' },
      { time: '10:00 - 14:00', show: 'Playlist Non-Stop', hosts: ['Système automatique'], description: 'Les meilleurs hits en continu' },
      { time: '14:00 - 18:00', show: 'Mix Afternoon', hosts: ['Julie Moreau'], description: 'Pop, rock, électro... la playlist parfaite pour votre après-midi' },
      { time: '18:00 - 20:00', show: 'Info Express', hosts: ['Thomas Dubois'], description: 'Toute l\'actualité locale et nationale' },
      { time: '20:00 - 02:00', show: 'Night Session', hosts: ['Alex Noir'], description: 'Ambiance nocturne avec des sons électroniques et alternatifs' },
      { time: '02:00 - 06:00', show: 'Nuit Musicale', hosts: ['Playlist automatique'], description: 'Musique douce pour accompagner vos nuits' }
    ],
    mardi: [
      { time: '06:00 - 10:00', show: 'Morning Show', hosts: ['Sophie Moreau', 'Marc Dubois'], description: 'Réveillez-vous en douceur avec l\'actualité et les hits du moment' },
      { time: '10:00 - 12:00', show: 'Bordeaux Stories', hosts: ['Marie Laurent'], description: 'Découvrez les histoires fascinantes de notre région' },
      { time: '12:00 - 14:00', show: 'Playlist Déjeuner', hosts: ['Système automatique'], description: 'Musique variée pour votre pause déjeuner' },
      { time: '14:00 - 18:00', show: 'Mix Afternoon', hosts: ['Julie Moreau'], description: 'Pop, rock, électro... la playlist parfaite pour votre après-midi' },
      { time: '18:00 - 20:00', show: 'Sport Bordelais', hosts: ['Lucas Sport'], description: 'Toute l\'actualité sportive de la région' },
      { time: '20:00 - 02:00', show: 'Night Session', hosts: ['Alex Noir'], description: 'Ambiance nocturne avec des sons électroniques et alternatifs' },
      { time: '02:00 - 06:00', show: 'Nuit Musicale', hosts: ['Playlist automatique'], description: 'Musique douce pour accompagner vos nuits' }
    ],
    mercredi: [
      { time: '06:00 - 10:00', show: 'Morning Show', hosts: ['Sophie Moreau', 'Marc Dubois'], description: 'Réveillez-vous en douceur avec l\'actualité et les hits du moment' },
      { time: '10:00 - 12:00', show: 'Tech Talk', hosts: ['David Numérique'], description: 'L\'actualité tech décryptée simplement' },
      { time: '12:00 - 14:00', show: 'Playlist Déjeuner', hosts: ['Système automatique'], description: 'Musique variée pour votre pause déjeuner' },
      { time: '14:00 - 18:00', show: 'Musique & Découvertes', hosts: ['Claire Mélodie'], description: 'Plongez dans l\'univers des artistes émergents' },
      { time: '18:00 - 20:00', show: 'Info Express', hosts: ['Thomas Dubois'], description: 'Toute l\'actualité locale et nationale' },
      { time: '20:00 - 02:00', show: 'Night Session', hosts: ['Alex Noir'], description: 'Ambiance nocturne avec des sons électroniques et alternatifs' },
      { time: '02:00 - 06:00', show: 'Nuit Musicale', hosts: ['Playlist automatique'], description: 'Musique douce pour accompagner vos nuits' }
    ]
  };

  const days = [
    { key: 'lundi', label: 'Lundi' },
    { key: 'mardi', label: 'Mardi' },
    { key: 'mercredi', label: 'Mercredi' },
    { key: 'jeudi', label: 'Jeudi' },
    { key: 'vendredi', label: 'Vendredi' },
    { key: 'samedi', label: 'Samedi' },
    { key: 'dimanche', label: 'Dimanche' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <i className="ri-radio-line text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-[\'Pacifico\'] text-gray-800">SORadio</h1>
                <p className="text-orange-500 text-sm">Programmes</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-orange-300 transition-colors cursor-pointer font-medium">
                Accueil
              </Link>

              <div className="relative group">
                <button className="text-orange-500 font-medium flex items-center space-x-1">
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
                <button className="text-gray-600 hover:text-orange-300 transition-colors cursor-pointer font-medium flex items-center space-x-1">
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

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Programmes</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Découvrez notre programmation complète et ne manquez plus vos émissions préférées
          </p>
        </div>
      </section>

      {/* Sélecteur de jour */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex justify-center">
            <div className="bg-gray-50 rounded-2xl p-2">
              <div className="flex flex-wrap justify-center gap-2">
                {days.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedDay === day.key
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programme du jour */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center capitalize">
            Programme du {selectedDay}
          </h2>

          <div className="max-w-4xl mx-auto space-y-4">
            {(programmes[selectedDay as keyof typeof programmes] || programmes.lundi).map((slot, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-6">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl font-bold text-lg min-w-0 flex-shrink-0">
                    {slot.time}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{slot.show}</h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <i className="ri-user-voice-line text-orange-500"></i>
                      <span className="text-orange-600 font-semibold">
                        {slot.hosts.join(', ')}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{slot.description}</p>
                  </div>

                  <div className="flex space-x-2 flex-shrink-0">
                    <button className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors cursor-pointer">
                      <i className="ri-heart-line text-orange-600"></i>
                    </button>
                    <button className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors cursor-pointer">
                      <i className="ri-notification-line text-orange-600"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ChatWidget user={user} onAuthRequest={handleAuthRequest} />
    </div>
  );
}

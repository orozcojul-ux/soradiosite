
'use client';

import { useState } from 'react';
import Link from 'next/link';
import ChatWidget from '@/components/ChatWidget';

export default function EvenementsPage() {
  const [selectedMonth, setSelectedMonth] = useState('janvier');
  const [viewMode, setViewMode] = useState('grid');

  const evenements = {
    janvier: [
      {
        id: 1,
        title: 'Festival Électronique SORadio',
        date: '25 janvier 2024',
        time: '20:00',
        location: 'Hangar 14, Bordeaux',
        category: 'concert',
        price: '25€',
        image: 'Electronic music festival stage with vibrant LED lights, DJ performing, energetic crowd dancing, modern sound system, night atmosphere',
        description: 'Une soirée électronique exceptionnelle avec les meilleurs DJs de la région',
        featured: true,
        tickets: 'Disponibles'
      },
      {
        id: 2,
        title: 'Soirée Jazz au Wine Bar',
        date: '28 janvier 2024',
        time: '19:30',
        location: 'Wine Bar du Port, Bordeaux',
        category: 'jazz',
        price: '15€',
        image: 'Intimate jazz performance in elegant wine bar, saxophone player, warm ambient lighting, sophisticated audience',
        description: 'Concert intime avec le quartet de Claire Mélodie',
        featured: false,
        tickets: 'Disponibles'
      }
    ],
    fevrier: [
      {
        id: 3,
        title: 'SORadio Live Session',
        date: '10 février 2024',
        time: '18:00',
        location: 'Studios SORadio',
        category: 'live',
        price: 'Gratuit',
        image: 'Live radio session recording with acoustic guitars, intimate studio setting, professional microphones, warm lighting',
        description: 'Session acoustique en direct avec des artistes locaux',
        featured: true,
        tickets: 'Inscription requise'
      },
      {
        id: 4,
        title: 'Nuit de la Radio',
        date: '20 février 2024',
        time: '21:00',
        location: 'Place de la Bourse, Bordeaux',
        category: 'special',
        price: 'Gratuit',
        image: 'Night radio event at Place de la Bourse with illuminated buildings, outdoor stage, community gathering, festive atmosphere',
        description: 'Événement spécial célébrant les 10 ans de SORadio',
        featured: true,
        tickets: 'Accès libre'
      }
    ],
    mars: [
      {
        id: 5,
        title: 'Tremplin Jeunes Talents',
        date: '15 mars 2024',
        time: '20:00',
        location: 'Théâtre Femina, Bordeaux',
        category: 'competition',
        price: '12€',
        image: 'Young musicians performing on stage, talent competition, diverse musical instruments, supportive audience',
        description: 'Concours pour découvrir les nouveaux talents de la région',
        featured: false,
        tickets: 'Disponibles'
      }
    ]
  };

  const categories = [
    { key: 'tous', label: 'Tous les événements', icon: 'ri-calendar-line', color: 'bg-gray-100 text-gray-700' },
    { key: 'concert', label: 'Concerts', icon: 'ri-music-line', color: 'bg-orange-100 text-orange-700' },
    { key: 'jazz', label: 'Jazz', icon: 'ri-music-2-line', color: 'bg-yellow-100 text-yellow-700' },
    { key: 'live', label: 'Live Sessions', icon: 'ri-live-line', color: 'bg-red-100 text-red-700' },
    { key: 'special', label: 'Événements Spéciaux', icon: 'ri-star-line', color: 'bg-purple-100 text-purple-700' },
    { key: 'competition', label: 'Concours', icon: 'ri-trophy-line', color: 'bg-green-100 text-green-700' }
  ];

  const mois = [
    { key: 'janvier', label: 'Janvier 2024' },
    { key: 'fevrier', label: 'Février 2024' },
    { key: 'mars', label: 'Mars 2024' }
  ];

  const allEvents = Object.values(evenements).flat();
  const currentEvents = evenements[selectedMonth as keyof typeof evenements] || [];

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
                <p className="text-orange-500 text-sm">Événements</p>
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

      <ChatWidget />
    </div>
  );
}

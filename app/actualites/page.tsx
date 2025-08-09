
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ChatWidget from '@/components/ChatWidget';

export default function ActualitesPage() {
  const [selectedCategory, setSelectedCategory] = useState('toutes');
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
                <p className="text-orange-500 text-sm">Actualités</p>
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
                        src={`https://readdy.ai/api/search-image?query=$%7Barticle.image%7D&width=600&height=400&seq=news-${article.id}&orientation=landscape`}
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
                      src={`https://readdy.ai/api/search-image?query=$%7Barticle.image%7D&width=400&height=300&seq=article-${article.id}&orientation=landscape`}
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
              <span className="whitespace-nowrap animate-pulse" style={{animationDelay: '1s'}}>
                🎵 Concert exceptionnel ce soir à l'Arkéa Arena
              </span>
              <span className="whitespace-nowrap animate-pulse" style={{animationDelay: '2s'}}>
                ⚽ Les Girondins qualifiés pour les quarts de finale
              </span>
            </div>
          </div>
        </div>
      </section>

      <ChatWidget user={user} onAuthRequest={handleAuthRequest} />
    </div>
  );
}

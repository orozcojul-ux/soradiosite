
'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <i className="ri-radio-line text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-['Pacifico'] text-white">SORadio</h1>
                <p className="text-orange-400 text-sm">Sud Ouest Radio</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-white hover:text-orange-400 transition-colors cursor-pointer">Accueil</Link>
              <Link href="/programmes" className="text-white hover:text-orange-400 transition-colors cursor-pointer">Programmes</Link>
              <Link href="/podcasts" className="text-white hover:text-orange-400 transition-colors cursor-pointer">Podcasts</Link>
              <Link href="/equipe" className="text-white hover:text-orange-400 transition-colors cursor-pointer">Équipe</Link>
              <Link href="/contact" className="text-white hover:text-orange-400 transition-colors cursor-pointer">Contact</Link>
            </nav>
            <button className="md:hidden text-white">
              <i className="ri-menu-line text-2xl"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20radio%20studio%20with%20professional%20microphones%2C%20mixing%20console%2C%20neon%20lights%2C%20urban%20cityscape%20visible%20through%20window%2C%20purple%20and%20orange%20ambient%20lighting%2C%20high-tech%20broadcast%20equipment%2C%20contemporary%20design%2C%20professional%20radio%20broadcasting%20environment%20with%20Bordeaux%20city%20skyline%20in%20background&width=1920&height=1080&seq=hero-radio-studio&orientation=landscape')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
              SO<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Radio</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              La voix du Sud-Ouest qui résonne dans le cœur de Bordeaux. Découvrez nos programmes, nos podcasts et notre équipe passionnée.
            </p>
            
            {/* Player Controls */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 max-w-md mx-auto mb-8 border border-white/10">
              <div className="flex items-center justify-center space-x-6">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                >
                  <i className={`${isPlaying ? 'ri-pause-fill' : 'ri-play-fill'} text-white text-2xl`}></i>
                </button>
              </div>
              <div className="mt-4 text-center">
                <p className="text-white font-semibold">En Direct</p>
                <p className="text-orange-400 text-sm">Morning Show - 09:00</p>
              </div>
              {isPlaying && (
                <div className="mt-4 flex items-center justify-center space-x-1">
                  <div className="w-1 h-4 bg-orange-500 rounded animate-pulse"></div>
                  <div className="w-1 h-6 bg-red-500 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-3 bg-orange-500 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-1 h-5 bg-red-500 rounded animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="w-1 h-2 bg-orange-500 rounded animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/programmes" className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap">
                Découvrir nos Programmes
              </Link>
              <Link href="/podcasts" className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-black transition-colors cursor-pointer whitespace-nowrap">
                Écouter les Podcasts
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </section>

      {/* Programs Section */}
      <section className="py-20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Nos Programmes</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Une programmation riche et variée pour tous les goûts, du matin au soir
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-orange-500/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6">
                <i className="ri-sun-line text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Morning Show</h3>
              <p className="text-gray-300 mb-4">Réveillez-vous en douceur avec notre émission matinale pleine d'énergie et de bonne humeur.</p>
              <p className="text-orange-400 font-semibold">06:00 - 10:00</p>
            </div>

            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-orange-500/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6">
                <i className="ri-music-line text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Mix Afternoon</h3>
              <p className="text-gray-300 mb-4">Les meilleurs hits et découvertes musicales pour accompagner votre après-midi.</p>
              <p className="text-orange-400 font-semibold">14:00 - 18:00</p>
            </div>

            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-orange-500/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6">
                <i className="ri-moon-line text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Night Session</h3>
              <p className="text-gray-300 mb-4">Ambiance nocturne avec des sons électroniques et alternatifs pour les noctambules.</p>
              <p className="text-orange-400 font-semibold">20:00 - 02:00</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                La Radio du <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Sud-Ouest</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                SORadio est née de la passion pour la musique et la culture bordelaise. Nous diffusons 24h/24 depuis le cœur de Bordeaux, en proposant une programmation éclectique qui mélange découvertes artistiques locales et hits internationaux.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-2">24/7</div>
                  <div className="text-gray-300">Diffusion</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-2">50k+</div>
                  <div className="text-gray-300">Auditeurs</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://readdy.ai/api/search-image?query=Professional%20radio%20studio%20in%20Bordeaux%20with%20modern%20broadcasting%20equipment%2C%20microphones%2C%20mixing%20console%2C%20city%20view%20through%20windows%2C%20warm%20lighting%2C%20contemporary%20design%2C%20radio%20host%20working%2C%20professional%20broadcast%20environment%20with%20French%20radio%20aesthetic&width=600&height=400&seq=about-studio&orientation=landscape"
                alt="Studio SORadio"
                className="rounded-2xl shadow-2xl object-cover w-full h-80"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Rejoignez la Communauté SORadio
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Ne manquez aucune de nos émissions, podcasts et événements exclusifs. Suivez-nous sur nos réseaux sociaux.
          </p>
          <div className="flex items-center justify-center space-x-6">
            <a href="#" className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
              <i className="ri-facebook-fill text-white text-xl"></i>
            </a>
            <a href="#" className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
              <i className="ri-instagram-line text-white text-xl"></i>
            </a>
            <a href="#" className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
              <i className="ri-twitter-x-line text-white text-xl"></i>
            </a>
            <a href="#" className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
              <i className="ri-spotify-fill text-white text-xl"></i>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-md border-t border-white/10 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <i className="ri-radio-line text-white"></i>
                </div>
                <div>
                  <h3 className="text-xl font-['Pacifico'] text-white">SORadio</h3>
                  <p className="text-orange-400 text-sm">Sud Ouest Radio</p>
                </div>
              </div>
              <p className="text-gray-400">La voix du Sud-Ouest, 24h/24 depuis Bordeaux.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-orange-400 transition-colors cursor-pointer">Accueil</Link></li>
                <li><Link href="/programmes" className="text-gray-400 hover:text-orange-400 transition-colors cursor-pointer">Programmes</Link></li>
                <li><Link href="/podcasts" className="text-gray-400 hover:text-orange-400 transition-colors cursor-pointer">Podcasts</Link></li>
                <li><Link href="/equipe" className="text-gray-400 hover:text-orange-400 transition-colors cursor-pointer">Équipe</Link></li>
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
                  <span>05 56 XX XX XX</span>
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
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 SORadio - Sud Ouest Radio. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

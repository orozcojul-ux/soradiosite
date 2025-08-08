'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <i className="ri-radio-line text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-['Pacifico'] text-white">SORadio</h1>
                <p className="text-orange-400 text-sm">Sud Ouest Radio</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-white hover:text-orange-400 transition-colors cursor-pointer">Accueil</Link>
              <Link href="/programmes" className="text-white hover:text-orange-400 transition-colors cursor-pointer">Programmes</Link>
              <Link href="/podcasts" className="text-white hover:text-orange-400 transition-colors cursor-pointer">Podcasts</Link>
              <Link href="/equipe" className="text-white hover:text-orange-400 transition-colors cursor-pointer">Équipe</Link>
              <Link href="/contact" className="text-orange-400 cursor-pointer">Contact</Link>
            </nav>
            <button className="md:hidden text-white">
              <i className="ri-menu-line text-2xl"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20radio%20station%20contact%20center%20with%20professional%20communication%20equipment%2C%20urban%20Bordeaux%20cityscape%2C%20professional%20broadcasting%20studio%20interior%2C%20warm%20orange%20and%20purple%20lighting%2C%20contemporary%20design%2C%20radio%20waves%20visualization%2C%20professional%20customer%20service%20environment%20with%20French%20radio%20station%20aesthetic&width=1920&height=800&seq=contact-hero&orientation=landscape')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Contactez</span> SORadio
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Une question, une suggestion ou envie de rejoindre l'équipe ? Nous sommes à votre écoute !
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-white/10">
              <h2 className="text-3xl font-bold text-white mb-8">Envoyez-nous un message</h2>
              
              {isSubmitted && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <i className="ri-check-line text-green-400 text-xl"></i>
                    <p className="text-green-400 font-semibold">Message envoyé avec succès !</p>
                  </div>
                </div>
              )}

              <form id="contact-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">Nom complet</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none text-sm"
                      placeholder="Votre nom et prénom"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none text-sm"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Sujet</label>
                  <div className="relative">
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 pr-8 text-white focus:border-orange-500 focus:outline-none text-sm appearance-none"
                    >
                      <option value="">Sélectionnez un sujet</option>
                      <option value="general">Question générale</option>
                      <option value="programmation">Suggestion de programmation</option>
                      <option value="technique">Problème technique</option>
                      <option value="partenariat">Proposition de partenariat</option>
                      <option value="candidature">Candidature spontanée</option>
                      <option value="autre">Autre</option>
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    maxLength={500}
                    rows={6}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none text-sm resize-none"
                    placeholder="Votre message..."
                  />
                  <p className="text-gray-400 text-sm mt-2">{formData.message.length}/500 caractères</p>
                </div>

                <button
                  type="submit"
                  disabled={formData.message.length > 500}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <i className="ri-send-plane-line mr-2"></i>
                  Envoyer le message
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Informations de contact */}
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6">Nos coordonnées</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <i className="ri-map-pin-line text-white"></i>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Adresse</h4>
                      <p className="text-gray-300">123 Rue de la Radio<br/>33000 Bordeaux, France</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <i className="ri-phone-line text-white"></i>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Téléphone</h4>
                      <p className="text-gray-300">05 56 78 90 12</p>
                      <p className="text-sm text-orange-400">Lun-Ven: 9h-18h</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <i className="ri-mail-line text-white"></i>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Email</h4>
                      <p className="text-gray-300">contact@soradio.fr</p>
                      <p className="text-sm text-orange-400">Réponse sous 24h</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horaires d'antenne */}
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6">Horaires d'antenne</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Lundi - Vendredi</span>
                    <span className="text-orange-400 font-semibold">24h/24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Weekend</span>
                    <span className="text-orange-400 font-semibold">24h/24</span>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-sm text-gray-400">
                      Diffusion continue sur FM 105.7 MHz, DAB+ et en streaming sur soradio.fr
                    </p>
                  </div>
                </div>
              </div>

              {/* Réseaux sociaux */}
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6">Suivez-nous</h3>
                <div className="grid grid-cols-2 gap-4">
                  <a href="#" className="flex items-center space-x-3 bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                    <i className="ri-facebook-fill text-blue-400 text-2xl"></i>
                    <span className="text-white">Facebook</span>
                  </a>
                  <a href="#" className="flex items-center space-x-3 bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                    <i className="ri-instagram-line text-pink-400 text-2xl"></i>
                    <span className="text-white">Instagram</span>
                  </a>
                  <a href="#" className="flex items-center space-x-3 bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                    <i className="ri-twitter-x-line text-gray-400 text-2xl"></i>
                    <span className="text-white">Twitter</span>
                  </a>
                  <a href="#" className="flex items-center space-x-3 bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                    <i className="ri-spotify-fill text-green-400 text-2xl"></i>
                    <span className="text-white">Spotify</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Nous trouver</h2>
            <p className="text-xl text-gray-300">SORadio se situe au cœur de Bordeaux</p>
          </div>
          
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2828.5947244707975!2d-0.5791799!3d44.8378!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd5527e8f751ca81%3A0x796386037b397a89!2sBordeaux%2C%20France!5e0!3m2!1sen!2sus!4v1639581234567!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-lg"
              ></iframe>
            </div>
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
                  <span>05 56 78 90 12</span>
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

'use client';

import { useState } from 'react';
import Link from 'next/link';
import ChatWidget from '@/components/ChatWidget';

export default function EquipePage() {
  const [selectedDepartment, setSelectedDepartment] = useState('tous');

  const equipe = [
    {
      id: 1,
      name: 'Sophie Moreau',
      role: 'Animatrice Matinale',
      department: 'animation',
      show: 'Morning Show (6h-10h)',
      bio: 'Passionnée de radio depuis 15 ans, Sophie apporte sa bonne humeur chaque matin pour réveiller le Sud-Ouest en douceur.',
      image: 'Professional female radio host with blonde hair, warm smile, modern radio studio, microphone headset, morning show atmosphere',
      social: {
        instagram: '@sophie_soradio',
        twitter: '@sophiemoreau_radio'
      },
      specialties: ['Animation matinale', 'Interviews', 'Météo']
    },
    {
      id: 2,
      name: 'Marc Dubois',
      role: 'Co-Animateur Matinal',
      department: 'animation',
      show: 'Morning Show (6h-10h)',
      bio: 'Ancien journaliste reconverti dans l\'animation, Marc apporte son humour et sa culture générale au Morning Show.',
      image: 'Professional male radio host with beard, friendly expression, modern broadcast studio, professional microphone setup',
      social: {
        twitter: '@marcdubois_radio',
        linkedin: 'marc-dubois-radio'
      },
      specialties: ['Animation', 'Actualités', 'Sport']
    },
    {
      id: 3,
      name: 'Julie Moreau',
      role: 'Animatrice Après-Midi',
      department: 'animation',
      show: 'Mix Afternoon (14h-18h)',
      bio: 'DJ et animatrice talentueuse, Julie fait vibrer vos après-midis avec les meilleurs sons du moment.',
      image: 'Young energetic female DJ with colorful hair, turntables and mixing console, afternoon radio show setup, vibrant lighting',
      social: {
        instagram: '@julie_mixafternoon',
        spotify: 'julie-moreau-dj'
      },
      specialties: ['Mix musical', 'Découvertes', 'Électronique']
    },
    {
      id: 4,
      name: 'Alex Noir',
      role: 'Animateur Nocturne',
      department: 'animation',
      show: 'Night Session (20h-2h)',
      bio: 'Spécialiste de la musique électronique, Alex transforme vos nuits en voyage musical unique.',
      image: 'Cool male night DJ with dark aesthetic, electronic music setup, neon lighting, professional mixing equipment',
      social: {
        soundcloud: 'alex-noir-official',
        instagram: '@alexnoir_nightsession'
      },
      specialties: ['Électronique', 'Techno', 'Progressive']
    },
    {
      id: 5,
      name: 'Thomas Dubois',
      role: 'Journaliste',
      department: 'redaction',
      show: 'Info Express (18h-20h)',
      bio: 'Journaliste expérimenté, Thomas couvre l\'actualité locale et nationale avec rigueur et objectivité.',
      image: 'Professional news anchor in formal attire, newsroom setup, serious expression, broadcast journalism equipment',
      social: {
        twitter: '@thomas_infoexpress',
        linkedin: 'thomas-dubois-journaliste'
      },
      specialties: ['Actualités', 'Politique', 'Économie']
    },
    {
      id: 6,
      name: 'Marie Laurent',
      role: 'Journaliste Culture',
      department: 'redaction',
      show: 'Bordeaux Stories (Podcast)',
      bio: 'Spécialisée dans la culture bordelaise, Marie nous fait découvrir les trésors cachés de notre région.',
      image: 'Cultural journalist woman interviewing in historic Bordeaux location, elegant professional style, vintage architecture background',
      social: {
        instagram: '@marie_bordeauxstories',
        twitter: '@marie_culture33'
      },
      specialties: ['Culture', 'Histoire locale', 'Patrimoine']
    },
    {
      id: 7,
      name: 'Lucas Sport',
      role: 'Journaliste Sportif',
      department: 'redaction',
      show: 'Sport Bordelais (Podcast)',
      bio: 'Ancien joueur professionnel, Lucas suit de près l\'actualité sportive régionale et nationale.',
      image: 'Sports journalist male with athletic build, stadium background, sports equipment, professional broadcaster appearance',
      social: {
        twitter: '@lucas_sport33',
        instagram: '@lucassport_soradio'
      },
      specialties: ['Football', 'Rugby', 'Sports locaux']
    },
    {
      id: 8,
      name: 'David Technique',
      role: 'Directeur Technique',
      department: 'technique',
      show: 'Gestion technique',
      bio: 'Ingénieur du son passionné, David s\'assure que SORadio diffuse toujours avec la meilleure qualité.',
      image: 'Technical director in professional audio control room, multiple screens and mixing consoles, focused engineering work',
      social: {
        linkedin: 'david-technique-audio'
      },
      specialties: ['Ingénierie audio', 'Diffusion', 'Maintenance']
    },
    {
      id: 9,
      name: 'Sarah Business',
      role: 'Directrice Commerciale',
      department: 'commercial',
      show: 'Économie Locale (Podcast)',
      bio: 'Experte en développement commercial, Sarah gère les partenariats et anime le podcast économique.',
      image: 'Professional business woman in modern office, confident pose, business meeting setup, contemporary corporate environment',
      social: {
        linkedin: 'sarah-business-soradio',
        twitter: '@sarah_economie33'
      },
      specialties: ['Partenariats', 'Économie', 'Business local']
    },
    {
      id: 10,
      name: 'Emma Creative',
      role: 'Responsable Communication',
      department: 'communication',
      show: 'Réseaux sociaux',
      bio: 'Créative et dynamique, Emma anime nos réseaux sociaux et coordonne nos événements.',
      image: 'Young creative woman with laptop and smartphone, social media content creation, colorful modern office, artistic background',
      social: {
        instagram: '@emma_soradio',
        tiktok: '@emma_creative33'
      },
      specialties: ['Social media', 'Événementiel', 'Créativité']
    }
  ];

  const departments = [
    { key: 'tous', label: 'Toute l\'équipe', icon: 'ri-team-line', color: 'from-gray-500 to-gray-600' },
    { key: 'animation', label: 'Animation', icon: 'ri-mic-line', color: 'from-orange-500 to-red-500' },
    { key: 'redaction', label: 'Rédaction', icon: 'ri-news-line', color: 'from-blue-500 to-indigo-500' },
    { key: 'technique', label: 'Technique', icon: 'ri-settings-line', color: 'from-green-500 to-emerald-500' },
    { key: 'commercial', label: 'Commercial', icon: 'ri-briefcase-line', color: 'from-purple-500 to-violet-500' },
    { key: 'communication', label: 'Communication', icon: 'ri-megaphone-line', color: 'from-pink-500 to-rose-500' }
  ];

  const filteredEquipe = selectedDepartment === 'tous' 
    ? equipe 
    : equipe.filter(member => member.department === selectedDepartment);

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
                <p className="text-orange-500 text-sm">Équipe</p>
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

              <Link href="/equipe" className="text-orange-500 font-medium cursor-pointer">
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
      <section className="py-20 bg-gradient-to-r from-indigo-500 to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Notre Équipe</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Rencontrez les voix et les talents qui font vibrer SORadio chaque jour
          </p>
        </div>
      </section>

      {/* Statistiques équipe */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">15+</div>
              <div className="text-gray-600">Années d\'expérience moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">10</div>
              <div className="text-gray-600">Membres passionnés</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">24/7</div>
              <div className="text-gray-600">À votre service</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">100%</div>
              <div className="text-gray-600">Bordelais de cœur</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filtres par département */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex justify-center">
            <div className="bg-gray-50 rounded-2xl p-2">
              <div className="flex flex-wrap justify-center gap-2">
                {departments.map((dept) => (
                  <button
                    key={dept.key}
                    onClick={() => setSelectedDepartment(dept.key)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedDepartment === dept.key
                        ? `bg-gradient-to-r ${dept.color} text-white shadow-lg`
                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <i className={dept.icon}></i>
                    <span>{dept.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grille de l\'équipe */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEquipe.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="relative">
                  <div className="h-64 overflow-hidden">
                    <img
                      src={`https://readdy.ai/api/search-image?query=${member.image}&width=400&height=400&seq=team-${member.id}&orientation=portrait`}
                      alt={member.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Badge département */}
                  <div className="absolute top-4 left-4">
                    <span className={`bg-gradient-to-r ${departments.find(d => d.key === member.department)?.color || 'from-gray-500 to-gray-600'} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                      {departments.find(d => d.key === member.department)?.label || member.department}
                    </span>
                  </div>
                  
                  {/* Réseaux sociaux en overlay */}
                  <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {member.social.instagram && (
                      <a
                        href={`https://instagram.com/${member.social.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                      >
                        <i className="ri-instagram-line text-white text-sm"></i>
                      </a>
                    )}
                    {member.social.twitter && (
                      <a
                        href={`https://twitter.com/${member.social.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                      >
                        <i className="ri-twitter-x-line text-white text-sm"></i>
                      </a>
                    )}
                    {member.social.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${member.social.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                      >
                        <i className="ri-linkedin-line text-white text-sm"></i>
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{member.name}</h3>
                  <p className="text-indigo-600 font-semibold mb-2">{member.role}</p>
                  
                  {member.show && (
                    <p className="text-orange-500 font-medium mb-3">
                      {member.show}
                    </p>
                  )}
                  
                  <p className="text-gray-600 mb-4 leading-relaxed text-sm">{member.bio}</p>
                  
                  {/* Spécialités */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {member.specialties.map((specialty, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {specialty}
                      </span>
                    ))}
                  </div>
                  
                  {/* Bouton contact */}
                  <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap">
                    <i className="ri-mail-line mr-2"></i>
                    Contacter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Rejoindre l\'équipe */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-12 text-center border border-indigo-200">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-team-line text-white text-3xl"></i>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Rejoindre SORadio</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Vous êtes passionné de radio ? Nous recherchons toujours de nouveaux talents pour enrichir notre équipe
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-mic-line text-indigo-600 text-2xl"></i>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Animation</h3>
                <p className="text-gray-600 text-sm">Animateurs, DJ, présentateurs</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-news-line text-purple-600 text-2xl"></i>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Journalisme</h3>
                <p className="text-gray-600 text-sm">Journalistes, reporters, rédacteurs</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-settings-line text-pink-600 text-2xl"></i>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Technique</h3>
                <p className="text-gray-600 text-sm">Ingénieurs son, techniciens</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-4 flex-wrap gap-4">
              <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap">
                <i className="ri-file-text-line mr-2"></i>
                Candidature Spontanée
              </button>
              <button className="border-2 border-indigo-500 text-indigo-500 px-8 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-eye-line mr-2"></i>
                Voir les Offres
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section Valeurs */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Nos Valeurs</h2>
            <p className="text-xl text-gray-600">Ce qui nous unit et nous guide au quotidien</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-heart-line text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Passion</h3>
              <p className="text-gray-600 leading-relaxed">
                Nous vivons et respirons la radio. Cette passion se ressent dans chaque émission, chaque interview, chaque note de musique.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-team-line text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Solidarité</h3>
              <p className="text-gray-600 leading-relaxed">
                Une équipe soudée qui se soutient mutuellement pour offrir le meilleur contenu à nos auditeurs.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-leaf-line text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Authenticité</h3>
              <p className="text-gray-600 leading-relaxed">
                Nous restons authentiques et proches de nos auditeurs, en gardant nos valeurs bordelaises.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ChatWidget />
    </div>
  );
}


// No changes in the imports
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define the MaintenanceModeProps interface
interface MaintenanceModeProps {
  isActive: boolean;
  onStatusChange: (isActive: boolean) => void;
}

// Export the MaintenanceMode function
export default function MaintenanceMode({ isActive, onStatusChange }: MaintenanceModeProps) {
  // Define and initialize the component's state variables
  const [estimatedEnd, setEstimatedEnd] = useState('');
  const [reason, setReason] = useState('');
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [accessType, setAccessType] = useState<'admin' | 'beta'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [betaKey, setBetaKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to check maintenance status on load
  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  // Function to check and update maintenance status
  const checkMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('category', 'system')
        .in('key', ['maintenanceMode', 'maintenanceReason', 'maintenanceEndTime']);

      if (!error && data) {
        data.forEach((item) => {
          if (item.key === 'maintenanceMode') {
            const maintenanceActive = item.value === 'true';
            onStatusChange(maintenanceActive);
          } else if (item.key === 'maintenanceReason') {
            setReason(item.value || '');
          } else if (item.key === 'maintenanceEndTime') {
            setEstimatedEnd(item.value || '');
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du mode maintenance:', error);
    }
  };

  // Function to handle admin login
  const handleAdminLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        setError('Accès administrateur requis');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Access granted, reload page
      window.location.reload();
    } catch (error) {
      setError('Erreur de connexion');
      setLoading(false);
    }
  };

  // Function to handle beta access
  const handleBetaAccess = async () => {
    setLoading(true);
    setError('');

    try {
      // Check if key has already been used on this browser
      const usedBetaKeys = JSON.parse(localStorage.getItem('used_beta_keys') || '[]');
      if (usedBetaKeys.includes(betaKey)) {
        setError('Cette clé beta a déjà été utilisée sur ce navigateur');
        setLoading(false);
        return;
      }

      // Check beta key in database
      const { data: betaKeyData, error } = await supabase
        .from('beta_keys')
        .select('*')
        .eq('key_code', betaKey)
        .eq('is_active', true)
        .single();

      if (error || !betaKeyData) {
        setError('Clé beta invalide ou désactivée');
        setLoading(false);
        return;
      }

      // Check if key has not expired
      const now = new Date();
      const expiryDate = new Date(betaKeyData.expires_at);

      if (now > expiryDate) {
        setError('Cette clé beta a expiré');
        setLoading(false);
        return;
      }

      // Check if key has not reached its usage limit
      if (betaKeyData.usage_count >= betaKeyData.max_usage) {
        setError('Cette clé beta a atteint sa limite d\'utilisations');
        setLoading(false);
        return;
      }

      // Increment usage count atomically
      const newUsageCount = betaKeyData.usage_count + 1;
      const shouldDeactivate = newUsageCount >= betaKeyData.max_usage;

      const { error: updateError } = await supabase
        .from('beta_keys')
        .update({
          usage_count: newUsageCount,
          last_used_at: new Date().toISOString(),
          // Automatically deactivate if limit is reached
          is_active: !shouldDeactivate,
        })
        .eq('id', betaKeyData.id)
        // Optimistic check: ensure count hasn't changed in the meantime
        .eq('usage_count', betaKeyData.usage_count);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du compteur:', updateError);
        if (updateError.message.includes('usage_count')) {
          setError('Cette clé vient d\'être utilisée par quelqu\'un d\'autre');
        } else {
          setError('Erreur lors de la validation de la clé');
        }
        setLoading(false);
        return;
      }

      // Mark this key as used in localStorage to prevent reuse
      const updatedUsedKeys = [...usedBetaKeys, betaKey];
      localStorage.setItem('used_beta_keys', JSON.stringify(updatedUsedKeys));

      // Store beta access in localStorage
      localStorage.setItem('beta_access', 'true');
      localStorage.setItem('beta_timestamp', Date.now().toString());
      localStorage.setItem('beta_expiry', expiryDate.getTime().toString());
      localStorage.setItem('beta_key_used', betaKey);

      // Access granted, reload page
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setError('Erreur lors de la vérification');
      setLoading(false);
    }
  };

  // Function to open access modal
  const openAccessModal = (type: 'admin' | 'beta') => {
    setAccessType(type);
    setShowAccessModal(true);
    setError('');
    setEmail('');
    setPassword('');
    setBetaKey('');
  };

  // Function to open app modal
  const openAppModal = () => {
    setShowAppModal(true);
  };

  // Function to open player modal
  const openPlayerModal = () => {
    setShowPlayerModal(true);
  };

  console.log('MaintenanceMode - isActive:', isActive);

  if (!isActive) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 min-h-screen bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: `url('https://readdy.ai/api/search-image?query=Beautiful%20panoramic%20view%20of%20Bordeaux%20city%20with%20Place%20de%20la%20Bourse%20reflecting%20in%20Garonne%20river%20water%20at%20golden%20hour%2C%20warm%20sunset%20lighting%2C%20elegant%20French%20stone%20architecture%2C%20classic%20European%20cityscape%20with%20radio%20transmission%20towers%20and%20vintage%20antennas%20in%20the%20sky%2C%20professional%20photography%20with%20subtle%20radio%20wave%20effects%20and%20floating%20musical%20notes%2C%20atmospheric%20and%20dreamy&width=1920&height=1080&seq=bordeaux-maintenance-radio&orientation=landscape')`,
      }}
    >
      {/* Overlay avec dégradé */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/80"></div>

      {/* Éléments radio animés flottants */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Ondes radio circulaires pulsantes */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`radio-wave-${i}`}
            className="absolute rounded-full border-2 border-orange-400/20 animate-ping"
            style={{
              width: `${150 + i * 100}px`,
              height: `${150 + i * 100}px`,
              top: '20%',
              left: '10%',
              animationDelay: `${i * 0.5}s`,
              animationDuration: '4s',
            }}
          />
        ))}

        {/* Antennes radio stylisées aux coins */}
        <div className="absolute top-8 left-8 w-16 h-16 opacity-30 animate-pulse">
          <div className="relative">
            <div className="w-1 h-12 bg-orange-400 rounded-full mx-auto"></div>
            <div className="w-8 h-1 bg-orange-400 rounded-full mx-auto -mt-6"></div>
            <div className="w-6 h-1 bg-orange-400 rounded-full mx-auto mt-1"></div>
            <div className="w-4 h-1 bg-orange-400 rounded-full mx-auto mt-1"></div>
            {/* Signaux pulsants */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-orange-400/60 animate-pulse"
                style={{
                  transform: `translateX(-50%) rotate(${-30 + i * 30}deg)`,
                  transformOrigin: 'bottom center',
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="absolute top-8 right-8 w-16 h-16 opacity-30 animate-pulse" style={{ animationDelay: '1s' }}>
          <div className="relative">
            <div className="w-1 h-12 bg-red-400 rounded-full mx-auto"></div>
            <div className="w-8 h-1 bg-red-400 rounded-full mx-auto -mt-6"></div>
            <div className="w-6 h-1 bg-red-400 rounded-full mx-auto mt-1"></div>
            <div className="w-4 h-1 bg-red-400 rounded-full mx-auto mt-1"></div>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-red-400/60 animate-pulse"
                style={{
                  transform: `translateX(-50%) rotate(${-30 + i * 30}deg)`,
                  transformOrigin: 'bottom center',
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Icônes radio flottantes */}
        {
          [
            { icon: 'ri-headphone-line', top: '15%', left: '75%', delay: '0s', color: 'text-blue-400' },
            { icon: 'ri-mic-line', top: '25%', left: '85%', delay: '1s', color: 'text-green-400' },
            { icon: 'ri-radio-line', top: '70%', left: '15%', delay: '2s', color: 'text-purple-400' },
            { icon: 'ri-broadcast-line', top: '60%', left: '85%', delay: '3s', color: 'text-yellow-400' },
            { icon: 'ri-volume-up-line', top: '80%', left: '75%', delay: '4s', color: 'text-pink-400' },
            { icon: 'ri-sound-module-line', top: '40%', left: '90%', delay: '2.5s', color: 'text-cyan-400' },
          ].map((item, i) => (
            <div
              key={i}
              className={`absolute w-8 h-8 ${item.color} opacity-20 animate-bounce`}
              style={{
                top: item.top,
                left: item.left,
                animationDelay: item.delay,
                animationDuration: '3s',
              }}
            >
              <i className={`${item.icon} text-2xl`}></i>
            </div>
          ))
        }

        {/* Visualiseurs audio animés sur les côtés */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex space-x-1">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-orange-500 to-red-500 rounded-full animate-pulse"
              style={{
                height: `${20 + Math.random() * 40}px`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s',
              }}
            />
          ))}
        </div>

        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex space-x-1">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full animate-pulse"
              style={{
                height: `${20 + Math.random() * 40}px`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s',
              }}
            />
          ))}
        </div>

        {/* Ondes sonores en arc */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute border-2 border-orange-400/20 rounded-full animate-ping"
              style={{
                width: `${60 + i * 30}px`,
                height: `${30 + i * 15}px`,
                borderRadius: `${60 + i * 30}px ${60 + i * 30}px 0 0`,
                left: `${-30 - i * 15}px`,
                bottom: '0',
                animationDelay: `${i * 0.4}s`,
                animationDuration: '3s',
              }}
            />
          ))}
        </div>

        {/* Particules flottantes */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-orange-400/30 rounded-full animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}

        {/* Fréquences radio */}
        <div className="absolute top-1/3 left-8 opacity-20">
          <div className="flex items-end space-x-1">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-gradient-to-t from-orange-500 to-yellow-500 rounded-t animate-pulse"
                style={{
                  height: `${10 + Math.random() * 30}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '2s',
                }}
              />
            ))}
          </div>
        </div>

        <div className="absolute top-1/3 right-8 opacity-20">
          <div className="flex items-end space-x-1">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t animate-pulse"
                style={{
                  height: `${10 + Math.random() * 30}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '2s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center space-y-8 max-w-2xl mx-auto">
          {/* Logo avec animation */}
          <div className="relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <i className="ri-radio-line text-white text-5xl"></i>
            </div>
            {/* Ondes radio autour du logo */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-orange-400/30 rounded-full animate-ping"
                style={{
                  width: `${140 + i * 20}px`,
                  height: `${140 + i * 20}px`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '3s',
                }}
              />
            ))}
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-[ 'Pacifico' ] text-white mb-4 animate-fade-in">
              SORadio
            </h1>
            <p className="text-xl md:text-2xl text-orange-300 font-light animate-fade-in" style={{ animationDelay: '0.5s' }}>
              La voix du Sud-Ouest
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl animate-fade-in" style={{ animationDelay: '1s' }}>
            <div className="w-16 h-16 mx-auto mb-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <i className="ri-tools-line text-yellow-400 text-2xl animate-spin" style={{ animationDuration: '3s' }}></i>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              Maintenance en Cours
            </h2>

            {reason && (
              <p className="text-orange-200 text-lg mb-6">
                {reason}
              </p>
            )}

            {estimatedEnd && (
              <div className="bg-orange-500/10 rounded-lg p-4 mb-6 border border-orange-400/20">
                <p className="text-orange-300">
                  <i className="ri-time-line mr-2"></i>
                  Retour prévu : {new Date(estimatedEnd).toLocaleString('fr-FR')}
                </p>
              </div>
            )}

            <p className="text-gray-300 mb-8">
              Nous travaillons actuellement sur des améliorations pour vous offrir la meilleure expérience d'écoute possible.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={openAppModal}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:scale-105 transition-all cursor-pointer whitespace-nowrap shadow-lg hover:shadow-blue-500/25"
              >
                <i className="ri-smartphone-line mr-2"></i>
                Application Mobile
              </button>
              <button
                onClick={openPlayerModal}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:scale-105 transition-all cursor-pointer whitespace-nowrap shadow-lg hover:shadow-green-500/25"
              >
                <i className="ri-play-circle-line mr-2"></i>
                Streaming Direct
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center space-x-6">
                <a
                  href="https://facebook.com/soradio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-600/30 transition-colors cursor-pointer"
                >
                  <i className="ri-facebook-fill text-xl"></i>
                </a>
                <a
                  href="https://instagram.com/soradio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-pink-600/20 rounded-full flex items-center justify-center text-pink-400 hover:bg-pink-600/30 transition-colors cursor-pointer"
                >
                  <i className="ri-instagram-line text-xl"></i>
                </a>
                <a
                  href="https://x.com/soradio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-sky-600/20 rounded-full flex items-center justify-center text-sky-400 hover:bg-sky-600/30 transition-colors cursor-pointer"
                >
                  <i className="ri-twitter-x-line text-xl"></i>
                </a>
                <a
                  href="https://youtube.com/@soradio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center text-red-400 hover:bg-red-600/30 transition-colors cursor-pointer"
                >
                  <i className="ri-youtube-fill text-xl"></i>
                </a>
              </div>

              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
                <button
                  onClick={() => openAccessModal('admin')}
                  className="text-gray-400 hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Accès Administrateur
                </button>
                <span className="hidden sm:inline text-gray-600">•</span>
                <button
                  onClick={() => openAccessModal('beta')}
                  className="text-gray-400 hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Accès Beta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'accès */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {accessType === 'admin' ? 'Accès Administrateur' : 'Accès Beta'}
              </h3>
              <button
                onClick={() => setShowAccessModal(false)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <i className="ri-close-line text-white"></i>
              </button>
            </div>

            {error && (
              <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 border border-red-400/30">
                <i className="ri-error-warning-line mr-2"></i>
                {error}
              </div>
            )}

            <div className="space-y-4">
              {accessType === 'admin' ? (
                <>
                  <div>
                    <label className="block text-orange-200 text-sm mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none"
                      placeholder="admin@soradio.fr"
                    />
                  </div>
                  <div>
                    <label className="block text-orange-200 text-sm mb-2">Mot de passe</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    onClick={handleAdminLogin}
                    disabled={loading || !email || !password}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                        Connexion...
                      </>
                    ) : (
                      <>
                        <i className="ri-login-circle-line mr-2"></i>
                        Se connecter
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-orange-200 text-sm mb-2">Clé Beta</label>
                    <input
                      type="text"
                      value={betaKey}
                      onChange={(e) => setBetaKey(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-purple-400 focus:outline-none font-mono"
                      placeholder="SORADIO-BETA-XXXXX-XXXXX"
                    />
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
                    <p className="text-purple-300 text-sm">
                      <i className="ri-information-line mr-2"></i>
                      Entrez votre clé beta pour accéder au site pendant la maintenance.
                    </p>
                  </div>
                  <button
                    onClick={handleBetaAccess}
                    disabled={loading || !betaKey}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                        Vérification...
                      </>
                    ) : (
                      <>
                        <i className="ri-key-line mr-2"></i>
                        Valider l'accès
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Application Mobile */}
      {showAppModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Télécharger l'Application</h3>
              <button
                onClick={() => setShowAppModal(false)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <i className="ri-close-line text-white"></i>
              </button>
            </div>

            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="ri-smartphone-line text-white text-3xl"></i>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-white mb-2">SORadio Mobile</h4>
                <p className="text-gray-300 text-sm">
                  Écoutez SORadio partout avec notre application mobile gratuite
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg inline-block">
                <div className="w-32 h-32 bg-black flex items-center justify-center text-white text-xs text-center leading-tight">
                  QR CODE<br />
                  Scan pour<br />
                  télécharger<br />
                  l'application
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-orange-200 text-sm">Scannez le QR code ou téléchargez directement :</p>

                <div className="flex space-x-3">
                  <div className="flex-1 bg-black/30 rounded-lg p-3 flex items-center space-x-3 hover:bg-black/40 transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                      <i className="ri-apple-line text-black"></i>
                    </div>
                    <div className="text-left">
                      <div className="text-white text-sm font-medium">App Store</div>
                      <div className="text-gray-400 text-xs">iOS</div>
                    </div>
                  </div>

                  <div className="flex-1 bg-black/30 rounded-lg p-3 flex items-center space-x-3 hover:bg-black/40 transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                      <i className="ri-google-play-line text-white"></i>
                    </div>
                    <div className="text-left">
                      <div className="text-white text-sm font-medium">Play Store</div>
                      <div className="text-gray-400 text-xs">Android</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20">
                <p className="text-blue-300 text-sm">
                  <i className="ri-information-line mr-2"></i>
                  Fonctionnalités : Écoute en direct, podcasts, notifications d'émissions, mode hors-ligne
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Player Streaming */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-lg w-full border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Player SORadio</h3>
              <button
                onClick={() => setShowPlayerModal(false)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <i className="ri-close-line text-white"></i>
              </button>
            </div>

            <div className="space-y-6">
              {/* Album Art / Logo */}
              <div className="relative">
                <div className="w-48 h-48 mx-auto bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <i className="ri-radio-line text-white text-6xl"></i>
                  {/* Ondes autour du player */}
                  {isPlaying && [...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute border-2 border-white/30 rounded-2xl animate-ping"
                      style={{
                        width: `${200 + i * 20}px`,
                        height: `${200 + i * 20}px`,
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: '2s',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Infos en cours */}
              <div className="text-center">
                <h4 className="text-2xl font-bold text-white mb-2">SORadio Live</h4>
                <p className="text-orange-300 mb-2">Morning Show - Sophie & Marc</p>
                <p className="text-gray-400 text-sm">En cours : "Blinding Lights" - The Weeknd</p>
              </div>

              {/* Contrôles */}
              <div className="flex items-center justify-center space-x-6">
                <button className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <i className="ri-skip-back-line text-white text-xl"></i>
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center hover:scale-105 transition-all cursor-pointer shadow-lg"
                >
                  <i className={`${isPlaying ? 'ri-pause-line' : 'ri-play-line'} text-white text-2xl`}></i>
                </button>

                <button className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <i className="ri-skip-forward-line text-white text-xl"></i>
                </button>
              </div>

              {/* Barre de volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Volume</span>
                  <span>HD 320 kbps</span>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="ri-volume-down-line text-gray-400"></i>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <i className="ri-volume-up-line text-gray-400"></i>
                </div>
              </div>

              {/* Visualiseur audio */}
              {isPlaying && (
                <div className="flex items-end justify-center space-x-1 h-16">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 bg-gradient-to-t from-orange-500 to-red-500 rounded-full animate-pulse"
                      style={{
                        height: `${20 + Math.random() * 40}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '1s',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Statut */}
              <div className="bg-green-500/10 rounded-lg p-3 border border-green-400/20">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">
                    {isPlaying ? 'En direct - 3,250 auditeurs' : 'Prêt à écouter'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles CSS pour les animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

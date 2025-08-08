
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MaintenanceModeProps {
  isActive: boolean;
  onStatusChange: (isActive: boolean) => void;
}

export default function MaintenanceMode({ isActive, onStatusChange }: MaintenanceModeProps) {
  const [estimatedEnd, setEstimatedEnd] = useState('');
  const [reason, setReason] = useState('Maintenance programmée du système');
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessType, setAccessType] = useState<'admin' | 'beta'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [betaKey, setBetaKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Vérifier le statut de maintenance au chargement
    checkMaintenanceStatus();
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('category', 'system')
        .in('key', ['maintenanceMode', 'maintenanceReason', 'maintenanceEndTime']);

      if (!error && data) {
        data.forEach(item => {
          if (item.key === 'maintenanceMode') {
            const maintenanceActive = item.value === 'true';
            onStatusChange(maintenanceActive);
          } else if (item.key === 'maintenanceReason') {
            setReason(item.value || 'Maintenance programmée du système');
          } else if (item.key === 'maintenanceEndTime') {
            setEstimatedEnd(item.value || '');
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du mode maintenance:', error);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Connexion admin
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      // Vérifier si l'utilisateur est admin
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

      // Accès autorisé - recharger la page
      window.location.reload();
    } catch (error) {
      setError('Erreur de connexion');
      setLoading(false);
    }
  };

  const handleBetaAccess = async () => {
    setLoading(true);
    setError('');

    try {
      // Vérifier la clé beta dans la base de données
      const { data: betaKeys, error } = await supabase
        .from('beta_keys')
        .select('*')
        .eq('key_code', betaKey)
        .eq('is_active', true)
        .single();

      if (error || !betaKeys) {
        setError('Clé beta invalide ou expirée');
        setLoading(false);
        return;
      }

      // Vérifier si la clé n'est pas expirée
      const now = new Date();
      const expiryDate = new Date(betaKeys.expires_at);

      if (now > expiryDate) {
        setError('Cette clé beta a expiré');
        setLoading(false);
        return;
      }

      // Vérifier si la clé n'a pas déjà atteint sa limite d'utilisations
      if (betaKeys.usage_count >= betaKeys.max_usage) {
        // Désactiver automatiquement la clé épuisée
        await supabase
          .from('beta_keys')
          .update({ is_active: false })
          .eq('id', betaKeys.id);

        setError('Cette clé beta a atteint sa limite d\'utilisations');
        setLoading(false);
        return;
      }

      // Incrémenter le compteur d'utilisation
      const newUsageCount = betaKeys.usage_count + 1;
      const shouldDeactivate = newUsageCount >= betaKeys.max_usage;

      const { error: updateError } = await supabase
        .from('beta_keys')
        .update({ 
          usage_count: newUsageCount,
          last_used_at: new Date().toISOString(),
          // Désactiver automatiquement si la limite est atteinte
          is_active: !shouldDeactivate
        })
        .eq('id', betaKeys.id);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du compteur:', updateError);
        setError('Erreur lors de la validation de la clé');
        setLoading(false);
        return;
      }

      // Stocker l'accès beta dans le localStorage
      localStorage.setItem('beta_access', 'true');
      localStorage.setItem('beta_timestamp', Date.now().toString());
      localStorage.setItem('beta_expiry', expiryDate.getTime().toString());

      // Accès beta autorisé - recharger la page
      window.location.reload();
    } catch (error) {
      setError('Erreur lors de la vérification');
      setLoading(false);
    }
  };

  const openAccessModal = (type: 'admin' | 'beta') => {
    setAccessType(type);
    setShowAccessModal(true);
    setError('');
    setEmail('');
    setPassword('');
    setBetaKey('');
  };

  console.log('MaintenanceMode - isActive:', isActive);

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-purple-500/20"></div>

      <div className="relative max-w-2xl mx-auto px-6 text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <i className="ri-tools-line text-white text-4xl"></i>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Site en Maintenance
          </h1>

          <p className="text-xl text-gray-300 mb-8">
            {reason}
          </p>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <i className="ri-radio-line text-white text-xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-[\'Pacifico\'] text-white">SORadio</h2>
                <p className="text-orange-400">Sud Ouest Radio</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              Nous effectuons actuellement une maintenance sur notre site web pour améliorer votre expérience.
            </p>

            {estimatedEnd && (
              <div className="bg-orange-500/20 rounded-lg p-4 mb-6">
                <p className="text-orange-200">
                  <i className="ri-time-line mr-2"></i>
                  Fin estimée: {new Date(estimatedEnd).toLocaleString('fr-FR')}
                </p>
              </div>
            )}

            {/* Accès Spéciaux */}
            <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
              <p className="text-gray-300 text-sm mb-4">Accès spéciaux disponibles</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => openAccessModal('admin')}
                  className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer whitespace-nowrap border border-red-400/30"
                >
                  <i className="ri-admin-line mr-2"></i>
                  Accès Admin
                </button>
                <button
                  onClick={() => openAccessModal('beta')}
                  className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-lg hover:bg-purple-500/30 transition-colors cursor-pointer whitespace-nowrap border border-purple-400/30"
                >
                  <i className="ri-key-line mr-2"></i>
                  Accès Beta
                </button>
              </div>
            </div>

            <div className="space-y-4 text-gray-300">
              <p>En attendant, vous pouvez nous écouter sur:</p>
              <div className="flex justify-center space-x-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <i className="ri-radio-line text-blue-400"></i>
                  </div>
                  <p className="text-sm">FM 105.7 MHz</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <i className="ri-smartphone-line text-purple-400"></i>
                  </div>
                  <p className="text-sm">Application Mobile</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <i className="ri-headphone-line text-green-400"></i>
                  </div>
                  <p className="text-sm">Streaming Direct</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-gray-400 text-sm">
                Pour toute urgence: +33 5 56 12 34 56
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <a href="https://facebook.com/soradio" className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
            <i className="ri-facebook-fill text-white"></i>
          </a>
          <a href="https://instagram.com/soradio" className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
            <i className="ri-instagram-line text-white"></i>
          </a>
          <a href="https://twitter.com/soradio" className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
            <i className="ri-twitter-x-line text-white"></i>
          </a>
        </div>
      </div>

      {/* Modal d'accès */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full mx-4 border border-white/20">
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

            {accessType === 'admin' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-orange-200 text-sm mb-2">Email Administrateur</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none"
                    placeholder="admin@soradio.fr"
                  />
                </div>
                <div>
                  <label className="block text-orange-200 text-sm mb-2">Mot de Passe</label>
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
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                      Vérification...
                    </>
                  ) : (
                    <>
                      <i className="ri-login-circle-line mr-2"></i>
                      Accéder au Site
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-orange-200 text-sm mb-2">Clé d'Accès Beta</label>
                  <input
                    type="text"
                    value={betaKey}
                    onChange={(e) => setBetaKey(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-purple-400 focus:outline-none font-mono"
                    placeholder="SORADIO-BETA-XXXX"
                  />
                  <p className="text-gray-400 text-xs mt-2">
                    Contactez l'équipe SORadio pour obtenir votre clé beta
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
                      Accéder en Beta
                    </>
                  )}
                </button>
                <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
                  <p className="text-purple-300 text-sm">
                    <i className="ri-information-line mr-2"></i>
                    L'accès beta vous permet de tester les nouvelles fonctionnalités en avant-première
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

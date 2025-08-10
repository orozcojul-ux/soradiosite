
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onAuthSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, mode, onAuthSuccess }: AuthModalProps) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [message, setMessage] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [banDetails, setBanDetails] = useState<{
    banEndDate: string;
    banReason: string;
    isPermanent: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage('');

    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout authentification - Déblocage forcé');
      setLoading(false);
      setMessage('❌ Timeout de connexion. Veuillez réessayer.');
    }, 15000);

    try {
      console.log(`🔄 Début authentification: ${currentMode} pour ${formData.email}`);

      if (currentMode === 'signup') {
        console.log('📝 Tentative d\'inscription...');

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName.trim(),
            }
          }
        });

        clearTimeout(timeoutId);

        if (authError) {
          console.error('❌ Erreur inscription:', authError);
          throw authError;
        }

        if (authData.user) {
          console.log('✅ Inscription réussie:', authData.user.email);
          setMessage('🎉 Inscription réalisée avec succès ! Vérifiez vos emails pour confirmer votre compte.');

          setTimeout(() => {
            try {
              onClose();
              if (onAuthSuccess) onAuthSuccess();
            } catch (error) {
              console.warn('Erreur fermeture modal:', error);
            }
          }, 2500);
        } else {
          throw new Error('Aucune donnée utilisateur retournée');
        }

      } else {
        console.log('🔑 Tentative de connexion...');

        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Erreur connexion:', error);
          throw error;
        }

        if (data.user) {
          console.log('✅ Connexion Supabase réussie, VÉRIFICATION BANNISSEMENT CRITIQUE...');

          // VÉRIFICATION CRITIQUE IMMÉDIATE DU BANNISSEMENT
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, email, full_name, banned_until, ban_reason, is_admin')
              .eq('id', data.user.id)
              .single();

            if (profileError) {
              console.error('❌ ERREUR CRITIQUE récupération profil:', profileError);
              // DÉCONNEXION IMMÉDIATE si on ne peut pas vérifier
              await supabase.auth.signOut();
              throw new Error('Impossible de vérifier le statut du compte - Connexion refusée par sécurité');
            }

            if (!profile) {
              console.error('❌ PROFIL INTROUVABLE');
              await supabase.auth.signOut();
              throw new Error('Profil utilisateur introuvable - Connexion refusée');
            }

            // VÉRIFICATION BANNISSEMENT ABSOLUE
            if (profile.banned_until) {
              const banEndDate = new Date(profile.banned_until);
              const now = new Date();

              console.log('🔍 VÉRIFICATION BANNISSEMENT:');
              console.log('   - Date de fin de ban:', banEndDate.toISOString());
              console.log('   - Date actuelle:', now.toISOString());
              console.log('   - Utilisateur banni?', banEndDate > now);

              if (banEndDate > now) {
                console.error('🚫 UTILISATEUR BANNI DÉTECTÉ - DÉCONNEXION IMMÉDIATE');

                // DÉCONNEXION FORCÉE IMMÉDIATE
                await supabase.auth.signOut();

                // Vérifier si c'est un bannissement permanent (plus de 10 ans dans le futur)
                const tenYearsFromNow = new Date();
                tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);
                const isPermanent = banEndDate > tenYearsFromNow;

                // Préparer les détails du bannissement pour la popup
                setBanDetails({
                  banEndDate: banEndDate.toLocaleString('fr-FR'),
                  banReason: profile.ban_reason || 'Aucune raison spécifiée',
                  isPermanent
                });

                // Afficher la popup de bannissement
                setShowBanModal(true);
                return; // Arrêter ici, ne pas lancer d'erreur

              } else {
                // Le bannissement a expiré, nettoyer
                console.log('✅ Bannissement expiré, nettoyage automatique...');
                try {
                  await supabase
                    .from('profiles')
                    .update({
                      banned_until: null,
                      ban_reason: null,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', data.user.id);
                  console.log('✅ Données de bannissement nettoyées');
                } catch (cleanError) {
                  console.warn('⚠️ Erreur nettoyage bannissement (non bloquant):', cleanError);
                }
              }
            }

            console.log('✅ UTILISATEUR AUTORISÉ À SE CONNECTER:', profile.email);
            setMessage('🎉 Connexion réussie ! Bienvenue sur SORadio.');

            setTimeout(() => {
              try {
                onClose();
                if (onAuthSuccess) onAuthSuccess();
              } catch (error) {
                console.warn('Erreur fermeture modal:', error);
              }
            }, 1000);

          } catch (banCheckError: any) {
            console.error('❌ ERREUR VÉRIFICATION BANNISSEMENT:', banCheckError);

            // Assurer la déconnexion en cas d'erreur
            try {
              await supabase.auth.signOut();
            } catch (logoutError) {
              console.error('Erreur déconnexion forcée:', logoutError);
            }

            throw banCheckError;
          }
        } else {
          throw new Error('Aucune donnée utilisateur retournée');
        }
      }

    } catch (error: any) {
      console.error('❌ Erreur authentification complète:', error);
      clearTimeout(timeoutId);

      let errorMessage = 'Une erreur est survenue lors de l\'authentification';

      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'Un compte existe déjà avec cet email';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Veuillez d\'abord confirmer votre email avant de vous connecter';
      } else if (error.message?.includes('signup_disabled')) {
        errorMessage = 'Les inscriptions sont temporairement désactivées';
      } else if (error.message?.includes('email_address_invalid')) {
        errorMessage = 'Adresse email invalide';
      } else if (error.message?.includes('weak_password')) {
        errorMessage = 'Mot de passe trop faible - Utilisez au moins 6 caractères';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Problème de connexion réseau - Vérifiez votre connexion';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Timeout de connexion - Veuillez réessayer';
      } else if (error.message?.includes('Impossible de vérifier')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }

      setMessage(`❌ ${errorMessage}`);

    } finally {
      console.log('🏁 Fin authentification - Déblocage interface');
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const closeBanModal = () => {
    setShowBanModal(false);
    setBanDetails(null);
  };

  if (!isOpen) {
    if (loading) {
      console.log('🔄 Modal fermé - Reset du loading');
      setLoading(false);
    }
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
          <button
            onClick={() => {
              console.log('🚪 Fermeture manuelle du modal');
              setLoading(false);
              setMessage('');
              onClose();
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            disabled={false}
          >
            <i className="ri-close-line text-xl"></i>
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-radio-line text-white text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {currentMode === 'login' ? 'Connexion à SORadio' : 'Inscription à SORadio'}
            </h2>
            <p className="text-gray-600">
              {currentMode === 'login'
                ? 'Accédez à votre espace auditeur'
                : 'Rejoignez la communauté SORadio'}
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-6 text-center text-sm whitespace-pre-line ${
              message.includes('🎉') || message.includes('✅')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {currentMode === 'signup' && (
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                  placeholder="Votre nom et prénom"
                  required
                  disabled={loading}
                  maxLength={100}
                />
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Adresse email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                placeholder="votre@email.fr"
                required
                disabled={loading}
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Mot de passe *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                placeholder="Au moins 6 caractères"
                required
                minLength={6}
                disabled={loading}
                maxLength={128}
              />
              {currentMode === 'signup' && (
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 caractères requis
                </p>
              )}
            </div>

            {loading && (
              <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {currentMode === 'login' ? 'Connexion en cours...' : 'Inscription en cours...'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Veuillez patienter...</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.email.trim() || !formData.password || (currentMode === 'signup' && !formData.fullName.trim())}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer whitespace-nowrap"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {currentMode === 'login' ? 'Connexion...' : 'Inscription...'}
                  </span>
                </div>
              ) : (
                <span>
                  {currentMode === 'login' ? (
                    <>
                      <i className="ri-login-circle-line mr-2"></i>
                      Se connecter
                    </>
                  ) : (
                    <>
                      <i className="ri-user-add-line mr-2"></i>
                      Créer mon compte
                    </>
                  )}
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                if (!loading) {
                  setCurrentMode(currentMode === 'login' ? 'signup' : 'login');
                  setMessage('');
                  setFormData({ email: '', password: '', fullName: '' });
                  console.log(`🔄 Changement mode: ${currentMode === 'login' ? 'signup' : 'login'}`);
                }
              }}
              disabled={loading}
              className="text-orange-600 hover:text-orange-700 font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {currentMode === 'login'
                ? 'Pas encore de compte ? Inscrivez-vous gratuitement'
                : 'Déjà membre ? Connectez-vous à votre compte'}
            </button>
          </div>

          {currentMode === 'signup' && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                En créant un compte, vous acceptez nos conditions d\'utilisation et notre politique de confidentialité.
              </p>
            </div>
          )}

          {loading && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  console.log('🚨 Annulation forcée par l\'utilisateur');
                  setLoading(false);
                  setMessage('❌ Connexion annulée');
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer"
              >
                Annuler la connexion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de bannissement */}
      {showBanModal && banDetails && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-forbid-line text-red-600 text-3xl"></i>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">Compte Banni</h3>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">
                      {banDetails.isPermanent ? 'Bannissement Permanent' : 'Bannissement Temporaire'}
                    </h4>
                    {!banDetails.isPermanent && (
                      <p className="text-red-700 mb-3">
                        <i className="ri-time-line mr-2"></i>
                        <strong>Fin du bannissement :</strong><br />
                        {banDetails.banEndDate}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-red-200 pt-4">
                    <h5 className="font-medium text-red-800 mb-2">Raison du bannissement :</h5>
                    <p className="text-red-700 bg-white/50 p-3 rounded border italic">
                      "{banDetails.banReason}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <i className="ri-information-line text-orange-600 text-lg mt-0.5"></i>
                  <div className="text-left">
                    <p className="text-orange-800 text-sm">
                      {banDetails.isPermanent 
                        ? 'Votre compte a été définitivement suspendu. Pour contester cette décision, contactez l\'équipe de modération.'
                        : 'Vous ne pouvez pas vous connecter pendant cette période. Votre accès sera automatiquement rétabli à la fin du bannissement.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={closeBanModal}
                  className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <i className="ri-close-line mr-2"></i>
                  Fermer
                </button>

                <div className="text-center">
                  <p className="text-gray-600 text-sm">
                    <i className="ri-mail-line mr-1"></i>
                    Besoin d'aide ? Contactez-nous à :
                  </p>
                  <a 
                    href="mailto:contact@soradio.fr" 
                    className="text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
                  >
                    contact@soradio.fr
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
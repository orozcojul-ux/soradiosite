
'use client';

import { useState, useEffect } from 'react';
import MaintenanceMode from '@/components/MaintenanceMode';
import { supabase } from '@/lib/supabase';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasBetaAccess, setHasBetaAccess] = useState(false);
  const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banDetails, setBanDetails] = useState<{
    banEndDate: string;
    banReason: string;
    isPermanent: boolean;
  } | null>(null);

  // FONCTION CRITIQUE DE VÉRIFICATION DU BANNISSEMENT
  const checkUserBanStatus = async (userId: string, userEmail: string) => {
    try {
      console.log('🔍 VÉRIFICATION CRITIQUE DU BANNISSEMENT pour:', userEmail);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, banned_until, ban_reason, is_admin')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('❌ Erreur récupération profil pour vérif ban:', error);
        // En cas d'erreur, déconnecter par précaution
        await supabase.auth.signOut();
        alert('🚫 Erreur de vérification du compte - Déconnexion par sécurité');
        window.location.reload();
        return false;
      }

      // VÉRIFICATION STRICTE DU BANNISSEMENT
      if (profile.banned_until) {
        const banEndDate = new Date(profile.banned_until);
        const now = new Date();

        console.log('🔍 VÉRIFICATION BANNISSEMENT STRICTE:');
        console.log('   - Utilisateur:', userEmail);
        console.log('   - Banni jusqu\'à:', banEndDate.toISOString());
        console.log('   - Maintenant:', now.toISOString());
        console.log('   - Est banni?', banEndDate > now);

        if (banEndDate > now) {
          console.error('🚫 UTILISATEUR BANNI DÉTECTÉ - ÉJECTION IMMÉDIATE');

          // DÉCONNEXION FORCÉE
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
          return false;
        } else {
          // Bannissement expiré, nettoyer
          console.log('✅ Bannissement expiré, nettoyage...');
          try {
            await supabase
              .from('profiles')
              .update({
                banned_until: null,
                ban_reason: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);
            console.log('✅ Données de bannissement expirées nettoyées');
          } catch (cleanError) {
            console.warn('⚠️ Erreur nettoyage bannissement expiré:', cleanError);
          }
        }
      }

      console.log('✅ Utilisateur autorisé:', userEmail);
      return true;
    } catch (error) {
      console.error('💥 Erreur critique vérification bannissement:', error);
      // En cas d'erreur critique, déconnecter par sécurité
      await supabase.auth.signOut();
      alert('🚫 Erreur critique de sécurité - Déconnexion automatique');
      window.location.reload();
      return false;
    }
  };

  const closeBanModal = () => {
    setShowBanModal(false);
    setBanDetails(null);
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initialisation ClientLayout avec vérification bannissement renforcée...');

        // 1. Vérifier l'accès beta local
        const betaAccess = localStorage.getItem('beta_access');
        const betaExpiry = localStorage.getItem('beta_expiry');

        if (betaAccess === 'true' && betaExpiry) {
          const now = Date.now();
          const expiryTime = parseInt(betaExpiry);

          if (now < expiryTime) {
            setHasBetaAccess(true);
            console.log('✅ Accès beta valide trouvé');
          } else {
            localStorage.removeItem('beta_access');
            localStorage.removeItem('beta_timestamp');
            localStorage.removeItem('beta_expiry');
            setHasBetaAccess(false);
          }
        }

        // 2. Charger les données critiques en arrière-plan
        setTimeout(async () => {
          try {
            // Vérifier le mode maintenance
            const maintenancePromise = supabase
              .from('site_settings')
              .select('value')
              .eq('category', 'system')
              .eq('key', 'maintenanceMode')
              .single();

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 8000)
            );

            try {
              const { data: maintenanceData } = await Promise.race([
                maintenancePromise,
                timeoutPromise
              ]) as any;

              if (maintenanceData?.value === 'true') {
                setMaintenanceMode(true);
                console.log('⚠️ Mode maintenance activé');
              } else {
                setMaintenanceMode(false);
                console.log('✅ Mode maintenance désactivé');
              }
            } catch (error) {
              console.warn('Mode maintenance non vérifié, défaut: normal');
              setMaintenanceMode(false);
            }

            // VÉRIFICATION SESSION AVEC CONTRÔLE BANNISSEMENT STRICT
            try {
              const { data: { session } } = await supabase.auth.getSession();

              if (session?.user && session.user.email) {
                console.log('👤 Session utilisateur trouvée, VÉRIFICATION BANNISSEMENT IMMÉDIATE:', session.user.email);

                // VÉRIFICATION CRITIQUE DU BANNISSEMENT
                const isAuthorized = await checkUserBanStatus(session.user.id, session.user.email);

                if (isAuthorized) {
                  // Récupérer le profil complet pour le statut admin
                  try {
                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('is_admin')
                      .eq('id', session.user.id)
                      .single();

                    if (profile?.is_admin) {
                      setIsAdmin(true);
                      console.log('🔑 Accès admin confirmé');
                    }
                  } catch (profileError) {
                    console.warn('Erreur récupération statut admin:', profileError);
                  }
                } else {
                  console.log('🚫 Utilisateur non autorisé détecté lors de l\'initialisation');
                  // La fonction checkUserBanStatus a déjà géré la déconnexion et la popup
                }
              } else {
                console.log('ℹ️ Aucune session utilisateur active');
              }
            } catch (sessionError) {
              console.warn('Erreur vérification session:', sessionError);
            }

          } catch (error) {
            console.warn('Erreur initialisation en arrière-plan:', error);
          }
        }, 100);

      } catch (error) {
        console.warn('Erreur initialisation générale:', error);
      }
    };

    initializeApp();

    // Écouter les changements en temps réel
    let subscription: any = null;
    let authSubscription: any = null;

    try {
      // Écouter les changements de maintenance
      subscription = supabase
        .channel('maintenance-changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'site_settings',
            filter: 'category=eq.system'
          },
          (payload: any) => {
            if (payload.new && payload.new.key === 'maintenanceMode') {
              const maintenanceActive = payload.new.value === 'true';
              setMaintenanceMode(maintenanceActive);
              console.log('🔄 Mode maintenance mis à jour:', maintenanceActive);
            }
          }
        )
        .subscribe();

      // ÉCOUTER LES CHANGEMENTS D'AUTHENTIFICATION AVEC VÉRIFICATION BANNISSEMENT
      authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Changement auth critique:', event, session?.user?.email || 'no user');

        if (event === 'SIGNED_IN' && session?.user && session.user.email) {
          console.log('✅ Connexion détectée, VÉRIFICATION BANNISSEMENT IMMÉDIATE:', session.user.email);

          // VÉRIFICATION CRITIQUE IMMÉDIATE
          const isAuthorized = await checkUserBanStatus(session.user.id, session.user.email);

          if (isAuthorized) {
            // Récupérer le statut admin
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single();

              setIsAdmin(profile?.is_admin || false);
              console.log('👑 Statut admin mis à jour:', profile?.is_admin || false);
            } catch (error) {
              console.warn('Erreur récupération profil lors connexion:', error);
              setIsAdmin(false);
            }
          } else {
            console.log('🚫 Connexion refusée - utilisateur banni');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 Déconnexion détectée');
          setIsAdmin(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user && session.user.email) {
          console.log('🔄 Token rafraîchi, re-vérification bannissement pour:', session.user.email);

          // VÉRIFIER LE BANNISSEMENT MÊME LORS DU REFRESH TOKEN
          const isAuthorized = await checkUserBanStatus(session.user.id, session.user.email);

          if (!isAuthorized) {
            console.log('🚫 Token refresh refusé - utilisateur banni détecté');
          }
        }
      });

      // ÉCOUTER LES CHANGEMENTS DE BANNISSEMENT EN TEMPS RÉEL
      const banSubscription = supabase
        .channel('ban-changes')
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: 'banned_until=not.is.null'
          },
          async (payload: any) => {
            console.log('🚨 CHANGEMENT DE BANNISSEMENT DÉTECTÉ:', payload);

            // Vérifier si c'est l'utilisateur actuel
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user && session.user.email && payload.new.id === session.user.id) {
              console.log('🚫 BANNISSEMENT DE L\'UTILISATEUR ACTUEL DÉTECTÉ');

              // Vérifier immédiatement le bannissement
              await checkUserBanStatus(session.user.id, session.user.email);
            }
          }
        )
        .subscribe();

    } catch (error) {
      console.warn('Erreur setup subscriptions:', error);
    }

    return () => {
      try {
        if (subscription) {
          subscription.unsubscribe();
        }
        if (authSubscription?.data?.subscription) {
          authSubscription.data.subscription.unsubscribe();
        }
      } catch (error) {
        console.warn('Erreur cleanup subscriptions:', error);
      }
    };
  }, []);

  // Gérer l'alerte maintenance pour les admins
  useEffect(() => {
    if (maintenanceMode && isAdmin) {
      setShowMaintenanceAlert(true);
    } else {
      setShowMaintenanceAlert(false);
    }
  }, [maintenanceMode, isAdmin]);

  // Écran de chargement TRÈS RAPIDE (optionnel et court)
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
            <i className="ri-radio-line text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-['Pacifico'] text-gray-800 mb-2">SORadio</h1>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Décider si on affiche le site
  const shouldShowSite = !maintenanceMode || isAdmin || hasBetaAccess;

  return (
    <>
      {/* Alerte maintenance pour les admins */}
      {showMaintenanceAlert && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 text-center text-sm font-medium">
          <i className="ri-error-warning-line mr-2"></i>
          ATTENTION : Le site est actuellement en mode maintenance - Seuls les administrateurs peuvent y accéder
          <button
            onClick={() => setShowMaintenanceAlert(false)}
            className="ml-4 text-white hover:text-red-200"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}

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

      <MaintenanceMode
        isActive={maintenanceMode && !isAdmin && !hasBetaAccess}
        onStatusChange={setMaintenanceMode}
      />

      {shouldShowSite && (
        <div className={showMaintenanceAlert ? 'pt-10' : ''}>
          {children}
        </div>
      )}
    </>
  );
}
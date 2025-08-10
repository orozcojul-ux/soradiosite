
'use client';

import { useState, useEffect } from 'react';
import MaintenanceMode from '@/components/MaintenanceMode';
import { supabase } from '@/lib/supabase';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasBetaAccess, setHasBetaAccess] = useState(false);
  const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      // Timeout de sécurité RACCOURCI - 5 secondes maximum
      let hasTimedOut = false;
      const initTimeout = setTimeout(() => {
        console.warn('Timeout d\'initialisation rapide - chargement avec valeurs par défaut');
        hasTimedOut = true;
        setInitError('Connexion lente');
        setMaintenanceMode(false);
        setIsLoading(false);
      }, 5000); // Timeout raccourci à 5 secondes

      try {
        // Vérifier l'accès beta en premier (synchrone - rapide)
        const betaAccess = localStorage.getItem('beta_access');
        const betaTimestamp = localStorage.getItem('beta_timestamp');
        const betaExpiry = localStorage.getItem('beta_expiry');
        
        if (betaAccess === 'true' && betaTimestamp && betaExpiry) {
          const now = Date.now();
          const expiryTime = parseInt(betaExpiry);
          
          if (now < expiryTime) {
            setHasBetaAccess(true);
          } else {
            localStorage.removeItem('beta_access');
            localStorage.removeItem('beta_timestamp');
            localStorage.removeItem('beta_expiry');
            setHasBetaAccess(false);
          }
        }

        // Si on a déjà timeout, on arrête ici
        if (hasTimedOut) return;

        // Chargement avec timeout très court et fallback immédiat
        const maintenanceQuery = async () => {
          try {
            const result = await supabase
              .from('site_settings')
              .select('value')
              .eq('category', 'system')
              .eq('key', 'maintenanceMode')
              .single();
            return { type: 'maintenance', result };
          } catch (error) {
            return { type: 'maintenance', error };
          }
        };

        const sessionQuery = async () => {
          try {
            const result = await supabase.auth.getSession();
            return { type: 'session', result };
          } catch (error) {
            return { type: 'session', error };
          }
        };

        // Attendre les deux requêtes avec timeout TRÈS COURT
        const results = await Promise.allSettled([
          Promise.race([maintenanceQuery(), new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout maintenance')), 2000) // 2 secondes max
          )]),
          Promise.race([sessionQuery(), new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout session')), 3000) // 3 secondes max
          )])
        ]);

        // Si on a déjà timeout, on arrête ici
        if (hasTimedOut) return;

        // Traitement du mode maintenance avec fallback IMMÉDIAT
        const maintenanceResult = results[0];
        if (maintenanceResult.status === 'fulfilled') {
          const data = maintenanceResult.value as any;
          if (data.type === 'maintenance' && !data.error && data.result?.data) {
            const maintenanceActive = data.result.data.value === 'true';
            setMaintenanceMode(maintenanceActive);
          } else {
            console.warn('Maintenance check failed, defaulting to normal mode');
            setMaintenanceMode(false);
          }
        } else {
          console.warn('Maintenance promise rejected, defaulting to normal mode');
          setMaintenanceMode(false);
        }

        // Traitement de la session admin avec fallback IMMÉDIAT
        const sessionResult = results[1];
        if (sessionResult.status === 'fulfilled') {
          const data = sessionResult.value as any;
          if (data.type === 'session' && !data.error && data.result?.data?.session?.user) {
            const user = data.result.data.session.user;
            console.log('Session utilisateur trouvée:', user.email);

            // Vérifier le profil admin avec timeout TRÈS COURT
            try {
              const profileQuery = async () => {
                try {
                  const result = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single();
                  return result;
                } catch (error) {
                  throw error;
                }
              };

              const profileResult = await Promise.race([
                profileQuery(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout profile')), 2000) // 2 secondes max
                )
              ]);

              if (!hasTimedOut && profileResult && !(profileResult as any).error) {
                setIsAdmin((profileResult as any).data?.is_admin || false);
              } else {
                console.warn('Profile check failed or timed out, defaulting admin to false');
                setIsAdmin(false);
              }
            } catch (error) {
              console.warn('Profile check error, defaulting admin to false:', error);
              setIsAdmin(false);
            }
          } else {
            console.log('Pas de session utilisateur active');
            setIsAdmin(false);
          }
        } else {
          console.warn('Session promise rejected, no user session');
          setIsAdmin(false);
        }

        clearTimeout(initTimeout);

      } catch (error) {
        console.warn('Erreur init générale (non-critique):', error);
        clearTimeout(initTimeout);
        // PAS de redirection - on continue avec des valeurs par défaut
        setMaintenanceMode(false);
        setIsAdmin(false);
        setInitError('Erreur de chargement non-critique');
      } finally {
        // Toujours terminer le chargement, même en cas d'erreur
        if (!hasTimedOut) {
          setIsLoading(false);
        }
      }
    };

    initializeApp();

    // Écouter les changements en temps réel avec gestion d'erreur douce
    let subscription: any = null;
    let authSubscription: any = null;

    try {
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
            }
          }
        )
        .subscribe();

      // Écouter les changements d'authentification SANS timeout strict
      authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email || 'no user');
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Connexion détectée:', session.user.email);
          
          // Vérifier le profil admin avec gestion d'erreur douce
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', session.user.id)
              .single();
            
            setIsAdmin(profile?.is_admin || false);
          } catch (error) {
            console.warn('Erreur récupération profil admin après connexion:', error);
            setIsAdmin(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('Déconnexion détectée');
          setIsAdmin(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token rafraîchi pour:', session.user.email);
          // Pas besoin de recharger le profil pour un refresh de token
        }
      });
    } catch (error) {
      console.warn('Erreur setup subscriptions (non-critique):', error);
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

  // Vérifier si on doit afficher l'alerte maintenance pour les admins
  useEffect(() => {
    if (maintenanceMode && isAdmin) {
      setShowMaintenanceAlert(true);
    } else {
      setShowMaintenanceAlert(false);
    }
  }, [maintenanceMode, isAdmin]);

  // Écran de chargement RACCOURCI - Affichage plus rapide
  if (isLoading || maintenanceMode === null) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-8 mx-auto animate-bounce">
            <i className="ri-radio-line text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-['Pacifico'] text-gray-800 mb-4">SORadio</h1>
          <div className="flex items-center justify-center space-x-1 mb-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </div>
          <p className="text-gray-600 font-medium">
            Chargement rapide...
          </p>
          {initError && (
            <p className="text-gray-500 text-sm mt-2">
              {initError === 'Connexion lente' ? 'Connexion en cours...' : 'Chargement avec valeurs par défaut'}
            </p>
          )}
          
          {/* Bouton de contournement après 3 secondes */}
          <div className="mt-6">
            <button
              onClick={() => {
                console.log('Contournement manuel activé');
                setMaintenanceMode(false);
                setIsLoading(false);
              }}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap shadow-lg"
            >
              Accéder au site
            </button>
            <p className="text-gray-500 text-xs mt-2">
              Cliquez si le chargement est trop long
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Afficher le site si :
  // 1. Pas en mode maintenance
  // 2. Utilisateur admin connecté
  // 3. Utilisateur avec accès beta valide
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
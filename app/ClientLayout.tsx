
'use client';

import { useState, useEffect } from 'react';
import MaintenanceMode from '@/components/MaintenanceMode';
import { supabase } from '@/lib/supabase';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasBetaAccess, setHasBetaAccess] = useState(false);
  const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);

  useEffect(() => {
    // Vérifier le mode maintenance au chargement
    const checkMaintenance = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('category', 'system')
          .eq('key', 'maintenanceMode')
          .single();

        if (!error && data) {
          const maintenanceActive = data.value === 'true';
          setMaintenanceMode(maintenanceActive);
          console.log('Mode maintenance détecté:', maintenanceActive);
        } else {
          console.log('Pas de paramètre maintenance trouvé');
        }
      } catch (error) {
        console.error('Erreur maintenance check:', error);
      }
    };

    // Vérifier si l'utilisateur est admin
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        const adminStatus = profile?.is_admin || false;
        setIsAdmin(adminStatus);
        console.log('Statut admin:', adminStatus);
      }
    };

    // Vérifier l'accès beta
    const checkBetaAccess = () => {
      const betaAccess = localStorage.getItem('beta_access');
      const betaTimestamp = localStorage.getItem('beta_timestamp');
      const betaExpiry = localStorage.getItem('beta_expiry');
      
      if (betaAccess === 'true' && betaTimestamp && betaExpiry) {
        const now = Date.now();
        const expiryTime = parseInt(betaExpiry);
        
        if (now < expiryTime) {
          setHasBetaAccess(true);
          console.log('Accès beta valide');
        } else {
          // Supprimer l'accès beta expiré
          localStorage.removeItem('beta_access');
          localStorage.removeItem('beta_timestamp');
          localStorage.removeItem('beta_expiry');
          setHasBetaAccess(false);
          console.log('Accès beta expiré');
        }
      }
    };

    checkMaintenance();
    checkAdminStatus();
    checkBetaAccess();

    // Écouter les changements en temps réel
    const subscription = supabase
      .channel('maintenance-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'category=eq.system'
        },
        (payload) => {
          console.log('Changement détecté:', payload);
          if (payload.new?.key === 'maintenanceMode') {
            const maintenanceActive = payload.new.value === 'true';
            setMaintenanceMode(maintenanceActive);
            console.log('Mode maintenance mis à jour:', maintenanceActive);
          }
        }
      )
      .subscribe();

    // Écouter les changements d'authentification
    const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        checkAdminStatus();
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      authSubscription.data.subscription.unsubscribe();
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

  // Afficher le site si :
  // 1. Pas en mode maintenance
  // 2. Utilisateur admin connecté
  // 3. Utilisateur avec accès beta valide
  const shouldShowSite = !maintenanceMode || isAdmin || hasBetaAccess;

  console.log('États actuels:', {
    maintenanceMode,
    isAdmin,
    hasBetaAccess,
    shouldShowSite
  });

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

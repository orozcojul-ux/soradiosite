
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export default function UserMenu() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const profileLoadAttempts = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    console.log('👤 UserMenu: Init avec gestion robuste');
    
    const getUserProfile = async (retryCount = 0) => {
      try {
        console.log(`👤 UserMenu: Tentative ${retryCount + 1}/${maxRetries}`);
        
        // Vérifier d'abord la session avec timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );
        
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (sessionError) {
          console.error('❌ UserMenu: Erreur session:', sessionError);
          setProfile(null);
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        if (!session?.user) {
          console.log('👤 UserMenu: Pas de session utilisateur');
          setProfile(null);
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const user = session.user;
        console.log('👤 UserMenu: Session utilisateur trouvée:', user.email);
        setCurrentUser(user);

        // Récupérer le profil avec timeout et retry
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        const profileTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile timeout')), 8000)
        );

        const { data: profileData, error } = await Promise.race([
          profilePromise,
          profileTimeoutPromise
        ]) as any;

        if (error) {
          console.error('❌ UserMenu: Erreur récupération profil:', error);
          
          // Retry si c'est un timeout ou une erreur réseau
          if ((error.message?.includes('timeout') || error.code === 'PGRST301') && retryCount < maxRetries - 1) {
            console.log(`🔄 UserMenu: Retry ${retryCount + 1} après erreur`);
            setTimeout(() => getUserProfile(retryCount + 1), 2000);
            return;
          }
          
          // Si le profil n'existe pas, on le crée
          if (error.code === 'PGRST116') {
            console.log('👤 UserMenu: Création du profil manquant');
            try {
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || user.email,
                  is_admin: false
                })
                .select()
                .single();

              if (!createError && newProfile) {
                console.log('✅ UserMenu: Profil créé:', newProfile.full_name);
                setProfile(newProfile);
              } else {
                console.error('❌ UserMenu: Erreur création profil:', createError);
                // Utiliser les données de session en fallback
                setProfile({
                  id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || user.email,
                  is_admin: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              }
            } catch (createErr) {
              console.error('❌ UserMenu: Échec création profil:', createErr);
              // Fallback avec données session
              setProfile({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || user.email,
                is_admin: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          } else {
            // Autres erreurs - utiliser les données de session en fallback
            console.log('🔄 UserMenu: Utilisation fallback avec données session');
            setProfile({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || user.email,
              is_admin: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        } else if (profileData) {
          console.log('✅ UserMenu: Profil récupéré:', profileData.full_name);
          setProfile(profileData);
        } else {
          // Pas de données - fallback session
          console.log('🔄 UserMenu: Pas de données profil - fallback session');
          setProfile({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || user.email,
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error('❌ UserMenu: Erreur générale:', error);
        
        // Retry pour erreurs de timeout
        if (error.message?.includes('timeout') && retryCount < maxRetries - 1) {
          console.log(`🔄 UserMenu: Retry global ${retryCount + 1} après timeout`);
          setTimeout(() => getUserProfile(retryCount + 1), 3000);
          return;
        }
        
        // Si on a un utilisateur en cours, utiliser les données en fallback
        if (currentUser) {
          console.log('🔄 UserMenu: Erreur mais utilisateur existant - fallback');
          setProfile({
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || currentUser.email,
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          setProfile(null);
        }
      } finally {
        setLoading(false);
        profileLoadAttempts.current = retryCount + 1;
      }
    };

    // Récupération initiale
    getUserProfile();
    
    // Écouter les changements d'auth avec debounce
    let authTimeout: NodeJS.Timeout;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 UserMenu: Auth changé:', event, session?.user?.email || 'no user');
      
      // Débouncer les événements pour éviter les appels multiples
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
      
      authTimeout = setTimeout(async () => {
        if (event === 'SIGNED_OUT' || !session) {
          console.log('🚪 UserMenu: Déconnexion');
          setProfile(null);
          setCurrentUser(null);
          setLoading(false);
          profileLoadAttempts.current = 0;
        } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          console.log('🔑 UserMenu: Connexion/Refresh, rechargement profil');
          setLoading(true);
          setCurrentUser(session.user);
          profileLoadAttempts.current = 0;
          // Délai pour laisser le temps aux triggers de base de données
          setTimeout(() => getUserProfile(), 800);
        }
      }, 500); // Debounce de 500ms
    });

    return () => {
      subscription.unsubscribe();
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      console.log('🚪 UserMenu: Déconnexion');
      
      // Nettoyer les états immédiatement
      setProfile(null);
      setCurrentUser(null);
      setLoading(false);
      
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ UserMenu: Erreur déconnexion:', error);
    }
  };

  // État de chargement avec timeout de sécurité
  if (loading && profileLoadAttempts.current < maxRetries) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-400/20 rounded-full animate-pulse"></div>
        <div className="text-xs text-orange-300">
          {profileLoadAttempts.current > 0 ? `Retry ${profileLoadAttempts.current}...` : 'Chargement...'}
        </div>
      </div>
    );
  }

  // Si pas de profil après tous les essais
  if (!profile) {
    console.log('👤 UserMenu: Pas de profil après tentatives - masquage composant');
    return null;
  }

  console.log('👤 UserMenu: RENDU avec profil:', profile.full_name, '(tentatives:', profileLoadAttempts.current, ')');

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-2 text-white hover:text-orange-300 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
          <i className="ri-user-line text-white text-sm"></i>
        </div>
        <span className="hidden md:block font-medium">
          {profile.full_name || profile.email?.split('@')[0] || profile.email}
        </span>
        <i className="ri-arrow-down-s-line"></i>
      </button>

      {dropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setDropdownOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-xl z-20">
            <div className="py-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800">{profile.full_name || profile.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-500">{profile.email}</p>
              </div>
              <Link
                href="/profile"
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setDropdownOpen(false)}
              >
                <i className="ri-user-line text-orange-500"></i>
                <span>Mon Profil</span>
              </Link>
              {profile.is_admin && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 px-4 py-2 text-orange-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="ri-settings-line"></i>
                  <span>Administration</span>
                </Link>
              )}
              <hr className="border-gray-200 my-2" />
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors w-full text-left cursor-pointer whitespace-nowrap"
              >
                <i className="ri-logout-box-line text-red-500"></i>
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

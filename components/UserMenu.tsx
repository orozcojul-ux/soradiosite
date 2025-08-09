
'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    console.log('👤 UserMenu: Init avec système corrigé');
    
    const getUserProfile = async () => {
      try {
        // Vérifier d'abord la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ UserMenu: Erreur session:', sessionError);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (!session?.user) {
          console.log('👤 UserMenu: Pas de session utilisateur');
          setProfile(null);
          setLoading(false);
          return;
        }

        const user = session.user;
        console.log('👤 UserMenu: Session utilisateur trouvée:', user.email);

        // Récupérer le profil depuis la table profiles
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ UserMenu: Erreur récupération profil:', error);
          // Si le profil n'existe pas, on le crée
          if (error.code === 'PGRST116') {
            console.log('👤 UserMenu: Création du profil manquant');
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email,
                is_admin: false
              })
              .select()
              .single();

            if (!createError && newProfile) {
              console.log('✅ UserMenu: Profil créé:', newProfile.full_name);
              setProfile(newProfile);
            }
          }
        } else if (profileData) {
          console.log('✅ UserMenu: Profil récupéré:', profileData.full_name);
          setProfile(profileData);
        }

      } catch (error) {
        console.error('❌ UserMenu: Erreur générale:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    // Récupération initiale
    getUserProfile();
    
    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 UserMenu: Auth changé:', event, session?.user?.email || 'no user');
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('🚪 UserMenu: Déconnexion');
        setProfile(null);
        setLoading(false);
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        console.log('🔑 UserMenu: Connexion/Refresh, rechargement profil');
        setLoading(true);
        // Petit délai pour laisser le trigger créer le profil si nécessaire
        setTimeout(getUserProfile, 500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      console.log('🚪 UserMenu: Déconnexion');
      await supabase.auth.signOut();
      setProfile(null);
    } catch (error) {
      console.error('❌ UserMenu: Erreur déconnexion:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-400/20 rounded-full animate-pulse"></div>
        <div className="text-xs text-orange-300">Chargement...</div>
      </div>
    );
  }

  if (!profile) {
    console.log('👤 UserMenu: Pas de profil - masquage composant');
    return null;
  }

  console.log('👤 UserMenu: RENDU avec profil:', profile.full_name);

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
          {profile.full_name || profile.email}
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

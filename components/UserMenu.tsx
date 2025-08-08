
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // Vérifier la session Supabase en temps réel
    const checkAuthState = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (!supabaseUser) {
          // Pas d'utilisateur authentifié, nettoyer le localStorage
          localStorage.removeItem('user_session');
          setUser(null);
          return;
        }

        // Vérifier si le profil existe toujours dans la base
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (error || !profile) {
          // Profil n'existe pas, déconnecter
          localStorage.removeItem('user_session');
          setUser(null);
          return;
        }

        // Utilisateur authentifié avec profil valide
        setUser(profile);
        localStorage.setItem('user_session', JSON.stringify(profile));

      } catch (error) {
        console.log('Erreur lors de la vérification de session:', error);
        localStorage.removeItem('user_session');
        setUser(null);
      }
    };

    // Vérification initiale
    checkAuthState();
    
    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem('user_session');
        setUser(null);
      } else if (event === 'SIGNED_IN' && session) {
        checkAuthState();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user_session');
      setUser(null);
      setDropdownOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-2 text-white hover:text-orange-300 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
          <i className="ri-user-line text-white text-sm"></i>
        </div>
        <span className="hidden md:block font-medium">{user.full_name || 'Utilisateur'}</span>
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
              {user.is_admin && (
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

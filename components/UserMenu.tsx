'use client';

import { useState, useEffect } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import Link from 'next/link';

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profile);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(profile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-2 text-white hover:text-orange-400 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
          <i className="ri-user-line text-white text-sm"></i>
        </div>
        <span className="hidden md:block">{profile?.full_name || 'Utilisateur'}</span>
        <i className="ri-arrow-down-s-line"></i>
      </button>

      {dropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setDropdownOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-md rounded-lg border border-white/10 shadow-xl z-20">
            <div className="py-2">
              <Link
                href="/profile"
                className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setDropdownOpen(false)}
              >
                <i className="ri-user-line"></i>
                <span>Mon Profil</span>
              </Link>
              {profile?.is_admin && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 px-4 py-2 text-orange-400 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="ri-settings-line"></i>
                  <span>Admin</span>
                </Link>
              )}
              <hr className="border-white/10 my-2" />
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-white/10 transition-colors w-full text-left cursor-pointer whitespace-nowrap"
              >
                <i className="ri-logout-box-line"></i>
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
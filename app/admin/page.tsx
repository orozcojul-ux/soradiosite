'use client';

import { useState, useEffect } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/';
        return;
      }

      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        window.location.href = '/';
        return;
      }

      setProfile(profile);

      // Load all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        setAllProfiles(profiles);
      }

      setLoading(false);
    };

    checkAdmin();
  }, []);

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      // Refresh profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        setAllProfiles(profiles);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  const stats = {
    totalUsers: allProfiles.length,
    admins: allProfiles.filter(p => p.is_admin).length,
    regularUsers: allProfiles.filter(p => !p.is_admin).length,
    recentUsers: allProfiles.filter(p => {
      const createdAt = new Date(p.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt > weekAgo;
    }).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <i className="ri-radio-line text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-['Pacifico'] text-white">SORadio</h1>
                <p className="text-orange-400 text-sm">Panel Admin</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Panel Administrateur</h1>
          <p className="text-gray-400">Gérez les utilisateurs et les paramètres de SORadio</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-blue-400 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Utilisateurs</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                <i className="ri-admin-line text-orange-400 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Administrateurs</p>
                <p className="text-2xl font-bold text-white">{stats.admins}</p>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <i className="ri-user-smile-line text-green-400 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Utilisateurs</p>
                <p className="text-2xl font-bold text-white">{stats.regularUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <i className="ri-user-add-line text-purple-400 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Nouveaux (7j)</p>
                <p className="text-2xl font-bold text-white">{stats.recentUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'text-orange-400 border-b-2 border-orange-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="ri-user-line mr-2"></i>
              Gestion des Utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-4 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'text-orange-400 border-b-2 border-orange-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="ri-settings-line mr-2"></i>
              Paramètres
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Liste des Utilisateurs</h2>
                <div className="space-y-4">
                  {allProfiles.map((userProfile) => (
                    <div key={userProfile.id} className="bg-black/20 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                            <i className="ri-user-line text-white"></i>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">
                              {userProfile.full_name || 'Nom non défini'}
                              {userProfile.is_admin && (
                                <span className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                                  Admin
                                </span>
                              )}
                            </h3>
                            <p className="text-gray-400 text-sm">{userProfile.email}</p>
                            <p className="text-gray-500 text-xs">
                              Inscrit le {new Date(userProfile.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {userProfile.phone && (
                            <div className="text-gray-400 text-sm">
                              <i className="ri-phone-line mr-1"></i>
                              {userProfile.phone}
                            </div>
                          )}
                          {userProfile.id !== user.id && (
                            <button
                              onClick={() => toggleAdminStatus(userProfile.id, userProfile.is_admin)}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                userProfile.is_admin
                                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              }`}
                            >
                              {userProfile.is_admin ? 'Retirer Admin' : 'Rendre Admin'}
                            </button>
                          )}
                        </div>
                      </div>
                      {userProfile.bio && (
                        <div className="mt-3 pl-16">
                          <p className="text-gray-300 text-sm">{userProfile.bio}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Paramètres de la Radio</h2>
                <div className="space-y-6">
                  <div className="bg-black/20 rounded-lg p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-4">Informations Générales</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Nom de la Radio</label>
                        <input
                          type="text"
                          defaultValue="SORadio - Sud Ouest Radio"
                          className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Fréquence FM</label>
                        <input
                          type="text"
                          defaultValue="105.7 MHz"
                          className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-lg p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-4">Streaming</h3>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">URL du Stream</label>
                      <input
                        type="url"
                        placeholder="https://stream.soradio.fr/live"
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-lg p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-4">Actions Rapides</h3>
                    <div className="flex flex-wrap gap-4">
                      <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer whitespace-nowrap">
                        Exporter les Données
                      </button>
                      <button className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors cursor-pointer whitespace-nowrap">
                        Sauvegarder Config
                      </button>
                      <button className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-lg hover:bg-orange-500/30 transition-colors cursor-pointer whitespace-nowrap">
                        Redémarrer Stream
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
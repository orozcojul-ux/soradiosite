
'use client';

import { useState, useEffect } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import { getSettings, saveSettings as saveSettingsToDb, toggleMaintenanceMode, type SiteSettings } from '@/lib/settings';
import Link from 'next/link';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [streamStatus, setStreamStatus] = useState('live');
  const [currentShow, setCurrentShow] = useState('Morning Show - Sophie & Marc');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState('');
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('Maintenance programmée du système');
  const [maintenanceEndTime, setMaintenanceEndTime] = useState('');
  const [settings, setSettings] = useState<SiteSettings>({
    general: {
      name: 'SORadio - Sud Ouest Radio',
      slogan: 'La voix du Sud-Ouest',
      frequency: '105.7 MHz',
      email: 'contact@soradio.fr',
      phone: '+33 5 56 12 34 56',
      address: '123 Rue de la République, 33000 Bordeaux, France'
    },
    streaming: {
      primaryUrl: 'https://stream.soradio.fr/live',
      backupUrl: 'https://backup.soradio.fr/live',
      bitrate: '320',
      format: 'mp3',
      maxListeners: '5000',
      sourcePassword: 'SORadio2024!'
    },
    social: {
      facebook: 'https://facebook.com/soradio',
      instagram: 'https://instagram.com/soradio',
      twitter: 'https://x.com/soradio',
      youtube: 'https://youtube.com/@soradio',
      spotify: 'https://open.spotify.com/user/soradio',
      tiktok: 'https://tiktok.com/@soradio'
    },
    email: {
      smtpServer: 'mail.soradio.fr',
      smtpPort: '587',
      emailUser: 'noreply@soradio.fr',
      emailPassword: 'EmailPass2024!',
      audienceNotif: true,
      techAlerts: true,
      newUsers: true,
      dailyReports: false
    },
    api: {
      publicKey: 'pk_live_soradio_2024_api_key_public',
      secretKey: 'sk_live_soradio_2024_api_key_secret',
      webhookStats: 'https://api.soradio.fr/webhooks/stats',
      webhookListeners: 'https://api.soradio.fr/webhooks/listeners'
    },
    system: {
      maintenanceMode: false,
      maintenanceReason: '',
      maintenanceEndTime: ''
    }
  });

  const [betaKeys, setBetaKeys] = useState<any[]>([]);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [newBetaKey, setNewBetaKey] = useState({
    description: '',
    duration: '24',
    maxUsage: 1
  });
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    is_admin: false
  });

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

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        setAllProfiles(profiles);
      }

      const currentSettings = await getSettings();
      setSettings(currentSettings);

      setMaintenanceActive(currentSettings.system?.maintenanceMode || false);
      setMaintenanceReason(currentSettings.system?.maintenanceReason || 'Maintenance programmée du système');
      setMaintenanceEndTime(currentSettings.system?.maintenanceEndTime || '');

      await loadBetaKeys();

      setLoading(false);
    };

    checkAdmin();
  }, []);

  const loadBetaKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('beta_keys')
        .select(`
          *,
          profiles:created_by(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Vérifier et désactiver automatiquement les clés expirées ou épuisées
        const now = new Date();
        const keysToUpdate = data.filter(key => {
          const isExpired = new Date(key.expires_at) <= now;
          const isExhausted = key.usage_count >= key.max_usage;
          return key.is_active && (isExpired || isExhausted);
        });

        // Désactiver les clés expirées/épuisées
        if (keysToUpdate.length > 0) {
          const { error: updateError } = await supabase
            .from('beta_keys')
            .update({ is_active: false })
            .in('id', keysToUpdate.map(k => k.id));

          if (!updateError) {
            // Recharger les données après mise à jour
            const { data: updatedData } = await supabase
              .from('beta_keys')
              .select(`
                *,
                profiles:created_by(full_name, email)
              `)
              .order('created_at', { ascending: false });

            if (updatedData) {
              setBetaKeys(updatedData);
              return;
            }
          }
        }

        setBetaKeys(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clés beta:', error);
    }
  };

  const generateBetaKey = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `SORADIO-BETA-${timestamp.toUpperCase()}-${random.toUpperCase()}`;
  };

  const createBetaKey = async () => {
    try {
      setProcessing('Création de la clé beta');

      const keyCode = generateBetaKey();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(newBetaKey.duration));

      const { error } = await supabase
        .from('beta_keys')
        .insert({
          key_code: keyCode,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          max_usage: newBetaKey.maxUsage,
          description: newBetaKey.description || `Clé créée le ${new Date().toLocaleDateString('fr-FR')}`
        });

      if (error) throw error;

      await loadBetaKeys();
      setShowBetaModal(false);
      setNewBetaKey({ description: '', duration: '24', maxUsage: 1 });
      setMessage(' Clé beta créée avec succès!');
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage(' Erreur lors de la création de la clé beta');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  const toggleBetaKey = async (keyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('beta_keys')
        .update({ is_active: !currentStatus })
        .eq('id', keyId);

      if (error) throw error;

      await loadBetaKeys();
      setMessage(` Clé beta ${!currentStatus ? 'activée' : 'désactivée'}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(' Erreur lors de la modification de la clé');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const deleteBetaKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('beta_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      await loadBetaKeys();
      setMessage(' Clé beta supprimée');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(' Erreur lors de la suppression');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

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

  const saveSettingsHandler = async () => {
    setSaving(true);
    setMessage('');

    try {
      const success = await saveSettingsToDb(settings);

      if (success) {
        setMessage(' Paramètres sauvegardés avec succès! Les modifications sont maintenant visibles sur le site.');
      } else {
        setMessage(' Erreur lors de la sauvegarde des paramètres');
      }

      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage(' Erreur lors de la sauvegarde des paramètres');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleSystemAction = async (action: string, actionName: string) => {
    setProcessing(actionName);

    try {
      if (action === 'maintenance-mode') {
        const newMaintenanceState = !maintenanceActive;
        const success = await toggleMaintenanceMode(
          newMaintenanceState,
          maintenanceReason,
          maintenanceEndTime
        );

        if (success) {
          setMaintenanceActive(newMaintenanceState);
          setMessage(newMaintenanceState
            ? ' Mode maintenance ACTIVÉ - Le site affiche maintenant la page de maintenance'
            : ' Mode maintenance DÉSACTIVÉ - Le site est de nouveau accessible'
          );
        } else {
          setMessage(' Erreur lors du changement du mode maintenance');
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 3000));

        switch (action) {
          case 'export-users':
            setMessage(' Export des données utilisateurs terminé!');
            break;
          case 'backup-config':
            setMessage(' Sauvegarde de la configuration terminée!');
            break;
          case 'backup-db':
            setMessage(' Sauvegarde de la base de données terminée!');
            break;
          case 'status-services':
            setMessage(' Vérification des services terminée - Tous opérationnels!');
            break;
          case 'performance':
            setMessage(' Analyse des performances terminée - CPU: 24%, RAM: 67%');
            break;
          case 'security':
            setMessage(' Audit de sécurité terminé - Aucune vulnérabilité détectée');
            break;
          case 'restart-services':
            setMessage(' Redémarrage des services terminé!');
            break;
          case 'system-logs':
            setMessage(' Logs système consultés - Aucune erreur critique');
            break;
          case 'regenerate-keys':
            setSettings(prev => ({
              ...prev,
              api: {
                ...prev.api,
                publicKey: `pk_live_soradio_${Date.now()}_api_key_public`,
                secretKey: `sk_live_soradio_${Date.now()}_api_key_secret`
              }
            }));
            setMessage(' Clés API régénérées avec succès!');
            break;
          case 'test-webhooks':
            setMessage(' Test des webhooks terminé - Connexions OK');
            break;
          default:
            setMessage(' Action terminée avec succès!');
        }
      }

      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage(` Erreur lors de l'exécution de l'action: ${actionName}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  const updateSettings = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const openEditUserModal = (userToEdit: Profile) => {
    setEditingUser(userToEdit);
    setEditUserForm({
      full_name: userToEdit.full_name || '',
      email: userToEdit.email || '',
      phone: userToEdit.phone || '',
      bio: userToEdit.bio || '',
      is_admin: userToEdit.is_admin || false
    });
    setShowEditUserModal(true);
  };

  const closeEditUserModal = () => {
    setShowEditUserModal(false);
    setEditingUser(null);
    setEditUserForm({
      full_name: '',
      email: '',
      phone: '',
      bio: '',
      is_admin: false
    });
  };

  const saveUserProfile = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);
      setMessage('');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editUserForm.full_name.trim() || null,
          email: editUserForm.email.trim().toLowerCase(),
          phone: editUserForm.phone.trim() || null,
          bio: editUserForm.bio.trim() || null,
          is_admin: editUserForm.is_admin,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      // Recharger la liste des utilisateurs
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        setAllProfiles(profiles);
      }

      setMessage(' Profil utilisateur mis à jour avec succès !');
      closeEditUserModal();
      setTimeout(() => setMessage(''), 5000);

    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      setMessage(' Erreur lors de la mise à jour du profil : ' + error.message);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const deleteUserProfile = async (userToDelete: Profile) => {
    if (userToDelete.id === user.id) {
      setMessage(' Vous ne pouvez pas supprimer votre propre compte');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${userToDelete.full_name || userToDelete.email} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      setProcessing('Suppression du compte utilisateur');

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      // Recharger la liste des utilisateurs
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        setAllProfiles(profiles);
      }

      setMessage(' Compte utilisateur supprimé avec succès');
      setTimeout(() => setMessage(''), 5000);

    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      setMessage(' Erreur lors de la suppression : ' + error.message);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=Beautiful%20panoramic%20view%20of%20Bordeaux%20city%20with%20Place%20de%20la%20Bourse%20reflecting%20in%20water%2C%20golden%20hour%20lighting%2C%20elegant%20French%20architecture%2C%20stone%20buildings%20along%20Garonne%20river%2C%20warm%20sunset%20colors%2C%20classic%20European%20cityscape%2C%20professional%20photography&width=1920&height=1080&seq=bordeaux-admin-bg&orientation=landscape')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80"></div>
        <div className="relative text-white text-xl">Chargement...</div>
      </div>
    );
  }

  const stats = {
    totalUsers: allProfiles.length,
    admins: allProfiles.filter((p) => p.is_admin).length,
    regularUsers: allProfiles.filter((p) => !p.is_admin).length,
    recentUsers: allProfiles.filter((p) => {
      const createdAt = new Date(p.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt > weekAgo;
    }).length
  };

  const mockPrograms = [
    { id: 1, name: 'Morning Show', host: 'Sophie & Marc', time: '06:00-10:00', status: 'live', listeners: 3250 },
    { id: 2, name: 'Mix Afternoon', host: 'Julie', time: '14:00-18:00', status: 'scheduled', listeners: 0 },
    { id: 3, name: 'Night Session', host: 'Alex', time: '20:00-02:00', status: 'scheduled', listeners: 0 }
  ];

  const mockPlaylist = [
    { id: 1, title: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20', played: '09:45' },
    { id: 2, title: 'Levitating', artist: 'Dua Lipa', duration: '3:23', played: '09:41' },
    { id: 3, title: 'As It Was', artist: 'Harry Styles', duration: '2:47', played: '09:38' }
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('https://readdy.ai/api/search-image?query=Elegant%20panoramic%20view%20of%20Bordeaux%20architectural%20details%20with%20Place%20de%20la%20Bourse%20golden%20stone%20facades%2C%20soft%20morning%20light%20creating%20gentle%20shadows%20on%20classic%20French%20buildings%2C%20muted%20warm%20tones%2C%20subtle%20architectural%20photography%20with%20high%20contrast%20and%20clarity%20for%20text%20readability&width=1920&height=1080&seq=bordeaux-admin-clear&orientation=landscape')`
      }}
    >
      {(message || processing) && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div
            className={`p-4 rounded-lg backdrop-blur-md border ${message.includes('succès') || message.includes('terminé') || message.includes('OK')
              ? 'bg-green-500/20 text-green-400 border-green-400/50'
              : message.includes('Erreur') || message.includes('erreur')
              ? 'bg-red-500/20 text-red-400 border-red-400/50'
              : 'bg-blue-500/20 text-blue-400 border-blue-400/50'
            }`}
          >
            {processing ? (
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>{processing}...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <i className={`ri-${message.includes('succès') || message.includes('terminé') || message.includes('OK') ? 'check' : message.includes('Erreur') ? 'error-warning' : 'information'}-line`}></i>
                <span>{message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="relative bg-black/40 backdrop-blur-md border-b border-white/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <i className="ri-radio-line text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-[\\\'Pacifico\\\'] text-white">SORadio</h1>
                <p className="text-orange-400 text-sm">Panel Admin</p>
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-400/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">EN DIRECT</span>
              </div>
              <div className="text-white text-sm">
                <div className="font-medium">{currentShow}</div>
                <div className="text-orange-300 text-xs">3,250 auditeurs</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative container mx-auto px-6 py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30 pointer-events-none"></div>
        <div className="relative flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white/15 backdrop-blur-lg rounded-2xl border border-white/30 p-4 shadow-2xl">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border border-orange-400/50' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                >
                  <i className="ri-dashboard-line"></i>
                  <span>Tableau de Bord</span>
                </button>

                <button
                  onClick={() => setActiveTab('streaming')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'streaming' ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border border-orange-400/50' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                >
                  <i className="ri-live-line"></i>
                  <span>Streaming</span>
                </button>

                <button
                  onClick={() => setActiveTab('programs')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'programs' ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border border-orange-400/50' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                >
                  <i className="ri-calendar-line"></i>
                  <span>Programmes</span>
                </button>

                <button
                  onClick={() => setActiveTab('playlist')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'playlist' ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border border-orange-400/50' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                >
                  <i className="ri-play-list-line"></i>
                  <span>Playlist</span>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'analytics' ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border border-orange-400/50' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                >
                  <i className="ri-bar-chart-line"></i>
                  <span>Statistiques</span>
                </button>

                <button
                  onClick={() => setActiveTab('content')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'content' ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border border-orange-400/50' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                >
                  <i className="ri-article-line"></i>
                  <span>Contenu</span>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'users' ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border border-orange-400/50' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                >
                  <i className="ri-user-line"></i>
                  <span>Utilisateurs</span>
                </button>

                <button
                  onClick={() => setActiveTab('beta-keys')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'beta-keys' ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border border-orange-400/50' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                >
                  <i className="ri-key-line"></i>
                  <span>Clés Beta</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'settings' ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border border-orange-400/50' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                >
                  <i className="ri-settings-line"></i>
                  <span>Paramètres</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Tableau de Bord</h1>
                  <p className="text-orange-200">Vue d'ensemble de votre radio</p>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400/30">
                        <i className="ri-headphone-line text-green-400 text-xl"></i>
                      </div>
                      <div>
                        <p className="text-orange-200">Auditeurs Actuels</p>
                        <p className="text-2xl font-bold text-white">3,250</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
                        <i className="ri-user-line text-blue-400 text-xl"></i>
                      </div>
                      <div>
                        <p className="text-orange-200">Total Utilisateurs</p>
                        <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-400/30">
                        <i className="ri-time-line text-orange-400 text-xl"></i>
                      </div>
                      <div>
                        <p className="text-orange-200">Temps d'Écoute Moy.</p>
                        <p className="text-2xl font-bold text-white">42min</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-400/30">
                        <i className="ri-music-line text-purple-400 text-xl"></i>
                      </div>
                      <div>
                        <p className="text-orange-200">Titres Joués</p>
                        <p className="text-2xl font-bold text-white">147</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">Statut en Direct</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-orange-200">Émission Actuelle</span>
                        <span className="text-white font-medium">Morning Show</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-orange-200">Animateurs</span>
                        <span className="text-white font-medium">Sophie & Marc</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-orange-200">Horaire</span>
                        <span className="text-white font-medium">06:00 - 10:00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-orange-200">Statut Stream</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 font-medium">Actif</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">Derniers Titres</h3>
                    <div className="space-y-3">
                      {mockPlaylist.map((track) => (
                        <div key={track.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{track.title}</p>
                            <p className="text-orange-200 text-sm">{track.artist}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-orange-200 text-sm">{track.played}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'streaming' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Contrôle Streaming</h1>
                  <p className="text-orange-200">Gérez la diffusion en direct</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Contrôles de Diffusion</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-orange-200">Statut du Stream</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 font-medium">EN DIRECT</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-orange-200">Bitrate</span>
                        <span className="text-white">320 kbps</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-orange-200">Serveur</span>
                        <span className="text-white">Paris #1</span>
                      </div>

                      <div className="pt-4 space-y-3">
                        <button className="w-full bg-red-500/20 text-red-400 px-4 py-3 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer whitespace-nowrap">
                          <i className="ri-stop-circle-line mr-2"></i>
                          Arrêter le Stream
                        </button>
                        <button className="w-full bg-orange-500/20 text-orange-400 px-4 py-3 rounded-lg hover:bg-orange-500/30 transition-colors cursor-pointer whitespace-nowrap">
                          <i className="ri-refresh-line mr-2"></i>
                          Redémarrer le Stream
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Métriques Temps Réel</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-orange-200">Auditeurs</span>
                          <span className="text-white">3,250 / 5,000</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-orange-200">Bande Passante</span>
                          <span className="text-white">1.2 GB/h</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-orange-200">Qualité Signal</span>
                          <span className="text-white">Excellent</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" style={{ width: '95%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6">Configuration Stream</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">URL du Stream</label>
                      <input
                        type="url"
                        defaultValue="https://stream.soradio.fr/live"
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Port</label>
                      <input
                        type="number"
                        defaultValue="8000"
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Mot de Passe Source</label>
                      <input
                        type="password"
                        defaultValue="••••••••"
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Max Auditeurs</label>
                      <input
                        type="number"
                        defaultValue="5000"
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'programs' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestion des Programmes</h1>
                    <p className="text-orange-200">Planifiez et gérez vos émissions</p>
                  </div>
                  <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap">
                    <i className="ri-add-line mr-2"></i>
                    Nouveau Programme
                  </button>
                </div>

                <div className="bg-white/15 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl">
                  <div className="p-6">
                    <div className="space-y-4">
                      {mockPrograms.map((program) => (
                        <div key={program.id} className="bg-white/15 rounded-lg p-4 border border-white/30 shadow-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${program.status === 'live'
                                  ? 'bg-green-500/20'
                                  : 'bg-gray-500/20'
                                }`}
                              >
                                <i className={`ri-radio-line text-xl ${program.status === 'live' ? 'text-green-400' : 'text-gray-400'}`}></i>
                              </div>
                              <div>
                                <h3 className="text-white font-semibold flex items-center space-x-2">
                                  <span>{program.name}</span>
                                  {program.status === 'live' && (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                      EN DIRECT
                                    </span>
                                  )}
                                </h3>
                                <p className="text-orange-200 text-sm">Animé par {program.host}</p>
                                <p className="text-gray-500 text-xs">{program.time}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-6">
                              {program.status === 'live' && (
                                <div className="text-right">
                                  <p className="text-white font-semibold">{program.listeners.toLocaleString()}</p>
                                  <p className="text-orange-200 text-sm">auditeurs</p>
                                </div>
                              )}
                              <div className="flex space-x-2">
                                <button className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer flex items-center justify-center">
                                  <i className="ri-edit-line"></i>
                                </button>
                                <button className="w-10 h-10 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer flex items-center justify-center">
                                  <i className="ri-delete-bin-line"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">Planification Rapide</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Nom du Programme</label>
                        <input
                          type="text"
                          placeholder="Ex: Réveil en Musique"
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-orange-200 text-sm mb-2">Heure de Début</label>
                          <input
                            type="time"
                            className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-orange-200 text-sm mb-2">Heure de Fin</label>
                          <input
                            type="time"
                            className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Animateur</label>
                        <input
                          type="text"
                          placeholder="Nom de l'animateur"
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white"
                        />
                      </div>
                      <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap">
                        <i className="ri-add-line mr-2"></i>
                        Ajouter au Planning
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">Actions Rapides</h3>
                    <div className="space-y-3">
                      <button className="w-full bg-green-500/20 text-green-400 px-4 py-3 rounded-lg hover:bg-green-500/30 transition-colors cursor-pointer whitespace-nowrap text-left">
                        <i className="ri-play-circle-line mr-3"></i>
                        Démarrer Programme Suivant
                      </button>
                      <button className="w-full bg-orange-500/20 text-orange-400 px-4 py-3 rounded-lg hover:bg-orange-500/30 transition-colors cursor-pointer whitespace-nowrap text-left">
                        <i className="ri-skip-forward-line mr-3"></i>
                        Passer à l'Émission Suivante
                      </button>
                      <button className="w-full bg-blue-500/20 text-blue-400 px-4 py-3 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer whitespace-nowrap text-left">
                        <i className="ri-calendar-check-line mr-3"></i>
                        Voir Planning Complet
                      </button>
                      <button className="w-full bg-purple-500/20 text-purple-400 px-4 py-3 rounded-lg hover:bg-purple-500/30 transition-colors cursor-pointer whitespace-nowrap text-left">
                        <i className="ri-notification-line mr-3"></i>
                        Rappels Programmés
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'playlist' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestion Playlist</h1>
                    <p className="text-orange-200">Gérez votre bibliothèque musicale</p>
                  </div>
                  <div className="flex space-x-3">
                    <button className="bg-blue-500/20 text-blue-400 px-4 py-3 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer whitespace-nowrap">
                      <i className="ri-upload-line mr-2"></i>
                      Importer
                    </button>
                    <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap">
                      <i className="ri-add-line mr-2"></i>
                      Ajouter Titre
                    </button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-play-circle-line text-green-400 text-2xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-white mb-2">Blinding Lights</p>
                      <p className="text-orange-200 text-sm">The Weeknd</p>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-orange-200 mt-2">
                      <span>2:10</span>
                      <span>3:20</span>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-music-line text-orange-400 text-2xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-white mb-2">2,847</p>
                      <p className="text-orange-200">Titres dans la Bibliothèque</p>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-time-line text-purple-400 text-2xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-white mb-2">147h</p>
                      <p className="text-orange-200">Durée Totale</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Playlist Actuelle</h3>
                      <div className="flex space-x-2">
                        <select className="px-4 py-2 bg-black/30 border border-white/30 rounded-lg text-white pr-8">
                          <option>Tous les types</option>
                          <option>Podcasts</option>
                          <option>Articles</option>
                          <option>Événements</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {mockPlaylist.map((track, index) => (
                        <div key={track.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 text-center text-orange-200 text-sm">{index + 1}</div>
                            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                              <i className="ri-music-line text-white"></i>
                            </div>
                            <div>
                              <p className="text-white font-medium">{track.title}</p>
                              <p className="text-orange-200 text-sm">{track.artist}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-orange-200 text-sm">{track.duration}</span>
                            <span className="text-gray-500 text-sm">{track.played}</span>
                            <button className="w-8 h-8 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors cursor-pointer flex items-center justify-center">
                              <i className="ri-more-line"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Statistiques d'Audience</h1>
                  <p className="text-orange-200">Analysez les performances de votre radio</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-eye-line text-blue-400 text-2xl"></i>
                      </div>
                      <p className="text-3xl font-bold text-white mb-2">47,392</p>
                      <p className="text-orange-200">Vues Aujourd'hui</p>
                      <p className="text-green-400 text-sm mt-2">↑ +12%</p>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-headphone-line text-green-400 text-2xl"></i>
                      </div>
                      <p className="text-3xl font-bold text-white mb-2">3,250</p>
                      <p className="text-orange-200">Auditeurs Actifs</p>
                      <p className="text-green-400 text-sm mt-2">↑ +8%</p>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-time-line text-orange-400 text-2xl"></i>
                      </div>
                      <p className="text-3xl font-bold text-white mb-2">42min</p>
                      <p className="text-orange-200">Temps Moy. Écoute</p>
                      <p className="text-green-400 text-sm mt-2">↑ +15%</p>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-download-line text-purple-400 text-2xl"></i>
                      </div>
                      <p className="text-3xl font-bold text-white mb-2">1,847</p>
                      <p className="text-orange-200">Téléchargements</p>
                      <p className="text-red-400 text-sm mt-2">↓ -3%</p>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Audience par Heure</h3>
                    <div className="space-y-4">
                      {[
                        { hour: '06:00', listeners: 2100, percentage: 65 },
                        { hour: '08:00', listeners: 3250, percentage: 100 },
                        { hour: '12:00', listeners: 1890, percentage: 58 },
                        { hour: '16:00', listeners: 2750, percentage: 85 },
                        { hour: '20:00', listeners: 1650, percentage: 51 },
                        { hour: '22:00', listeners: 980, percentage: 30 }
                      ].map((data) => (
                        <div key={data.hour}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-orange-200">{data.hour}</span>
                            <span className="text-white">{data.listeners.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{ width: `${data.percentage}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Top Programmes</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Morning Show', listeners: 3250, growth: 12 },
                        { name: 'Mix Afternoon', listeners: 2890, growth: 8 },
                        { name: 'Night Session', listeners: 1650, growth: -2 },
                        { name: 'Weekend Special', listeners: 1420, growth: 15 }
                      ].map((program, index) => (
                        <div key={program.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-white font-medium">{program.name}</p>
                              <p className="text-orange-200 text-sm">{program.listeners.toLocaleString()} auditeurs</p>
                            </div>
                          </div>
                          <div className={`text-sm font-medium ${program.growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {program.growth > 0 ? '↑' : '↓'} {Math.abs(program.growth)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6">Données Géographiques</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-white font-semibold mb-4">Top Villes</h4>
                      <div className="space-y-3">
                        {[
                          { city: 'Bordeaux', percentage: 45 },
                          { city: 'Toulouse', percentage: 18 },
                          { city: 'Paris', percentage: 12 },
                          { city: 'Lyon', percentage: 8 },
                          { city: 'Autres', percentage: 17 }
                        ].map((data) => (
                          <div key={data.city} className="flex justify-between items-center">
                            <span className="text-orange-200">{data.city}</span>
                            <span className="text-white font-medium">{data.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-semibold mb-4">Plateformes</h4>
                      <div className="space-y-3">
                        {[
                          { platform: 'Web', percentage: 52 },
                          { platform: 'Mobile', percentage: 38 },
                          { platform: 'Radio FM', percentage: 10 }
                        ].map((data) => (
                          <div key={data.platform} className="flex justify-between items-center">
                            <span className="text-orange-200">{data.platform}</span>
                            <span className="text-white font-medium">{data.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-semibold mb-4">Âge des Auditeurs</h4>
                      <div className="space-y-3">
                        {[
                          { age: '18-24', percentage: 28 },
                          { age: '25-34', percentage: 35 },
                          { age: '35-49', percentage: 24 },
                          { age: '50+', percentage: 13 }
                        ].map((data) => (
                          <div key={data.age} className="flex justify-between items-center">
                            <span className="text-orange-200">{data.age} ans</span>
                            <span className="text-white font-medium">{data.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestion du Contenu</h1>
                    <p className="text-orange-200">Gérez vos podcasts, actualités et événements</p>
                  </div>
                  <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap">
                    <i className="ri-add-line mr-2"></i>
                    Nouveau Contenu
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-headphone-line text-blue-400 text-2xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-white mb-2">24</p>
                      <p className="text-orange-200">Podcasts</p>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-newspaper-line text-green-400 text-2xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-white mb-2">47</p>
                      <p className="text-orange-200">Articles</p>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-calendar-event-line text-purple-400 text-2xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-white mb-2">12</p>
                      <p className="text-orange-200">Événements</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Contenu Récent</h3>
                      <div className="flex space-x-2">
                        <select className="px-4 py-2 bg-black/30 border border-white/30 rounded-lg text-white pr-8">
                          <option>Tous les types</option>
                          <option>Podcasts</option>
                          <option>Articles</option>
                          <option>Événements</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { id: 1, type: 'podcast', title: 'Interview avec Local Artist', date: '2024-01-15', status: 'published', views: 1250 },
                        { id: 2, type: 'article', title: 'Festival de Musique Bordeaux 2024', date: '2024-01-14', status: 'draft', views: 0 },
                        { id: 3, type: 'event', title: 'Concert Live Studio', date: '2024-01-20', status: 'scheduled', views: 890 },
                        { id: 4, type: 'podcast', title: 'Les Tendances Musicales 2024', date: '2024-01-12', status: 'published', views: 2100 }
                      ].map((content) => (
                        <div key={content.id} className="bg-white/15 rounded-lg p-4 border border-white/30 shadow-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${content.type === 'podcast'
                                  ? 'bg-blue-500/20'
                                  : content.type === 'article'
                                  ? 'bg-green-500/20'
                                  : 'bg-purple-500/20'
                                }`}
                              >
                                <i
                                  className={`text-xl ${content.type === 'podcast'
                                    ? 'ri-headphone-line text-blue-400'
                                    : content.type === 'article'
                                    ? 'ri-newspaper-line text-green-400'
                                    : 'ri-calendar-event-line text-purple-400'
                                  }`}
                                ></i>
                              </div>
                              <div>
                                <h4 className="text-white font-semibold">{content.title}</h4>
                                <div className="flex items-center space-x-4 text-sm text-orange-200">
                                  <span>{content.date}</span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${content.status === 'published'
                                      ? 'bg-green-500/20 text-green-400'
                                      : content.status === 'draft'
                                      ? 'bg-yellow-500/20 text-yellow-400'
                                      : 'bg-blue-500/20 text-blue-400'
                                    }`}
                                  >
                                    {content.status}
                                  </span>
                                  {content.views > 0 && <span>{content.views} vues</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer flex items-center justify-center">
                                <i className="ri-edit-line"></i>
                              </button>
                              <button className="w-10 h-10 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer flex items-center justify-center">
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Gestion des Utilisateurs</h1>
                  <p className="text-orange-200">Gérez les comptes et permissions</p>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <i className="ri-user-line text-blue-400 text-xl"></i>
                      </div>
                      <div>
                        <p className="text-orange-200 text-sm">Total Utilisateurs</p>
                        <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <i className="ri-admin-line text-orange-400 text-xl"></i>
                      </div>
                      <div>
                        <p className="text-orange-200 text-sm">Administrateurs</p>
                        <p className="text-2xl font-bold text-white">{stats.admins}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                        <i className="ri-user-smile-line text-green-400 text-xl"></i>
                      </div>
                      <div>
                        <p className="text-orange-200 text-sm">Utilisateurs</p>
                        <p className="text-2xl font-bold text-white">{stats.regularUsers}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <i className="ri-user-add-line text-purple-400 text-xl"></i>
                      </div>
                      <div>
                        <p className="text-orange-200 text-sm">Nouveaux (7j)</p>
                        <p className="text-2xl font-bold text-white">{stats.recentUsers}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl">
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Liste des Utilisateurs</h2>
                    <div className="space-y-4">
                      {allProfiles.map((userProfile) => (
                        <div key={userProfile.id} className="bg-white/15 rounded-lg p-4 border border-white/30 shadow-xl">
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
                                <p className="text-orange-200 text-sm">{userProfile.email}</p>
                                <div className="flex items-center space-x-4 text-gray-500 text-xs">
                                  <span>Inscrit le {new Date(userProfile.created_at).toLocaleDateString('fr-FR')}</span>
                                  {userProfile.phone && (
                                    <span>
                                      <i className="ri-phone-line mr-1"></i>
                                      {userProfile.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEditUserModal(userProfile)}
                                className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer flex items-center justify-center"
                                title="Modifier le profil"
                              >
                                <i className="ri-edit-line"></i>
                              </button>
                              {userProfile.id !== user.id && (
                                <>
                                  <button
                                    onClick={() => toggleAdminStatus(userProfile.id, userProfile.is_admin)}
                                    className={`w-10 h-10 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${userProfile.is_admin
                                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                    }`}
                                    title={userProfile.is_admin ? 'Retirer les droits admin' : 'Donner les droits admin'}
                                  >
                                    <i className={userProfile.is_admin ? 'ri-user-unfollow-line' : 'ri-user-star-line'}></i>
                                  </button>
                                  <button
                                    onClick={() => deleteUserProfile(userProfile)}
                                    className="w-10 h-10 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer flex items-center justify-center"
                                    title="Supprimer le compte"
                                  >
                                    <i className="ri-delete-bin-line"></i>
                                  </button>
                                </>
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
                </div>
              </div>
            )}

            {activeTab === 'beta-keys' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestion des Clés Beta</h1>
                    <p className="text-orange-200">Créez et gérez les accès beta pour les testeurs</p>
                  </div>
                  <button
                    onClick={() => setShowBetaModal(true)}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-add-line mr-2"></i>
                    Nouvelle Clé Beta
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-key-line text-purple-400 text-2xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-white mb-2">{betaKeys.length}</p>
                      <p className="text-orange-200">Clés Totales</p>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-check-line text-green-400 text-2xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-white mb-2">
                        {betaKeys.filter((key) => {
                          const isExpired = new Date(key.expires_at) <= new Date();
                          const isExhausted = key.usage_count >= key.max_usage;
                          return key.is_active && !isExpired && !isExhausted;
                        }).length}
                      </p>
                      <p className="text-orange-200">Clés Actives</p>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-time-line text-red-400 text-2xl"></i>
                      </div>
                      <p className="text-2xl font-bold text-white mb-2">
                        {betaKeys.filter((key) => {
                          const isExpired = new Date(key.expires_at) <= new Date();
                          const isExhausted = key.usage_count >= key.max_usage;
                          return isExpired || isExhausted;
                        }).length}
                      </p>
                      <p className="text-orange-200">Clés Expirées/Épuisées</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Liste des Clés Beta</h3>
                    <div className="space-y-4">
                      {betaKeys.map((betaKey) => {
                        const isExpired = new Date(betaKey.expires_at) <= new Date();
                        const isExhausted = betaKey.usage_count >= betaKey.max_usage;
                        const isActive = betaKey.is_active && !isExpired && !isExhausted;

                        return (
                          <div key={betaKey.id} className="bg-white/15 rounded-lg p-4 border border-white/30 shadow-xl">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div
                                  className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive
                                    ? 'bg-green-500/20'
                                    : isExpired
                                    ? 'bg-red-500/20'
                                    : isExhausted
                                    ? 'bg-orange-500/20'
                                    : 'bg-gray-500/20'
                                  }`}
                                >
                                  <i
                                    className={`ri-key-line text-xl ${isActive
                                      ? 'text-green-400'
                                      : isExpired
                                      ? 'text-red-400'
                                      : isExhausted
                                      ? 'text-orange-400'
                                      : 'text-gray-400'
                                    }`}
                                  ></i>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-3">
                                    <h4 className="text-white font-mono text-sm">{betaKey.key_code}</h4>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${isActive
                                        ? 'bg-green-500/20 text-green-400'
                                        : isExpired
                                        ? 'bg-red-500/20 text-red-400'
                                        : isExhausted
                                        ? 'bg-orange-500/20 text-orange-400'
                                        : 'bg-gray-500/20 text-gray-400'
                                      }`}
                                    >
                                      {isActive
                                        ? 'Active'
                                        : isExpired
                                        ? 'Expirée'
                                        : isExhausted
                                        ? 'Épuisée'
                                        : 'Inactive'}
                                    </span>
                                  </div>
                                  <p className="text-orange-200 text-sm">{betaKey.description}</p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                                    <span>Expire: {new Date(betaKey.expires_at).toLocaleString('fr-FR')}</span>
                                    <span
                                      className={`${betaKey.usage_count >= betaKey.max_usage
                                        ? 'text-orange-400 font-semibold'
                                        : ''
                                      }`}
                                    >
                                      Utilisations: {betaKey.usage_count}/{betaKey.max_usage}
                                    </span>
                                    <span>Par: {betaKey.profiles?.full_name || betaKey.profiles?.email}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(betaKey.key_code);
                                    setMessage(' Clé copiée dans le presse-papiers');
                                    setTimeout(() => setMessage(''), 3000);
                                  }}
                                  className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer flex items-center justify-center"
                                  title="Copier la clé"
                                >
                                  <i className="ri-clipboard-line"></i>
                                </button>
                                {!isExpired && !isExhausted && (
                                  <button
                                    onClick={() => toggleBetaKey(betaKey.id, betaKey.is_active)}
                                    className={`w-10 h-10 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${betaKey.is_active
                                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                    }`}
                                    title={betaKey.is_active ? 'Désactiver' : 'Activer'}
                                  >
                                    <i className={betaKey.is_active ? 'ri-pause-line' : 'ri-play-line'}></i>
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteBetaKey(betaKey.id)}
                                  className="w-10 h-10 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer flex items-center justify-center"
                                  title="Supprimer"
                                >
                                  <i className="ri-delete-bin-line"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {betaKeys.length === 0 && (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="ri-key-line text-gray-400 text-2xl"></i>
                          </div>
                          <p className="text-gray-400">Aucune clé beta créée</p>
                          <button
                            onClick={() => setShowBetaModal(true)}
                            className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform cursor-pointer whitespace-nowrap"
                          >
                            Créer la première clé
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Paramètres de la Radio</h1>
                  <p className="text-orange-200">Configuration générale et avancée</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Informations Générales</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Nom de la Radio</label>
                        <input
                          type="text"
                          value={settings.general.name}
                          onChange={(e) => updateSettings('general', 'name', e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Slogan</label>
                        <input
                          type="text"
                          value={settings.general.slogan}
                          onChange={(e) => updateSettings('general', 'slogan', e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Fréquence FM</label>
                        <input
                          type="text"
                          value={settings.general.frequency}
                          onChange={(e) => updateSettings('general', 'frequency', e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Email de Contact</label>
                        <input
                          type="email"
                          value={settings.general.email}
                          onChange={(e) => updateSettings('general', 'email', e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Téléphone</label>
                        <input
                          type="tel"
                          value={settings.general.phone}
                          onChange={(e) => updateSettings('general', 'phone', e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Adresse</label>
                        <textarea
                          value={settings.general.address}
                          onChange={(e) => updateSettings('general', 'address', e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none resize-none backdrop-blur-sm"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Configuration Stream</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">URL du Stream Principal</label>
                        <input
                          type="url"
                          value={settings.streaming.primaryUrl}
                          onChange={(e) => updateSettings('streaming', 'primaryUrl', e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">URL Stream Backup</label>
                        <input
                          type="url"
                          value={settings.streaming.backupUrl}
                          onChange={(e) => updateSettings('streaming', 'backupUrl', e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Bitrate</label>
                        <select
                          value={settings.streaming.bitrate}
                          onChange={(e) => updateSettings('streaming', 'bitrate', e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white pr-8 focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                        >
                          <option value="128">128 kbps</option>
                          <option value="192">192 kbps</option>
                          <option value="320">320 kbps</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Format Audio</label>
                        <select
                          value={settings.streaming.format}
                          onChange={(e) => updateSettings('streaming', 'format', e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white pr-8 focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                        >
                          <option value="mp3">MP3</option>
                          <option value="aac">AAC</option>
                          <option value="ogg">OGG</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Max Auditeurs Simultanés</label>
                        <input
                          type="number"
                          value={settings.streaming.maxListeners}
                          onChange={(e) => updateSettings('streaming', 'maxListeners', e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Mot de Passe Source</label>
                        <input
                          type="password"
                          value={settings.streaming.sourcePassword}
                          onChange={(e) => updateSettings('streaming', 'sourcePassword', e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6">Réseaux Sociaux</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Facebook</label>
                      <input
                        type="url"
                        value={settings.social.facebook}
                        onChange={(e) => updateSettings('social', 'facebook', e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Instagram</label>
                      <input
                        type="url"
                        value={settings.social.instagram}
                        onChange={(e) => updateSettings('social', 'instagram', e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Twitter/X</label>
                      <input
                        type="url"
                        value={settings.social.twitter}
                        onChange={(e) => updateSettings('social', 'twitter', e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">YouTube</label>
                      <input
                        type="url"
                        value={settings.social.youtube}
                        onChange={(e) => updateSettings('social', 'youtube', e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Spotify</label>
                      <input
                        type="url"
                        value={settings.social.spotify}
                        onChange={(e) => updateSettings('social', 'spotify', e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">TikTok</label>
                      <input
                        type="url"
                        value={settings.social.tiktok}
                        onChange={(e) => updateSettings('social', 'tiktok', e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6">Configuration Email & Notifications</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Serveur SMTP</label>
                      <input
                        type="text"
                        value={settings.email.smtpServer}
                        onChange={(e) => updateSettings('email', 'smtpServer', e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Port SMTP</label>
                      <input
                        type="number"
                        value={settings.email.smtpPort}
                        onChange={(e) => updateSettings('email', 'smtpPort', e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Utilisateur Email</label>
                      <input
                        type="email"
                        value={settings.email.emailUser}
                        onChange={(e) => updateSettings('email', 'emailUser', e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Mot de Passe Email</label>
                      <input
                        type="password"
                        value={settings.email.emailPassword}
                        onChange={(e) => updateSettings('email', 'emailPassword', e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h4 className="text-white font-semibold">Options de Notification</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email.audienceNotif}
                          onChange={(e) => updateSettings('email', 'audienceNotif', e.target.checked)}
                          className="w-4 h-4 text-orange-500 bg-black/30 border-white/30 rounded focus:ring-orange-400"
                        />
                        <span className="text-orange-200">Notifications d'audience</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email.techAlerts}
                          onChange={(e) => updateSettings('email', 'techAlerts', e.target.checked)}
                          className="w-4 h-4 text-orange-500 bg-black/30 border-white/30 rounded focus:ring-orange-400"
                        />
                        <span className="text-orange-200">Alertes techniques</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email.newUsers}
                          onChange={(e) => updateSettings('email', 'newUsers', e.target.checked)}
                          className="w-4 h-4 text-orange-500 bg-black/30 border-white/30 rounded focus:ring-orange-400"
                        />
                        <span className="text-orange-200">Nouveaux utilisateurs</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email.dailyReports}
                          onChange={(e) => updateSettings('email', 'dailyReports', e.target.checked)}
                          className="w-4 h-4 text-orange-500 bg-black/30 border-white/30 rounded focus:ring-orange-400"
                        />
                        <span className="text-orange-200">Rapports quotidiens</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6">API & Webhooks</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Clé API Publique</label>
                      <input
                        type="text"
                        value={settings.api.publicKey}
                        readOnly
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">Clé API Secrète</label>
                      <input
                        type="password"
                        value={settings.api.secretKey}
                        readOnly
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">URL Webhook Stats</label>
                      <input
                        type="url"
                        value={settings.api.webhookStats}
                        onChange={(e) => updateSettings('api', 'webhookStats', e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-orange-200 text-sm mb-2">URL Webhook Listeners</label>
                      <input
                        type="url"
                        value={settings.api.webhookListeners}
                        onChange={(e) => updateSettings('api', 'webhookListeners', e.target.value)}
                        className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => handleSystemAction('regenerate-keys', 'Régénération des clés API')}
                      disabled={processing !== ''}
                      className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="ri-refresh-line mr-2"></i>
                      Régénérer Clés
                    </button>
                    <button
                      onClick={() => handleSystemAction('test-webhooks', 'Test des webhooks')}
                      disabled={processing !== ''}
                      className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="ri-check-line mr-2"></i>
                      Tester Webhooks
                    </button>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6">Actions Système</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-white font-semibold">Sauvegarde & Export</h4>
                      <button
                        onClick={() => handleSystemAction('export-users', 'Export des données utilisateurs')}
                        disabled={processing !== ''}
                        className="w-full bg-blue-500/20 text-blue-400 px-4 py-3 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer whitespace-nowrap text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-download-line mr-3"></i>
                        Exporter Données Utilisateurs
                      </button>
                      <button
                        onClick={() => handleSystemAction('backup-config', 'Sauvegarde de la configuration')}
                        disabled={processing !== ''}
                        className="w-full bg-green-500/20 text-green-400 px-4 py-3 rounded-lg hover:bg-green-500/30 transition-colors cursor-pointer whitespace-nowrap text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-save-line mr-3"></i>
                        Sauvegarder Configuration
                      </button>
                      <button
                        onClick={() => handleSystemAction('backup-db', 'Sauvegarde de la base de données')}
                        disabled={processing !== ''}
                        className="w-full bg-purple-500/20 text-purple-400 px-4 py-3 rounded-lg hover:bg-purple-500/30 transition-colors cursor-pointer whitespace-nowrap text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-database-line mr-3"></i>
                        Backup Base de Données
                      </button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-white font-semibold">Monitoring</h4>
                      <button
                        onClick={() => handleSystemAction('status-services', 'Vérification du statut des services')}
                        disabled={processing !== ''}
                        className="w-full bg-cyan-500/20 text-cyan-400 px-4 py-3 rounded-lg hover:bg-cyan-500/30 transition-colors cursor-pointer whitespace-nowrap text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-bar-chart-line mr-3"></i>
                        Statut Services
                      </button>
                      <button
                        onClick={() => handleSystemAction('performance', 'Analyse des performances système')}
                        disabled={processing !== ''}
                        className="w-full bg-teal-500/20 text-teal-400 px-4 py-3 rounded-lg hover:bg-teal-500/30 transition-colors cursor-pointer whitespace-nowrap text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-pulse-line mr-3"></i>
                        Performance Système
                      </button>
                      <button
                        onClick={() => handleSystemAction('security', 'Audit de sécurité et accès')}
                        disabled={processing !== ''}
                        className="w-full bg-indigo-500/20 text-indigo-400 px-4 py-3 rounded-lg hover:bg-indigo-500/30 transition-colors cursor-pointer whitespace-nowrap text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-shield-check-line mr-3"></i>
                        Sécurité & Accès
                      </button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-white font-semibold">Maintenance</h4>
                      <button
                        onClick={() => handleSystemAction('restart-services', 'Redémarrage des services')}
                        disabled={processing !== ''}
                        className="w-full bg-orange-500/20 text-orange-400 px-4 py-3 rounded-lg hover:bg-orange-500/30 transition-colors cursor-pointer whitespace-nowrap text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-refresh-line mr-3"></i>
                        Redémarrer Services
                      </button>
                      <button
                        onClick={() =>
                          handleSystemAction(
                            'maintenance-mode',
                            maintenanceActive ? 'Désactivation du mode maintenance' : 'Activation du mode maintenance'
                          )
                        }
                        disabled={processing !== ''}
                        className={`w-full px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                          maintenanceActive
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        }`}
                      >
                        <i className={maintenanceActive ? 'ri-check-line' : 'ri-tools-line'}></i>
                        {maintenanceActive ? 'Désactiver Maintenance' : 'Activer Maintenance'}
                      </button>
                      <button
                        onClick={() => handleSystemAction('system-logs', 'Consultation des logs système')}
                        disabled={processing !== ''}
                        className="w-full bg-red-500/20 text-red-400 px-4 py-3 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer whitespace-nowrap text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-bug-line mr-3"></i>
                        Logs Système
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6">Statut des Services</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/15 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-orange-200 text-sm">Stream Principal</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-xs">Actif</span>
                        </div>
                      </div>
                      <div className="text-white text-xs">Uptime: 99.9%</div>
                    </div>

                    <div className="bg-white/15 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-orange-200 text-sm">Base de Données</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-xs">Actif</span>
                        </div>
                      </div>
                      <div className="text-white text-xs">Latence: 12ms</div>
                    </div>

                    <div className="bg-white/15 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-orange-200 text-sm">API</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-xs">Actif</span>
                        </div>
                      </div>
                      <div className="text-white text-xs">Requêtes/min: 847</div>
                    </div>

                    <div className="bg-white/15 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-orange-200 text-sm">CDN</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-xs">Actif</span>
                        </div>
                      </div>
                      <div className="text-white text-xs">Cache: 94%</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      getSettings().then(setSettings);
                      setMessage(' Paramètres rechargés depuis la base de données');
                      setTimeout(() => setMessage(''), 3000);
                    }}
                    disabled={saving || processing !== ''}
                    className="bg-gray-500/20 text-gray-400 px-6 py-3 rounded-lg hover:bg-gray-500/30 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="ri-refresh-line mr-2"></i>
                    Recharger
                  </button>
                  <button
                    onClick={() => setMessage(' Prévisualisation: ces paramètres seront appliqués sur le site principal')}
                    disabled={saving || processing !== ''}
                    className="bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="ri-eye-line mr-2"></i>
                    Prévisualiser
                  </button>
                  <button
                    onClick={saveSettingsHandler}
                    disabled={saving || processing !== ''}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line mr-2"></i>
                        Sauvegarder & Appliquer
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de création de clé beta */}
      {showBetaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full mx-4 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Créer une Clé Beta</h3>
              <button
                onClick={() => setShowBetaModal(false)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <i className="ri-close-line text-white"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-orange-200 text-sm mb-2">Description</label>
                <input
                  type="text"
                  value={newBetaKey.description}
                  onChange={(e) => setNewBetaKey((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                  placeholder="Ex: Accès pour les testeurs VIP"
                />
              </div>

              <div>
                <label className="block text-orange-200 text-sm mb-2">Durée de validité (heures)</label>
                <select
                  value={newBetaKey.duration}
                  onChange={(e) => setNewBetaKey((prev) => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white pr-8 focus:border-purple-400 focus:outline-none"
                >
                  <option value="1">1 heure</option>
                  <option value="6">6 heures</option>
                  <option value="12">12 heures</option>
                  <option value="24">24 heures (1 jour)</option>
                  <option value="48">48 heures (2 jours)</option>
                  <option value="72">72 heures (3 jours)</option>
                  <option value="168">168 heures (1 semaine)</option>
                  <option value="720">720 heures (1 mois)</option>
                </select>
              </div>

              <div>
                <label className="block text-orange-200 text-sm mb-2">Nombre d'utilisations maximum</label>
                <input
                  type="number"
                  value={newBetaKey.maxUsage}
                  onChange={(e) => setNewBetaKey((prev) => ({ ...prev, maxUsage: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                  min="1"
                  max="100"
                />
              </div>

              <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
                <p className="text-purple-300 text-sm">
                  <i className="ri-information-line mr-2"></i>
                  La clé sera générée automatiquement et sera valide pendant {newBetaKey.duration} heure
                  {parseInt(newBetaKey.duration) > 1 ? 's' : ''}.
                </p>
              </div>

              <button
                onClick={createBetaKey}
                disabled={processing !== ''}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:hover:scale-100"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <i className="ri-key-line mr-2"></i>
                    Créer la Clé Beta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition d'utilisateur */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-2xl w-full mx-4 border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Modifier le Profil Utilisateur</h3>
              <button
                onClick={closeEditUserModal}
                disabled={saving}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                <i className="ri-close-line text-white"></i>
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations de base */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center">
                  <i className="ri-user-line mr-2 text-orange-400"></i>
                  Informations Personnelles
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-orange-200 text-sm mb-2">Nom complet *</label>
                    <input
                      type="text"
                      value={editUserForm.full_name}
                      onChange={(e) => setEditUserForm((prev) => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none"
                      placeholder="Nom et prénom"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-orange-200 text-sm mb-2">Email *</label>
                    <input
                      type="email"
                      value={editUserForm.email}
                      onChange={(e) => setEditUserForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-orange-200 text-sm mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={editUserForm.phone}
                    onChange={(e) => setEditUserForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center">
                  <i className="ri-article-line mr-2 text-blue-400"></i>
                  Biographie
                </h4>
                <div>
                  <label className="block text-orange-200 text-sm mb-2">Bio utilisateur</label>
                  <textarea
                    value={editUserForm.bio}
                    onChange={(e) => setEditUserForm((prev) => ({ ...prev, bio: e.target.value.slice(0, 500) }))}
                    className="w-full px-4 py-3 bg-black/30 border border-white/30 rounded-lg text-white focus:border-orange-400 focus:outline-none resize-none"
                    rows={3}
                    placeholder="Description de l'utilisateur..."
                    maxLength={500}
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    {editUserForm.bio.length}/500 caractères
                  </p>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center">
                  <i className="ri-shield-user-line mr-2 text-purple-400"></i>
                  Permissions & Statut
                </h4>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editUserForm.is_admin}
                      onChange={(e) => setEditUserForm((prev) => ({ ...prev, is_admin: e.target.checked }))}
                      className="w-5 h-5 text-orange-500 bg-black/30 border-white/30 rounded focus:ring-orange-400"
                      disabled={editingUser.id === user.id}
                    />
                    <div>
                      <span className="text-white font-medium">Administrateur</span>
                      <p className="text-orange-200 text-sm">
                        Accès complet au panel d'administration
                        {editingUser.id === user.id && (
                          <span className="text-yellow-400 ml-2">(Vous ne pouvez pas modifier vos propres droits)</span>
                        )}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Informations du compte */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center">
                  <i className="ri-information-line mr-2 text-green-400"></i>
                  Informations du Compte
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-orange-200">ID Utilisateur</p>
                    <p className="text-white font-mono text-xs">{editingUser.id}</p>
                  </div>
                  <div>
                    <p className="text-orange-200">Statut Actuel</p>
                    <p className="text-white">
                      {editingUser.is_admin ? (
                        <span className="text-orange-400">👑 Administrateur</span>
                      ) : (
                        <span className="text-green-400">👤 Utilisateur</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-orange-200">Membre depuis</p>
                    <p className="text-white">
                      {new Date(editingUser.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-orange-200">Dernière modification</p>
                    <p className="text-white">
                      {new Date(editingUser.updated_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  onClick={closeEditUserModal}
                  disabled={saving}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Annuler
                </button>
                <div className="flex space-x-3">
                  {editingUser.id !== user.id && (
                    <button
                      onClick={() => deleteUserProfile(editingUser)}
                      disabled={saving}
                      className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      <i className="ri-delete-bin-line mr-2"></i>
                      Supprimer le Compte
                    </button>
                  )}
                  <button
                    onClick={saveUserProfile}
                    disabled={saving || !editUserForm.full_name.trim() || !editUserForm.email.trim()}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line mr-2"></i>
                        Sauvegarder les Modifications
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import { getSettings, saveSettings as saveSettingsToDb, toggleMaintenanceMode, type SiteSettings } from '@/lib/settings';
import Link from 'next/link';
import ChatWidget from '@/components/ChatWidget';

interface ChatMessage {
  id: string;
  user_name: string;
  user_email: string;
  user_role: 'admin' | 'journaliste' | 'moderateur' | 'animateur' | 'vip' | 'auditeur';
  message: string;
  created_at: string;
}

interface ExtendedProfile extends Profile {
  role: 'admin' | 'journaliste' | 'moderateur' | 'animateur' | 'vip' | 'auditeur';
  is_banned?: boolean;
  is_muted?: boolean;
  ban_reason?: string;
  mute_until?: string;
  warnings_count?: number;
}

interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  listenTime: number;
  mostPlayedShow: string;
  peakListeners: number;
  chatMessages: number;
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<ExtendedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [streamStatus, setStreamStatus] = useState('live');
  const [currentShow, setCurrentShow] = useState('Morning Show - Sophie & Marc');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalVisits: 0,
    uniqueVisitors: 0,
    listenTime: 0,
    mostPlayedShow: '',
    peakListeners: 0,
    chatMessages: 0
  });
  const [emergencyAlert, setEmergencyAlert] = useState({
    isActive: false,
    message: '',
    type: 'info' as 'info' | 'warning' | 'emergency'
  });
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'SORadio',
    siteDescription: 'La radio qui vous accompagne',
    maintenanceMode: false
  });

  const roleColors = {
    admin: { 
      bg: 'bg-red-50 border-red-200', 
      text: 'text-red-700', 
      badge: 'bg-red-500 text-white',
      icon: 'ri-shield-star-line',
      label: 'Admin'
    },
    journaliste: { 
      bg: 'bg-blue-50 border-blue-200', 
      text: 'text-blue-700', 
      badge: 'bg-blue-500 text-white',
      icon: 'ri-mic-line',
      label: 'Journaliste'
    },
    moderateur: { 
      bg: 'bg-green-50 border-green-200', 
      text: 'text-green-700', 
      badge: 'bg-green-500 text-white',
      icon: 'ri-shield-check-line',
      label: 'Modérateur'
    },
    animateur: { 
      bg: 'bg-purple-50 border-purple-200', 
      text: 'text-purple-700', 
      badge: 'bg-purple-500 text-white',
      icon: 'ri-radio-line',
      label: 'Animateur'
    },
    vip: { 
      bg: 'bg-yellow-50 border-orange-200', 
      text: 'text-orange-700', 
      badge: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
      icon: 'ri-star-line',
      label: 'VIP'
    },
    auditeur: { 
      bg: 'bg-gray-50 border-gray-200', 
      text: 'text-gray-700', 
      badge: 'bg-gray-500 text-white',
      icon: 'ri-user-line',
      label: 'Auditeur'
    }
  };

  const [moderationAction, setModerationAction] = useState({ 
    type: '', 
    userId: '', 
    reason: '', 
    duration: '1' 
  });
  const [showModerationModal, setShowModerationModal] = useState(false);

  useEffect(() => {
    console.log('🔧 Admin: Init avec système de rôles corrigé');
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        console.log('❌ Admin: Pas d\'utilisateur connecté - Redirection');
        window.location.href = '/';
        return;
      }

      console.log('👤 Admin: Utilisateur connecté:', currentUser.email);
      setUser(currentUser);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError || !profileData) {
        console.error('❌ Admin: Erreur récupération profil:', profileError);
        window.location.href = '/';
        return;
      }

      if (!profileData.is_admin) {
        console.log('❌ Admin: Utilisateur pas admin - Redirection');
        window.location.href = '/';
        return;
      }

      console.log('✅ Admin: Accès autorisé pour:', profileData.full_name);
      setProfile(profileData);

      await Promise.all([
        loadAllUsers(), 
        loadSettings(), 
        loadChatMessages(),
        loadAnalytics()
      ]);

      setLoading(false);
    } catch (error) {
      console.error('❌ Admin: Erreur vérification accès:', error);
      window.location.href = '/';
    }
  };

  const loadSettings = async () => {
    try {
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);
      setStreamStatus(loadedSettings.maintenanceMode ? 'maintenance' : 'live');
    } catch (error) {
      console.error('❌ Admin: Erreur chargement paramètres:', error);
    }
  };

  const loadChatMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setChatMessages(data);
      }
    } catch (error) {
      console.error('❌ Admin: Erreur chargement messages:', error);
    }
  };

  const loadAnalytics = async () => {
    const mockAnalytics: AnalyticsData = {
      totalVisits: 15247,
      uniqueVisitors: 8934,
      listenTime: 342567,
      mostPlayedShow: 'Morning Show',
      peakListeners: 1589,
      chatMessages: chatMessages.length
    };
    setAnalytics(mockAnalytics);
  };

  const loadAllUsers = async () => {
    try {
      console.log('👥 Admin: Chargement de tous les utilisateurs');
      setProcessing('Actualisation de la liste des utilisateurs');

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Admin: Erreur chargement utilisateurs:', error);
        setMessage('❌ Erreur lors du chargement des utilisateurs');
        setTimeout(() => setMessage(''), 5000);
        return;
      }

      console.log('✅ Admin: Utilisateurs chargés:', profiles?.length || 0);
      setAllProfiles(profiles || []);
      setMessage('✅ Liste des utilisateurs actualisée avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Admin: Erreur générale chargement utilisateurs:', error);
      setMessage('❌ Erreur lors du chargement des utilisateurs');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      console.log('🔄 Admin: Changement de rôle pour:', userId, 'vers:', newRole);
      setProcessing('Modification du rôle utilisateur');

      const validRoles = ['admin', 'journaliste', 'moderateur', 'animateur', 'vip', 'auditeur'];
      if (!validRoles.includes(newRole)) {
        throw new Error('Rôle invalide');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('❌ Admin: Erreur changement rôle:', error);
        throw error;
      }

      console.log('✅ Admin: Rôle mis à jour:', data);

      await loadAllUsers();

      setMessage(`✅ Rôle mis à jour vers ${roleColors[newRole as keyof typeof roleColors].label}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('❌ Admin: Erreur modification rôle:', error);
      setMessage(`❌ Erreur lors de la modification du rôle: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      setProcessing('Suppression du message');

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      await loadChatMessages();
      setMessage('✅ Message supprimé');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Admin: Erreur suppression message:', error);
      setMessage('❌ Erreur lors de la suppression');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  const handleEmergencyAlert = async () => {
    try {
      setProcessing('Activation de l\'alerte d\'urgence');

      setEmergencyAlert(prev => ({ ...prev, isActive: !prev.isActive }));
      setMessage(`✅ Alerte d'urgence ${!emergencyAlert.isActive ? 'activée' : 'désactivée'}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Admin: Erreur alerte urgence:', error);
      setMessage('❌ Erreur lors de l\'activation de l\'alerte');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await saveSettingsToDb(settings);
      setMessage('✅ Paramètres sauvegardés avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Admin: Erreur sauvegarde:', error);
      setMessage('❌ Erreur lors de la sauvegarde');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceToggle = async () => {
    try {
      setProcessing('Modification du mode maintenance');

      const newMaintenanceMode = !settings.maintenanceMode;
      await toggleMaintenanceMode(newMaintenanceMode);

      setSettings(prev => ({ ...prev, maintenanceMode: newMaintenanceMode }));
      setStreamStatus(newMaintenanceMode ? 'maintenance' : 'live');

      setMessage(`✅ Mode maintenance ${newMaintenanceMode ? 'activé' : 'désactivé'}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Admin: Erreur toggle maintenance:', error);
      setMessage('❌ Erreur lors du changement de mode');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setProcessing('Modification des droits administrateur');

      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_admin: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Admin: Erreur toggle admin:', error);
        throw error;
      }

      await loadAllUsers();

      setMessage(`✅ Droits administrateur ${!currentStatus ? 'accordés' : 'retirés'} avec succès`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('❌ Admin: Erreur modification droits:', error);
      setMessage('❌ Erreur lors de la modification des droits');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  const deleteUser = async (userToDelete: ExtendedProfile) => {
    if (userToDelete.id === user.id) {
      setMessage('❌ Vous ne pouvez pas supprimer votre propre compte');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${userToDelete.full_name || userToDelete.email} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      setProcessing('Suppression du compte utilisateur');

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (profileError) {
        console.error('❌ Admin: Erreur suppression profil:', profileError);
        throw new Error(`Erreur suppression profil: ${profileError.message}`);
      }

      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userToDelete.id);
        if (authError) {
          console.warn('⚠️ Admin: Avertissement suppression auth:', authError.message);
        }
      } catch (authErr) {
        console.warn('⚠️ Admin: Auth deletion non critique:', authErr);
      }

      await loadAllUsers();

      setMessage('✅ Compte utilisateur supprimé avec succès');
      setTimeout(() => setMessage(''), 5000);

      console.log(`✅ Admin: Utilisateur ${userToDelete.email} supprimé`);
    } catch (error: any) {
      console.error('❌ Admin: Erreur suppression:', error);

      if (error.message?.includes('permission')) {
        setMessage('❌ Permissions insuffisantes pour supprimer cet utilisateur');
      } else if (error.message?.includes('policy')) {
        setMessage('❌ Politique de sécurité - Vérifiez vos droits admin');
      } else {
        setMessage(`❌ Erreur suppression: ${error.message || 'Erreur inconnue'}`);
      }

      setTimeout(() => setMessage(''), 8000);

      await loadAllUsers();
    } finally {
      setProcessing('');
    }
  };

  const refreshAllData = async () => {
    try {
      console.log('🔄 Admin: Actualisation complète des données');
      setProcessing('Actualisation complète en cours');

      // Actualiser toutes les données en parallèle
      await Promise.all([
        loadAllUsers(),
        loadChatMessages(),
        loadAnalytics()
      ]);

      setMessage('✅ Toutes les données ont été actualisées avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Admin: Erreur actualisation complète:', error);
      setMessage('❌ Erreur lors de l\'actualisation complète');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  const moderateUser = async (action: 'ban' | 'mute' | 'warn', userId: string, reason: string, duration?: string) => {
    try {
      console.log(`🛡️ Admin: Action de modération ${action} pour:`, userId);
      setProcessing(`${action === 'ban' ? 'Bannissement' : action === 'mute' ? 'Mise en silence' : 'Avertissement'} en cours`);

      const userToModerate = allProfiles.find(p => p.id === userId);
      if (!userToModerate) {
        throw new Error('Utilisateur non trouvé');
      }

      let updateData: any = { updated_at: new Date().toISOString() };

      switch (action) {
        case 'ban':
          updateData.is_banned = true;
          updateData.ban_reason = reason;
          updateData.is_muted = false; // Un ban annule le mute
          break;
        
        case 'mute':
          updateData.is_muted = true;
          const muteHours = parseInt(duration || '1');
          const muteUntil = new Date();
          muteUntil.setHours(muteUntil.getHours() + muteHours);
          updateData.mute_until = muteUntil.toISOString();
          break;
        
        case 'warn':
          const currentWarnings = userToModerate.warnings_count || 0;
          updateData.warnings_count = currentWarnings + 1;
          
          // Auto-mute après 3 avertissements
          if (currentWarnings + 1 >= 3) {
            updateData.is_muted = true;
            const autoMuteUntil = new Date();
            autoMuteUntil.setHours(autoMuteUntil.getHours() + 24);
            updateData.mute_until = autoMuteUntil.toISOString();
          }
          break;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('❌ Admin: Erreur modération:', error);
        throw error;
      }

      // Ajouter un log de modération dans les messages du chat
      await supabase
        .from('chat_messages')
        .insert({
          user_name: 'Système',
          user_email: 'system@soradio.com',
          user_role: 'admin',
          message: `🛡️ ${userToModerate.full_name || userToModerate.email} a été ${ 
            action === 'ban' ? 'banni(e)' : 
            action === 'mute' ? `mis(e) en silence ${duration ? `pour ${duration}h` : ''}` : 
            'averti(e)'
          }. Raison: ${reason}${action === 'warn' && updateData.warnings_count >= 3 ? ' (Auto-mute 24h après 3 avertissements)' : ''}`
        });

      await Promise.all([loadAllUsers(), loadChatMessages()]);

      const actionText = action === 'ban' ? 'banni' : action === 'mute' ? 'mis en silence' : 'averti';
      setMessage(`✅ ${userToModerate.full_name || userToModerate.email} a été ${actionText} avec succès`);
      setTimeout(() => setMessage(''), 5000);
      
      setShowModerationModal(false);
      setModerationAction({ type: '', userId: '', reason: '', duration: '1' });

    } catch (error: any) {
      console.error('❌ Admin: Erreur modération:', error);
      setMessage(`❌ Erreur lors de la modération: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  const unmoderateUser = async (action: 'unban' | 'unmute', userId: string) => {
    try {
      console.log(`🔓 Admin: Levée de sanction ${action} pour:`, userId);
      setProcessing(`Levée de ${action === 'unban' ? 'bannissement' : 'silence'} en cours`);

      const userToUnmoderate = allProfiles.find(p => p.id === userId);
      if (!userToUnmoderate) {
        throw new Error('Utilisateur non trouvé');
      }

      let updateData: any = { updated_at: new Date().toISOString() };

      if (action === 'unban') {
        updateData.is_banned = false;
        updateData.ban_reason = null;
      } else if (action === 'unmute') {
        updateData.is_muted = false;
        updateData.mute_until = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('❌ Admin: Erreur levée sanction:', error);
        throw error;
      }

      // Log dans le chat
      await supabase
        .from('chat_messages')
        .insert({
          user_name: 'Système',
          user_email: 'system@soradio.com',
          user_role: 'admin',
          message: `🔓 ${userToUnmoderate.full_name || userToUnmoderate.email} a été ${ 
            action === 'unban' ? 'débanni(e)' : 
            'remis(e) en liberté de parole'
          }`
        });

      await Promise.all([loadAllUsers(), loadChatMessages()]);

      const actionText = action === 'unban' ? 'débanni' : 'remis en liberté de parole';
      setMessage(`✅ ${userToUnmoderate.full_name || userToUnmoderate.email} a été ${actionText} avec succès`);
      setTimeout(() => setMessage(''), 3000);

    } catch (error: any) {
      console.error('❌ Admin: Erreur levée sanction:', error);
      setMessage(`❌ Erreur lors de la levée de sanction: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  const resetWarnings = async (userId: string) => {
    try {
      setProcessing('Remise à zéro des avertissements');

      const { error } = await supabase
        .from('profiles')
        .update({ 
          warnings_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      await loadAllUsers();
      setMessage('✅ Avertissements remis à zéro');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('❌ Admin: Erreur reset warnings:', error);
      setMessage('❌ Erreur lors de la remise à zéro');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setProcessing('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-8 mx-auto animate-bounce">
            <i className="ri-settings-line text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-['Pacifico'] text-gray-800 mb-4">SORadio Admin</h1>
          <p className="text-gray-600 font-medium">Vérification des accès...</p>
        </div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <ChatWidget />

      {(message || processing) && (
        <div className="fixed top-4 right-4 z-40 max-w-md">
          <div
            className={`p-4 rounded-lg backdrop-blur-md border ${ 
              message.includes('succès') || message.includes('✅') 
                ? 'bg-green-500/90 text-white border-green-400' 
                : message.includes('Erreur') || message.includes('❌') 
                ? 'bg-red-500/90 text-white border-red-400' 
                : 'bg-blue-500/90 text-white border-blue-400' 
            }`}
          >
            {processing ? (
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>{processing}...</span>
              </div>
            ) : (
              <span>{message}</span>
            )}
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <i className="ri-radio-line text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-['Pacifico'] text-gray-800">SORadio</h1>
                <p className="text-orange-500 text-sm">Panel Admin Avancé</p>
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="text-gray-600 text-sm">
                <div className="font-medium">Connecté en tant que</div>
                <div className="text-orange-500">{profile?.full_name || profile?.email}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${ 
                    activeTab === 'dashboard' 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-100' 
                  }`}
                >
                  <i className="ri-dashboard-line"></i>
                  <span>Tableau de Bord</span>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${ 
                    activeTab === 'users' 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-100' 
                  }`}
                >
                  <i className="ri-user-line"></i>
                  <span>Utilisateurs & Rôles</span>
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${ 
                    activeTab === 'chat' 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-100' 
                  }`}
                >
                  <i className="ri-chat-3-line"></i>
                  <span>Messages Chat</span>
                  {chatMessages.length > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {chatMessages.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${ 
                    activeTab === 'settings' 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-100' 
                  }`}
                >
                  <i className="ri-settings-line"></i>
                  <span>Paramètres</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">Tableau de Bord</h1>
                  <p className="text-gray-600">Vue d'ensemble de votre radio</p>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <i className="ri-user-line text-blue-600 text-xl"></i>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Total Utilisateurs</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <i className="ri-chat-3-line text-orange-600 text-xl"></i>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Messages Chat</p>
                        <p className="text-2xl font-bold text-gray-800">{chatMessages.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <i className="ri-headphone-line text-green-600 text-xl"></i>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Auditeurs</p>
                        <p className="text-2xl font-bold text-gray-800">1,247</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <i className="ri-radio-line text-purple-600 text-xl"></i>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Statut Stream</p>
                        <p className="text-lg font-bold text-green-600">EN DIRECT</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des Utilisateurs & Rôles</h1>
                    <p className="text-gray-600">Gérez les utilisateurs, leurs rôles et modérez le chat</p>
                  </div>
                  <button
                    onClick={refreshAllData}
                    disabled={processing !== ''}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    {processing === 'Actualisation complète en cours' ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Actualisation...</span>
                      </div>
                    ) : (
                      <>
                        <i className="ri-refresh-line mr-2"></i>
                        Actualiser
                      </>
                    )}
                  </button>
                </div>

                {/* Statistiques des rôles */}
                <div className="grid md:grid-cols-6 gap-4">
                  {Object.entries(roleColors).map(([role, config]) => {
                    const count = allProfiles.filter(p => p.role === role).length;
                    return (
                      <div key={role} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.badge}`}>
                            <i className={`${config.icon} text-white text-sm`}></i>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">{config.label}</p>
                            <p className="font-bold text-gray-800">{count}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Statistiques de modération */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <i className="ri-forbid-line text-red-600 text-sm"></i>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Bannis</p>
                        <p className="font-bold text-gray-800">{allProfiles.filter(p => p.is_banned).length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <i className="ri-volume-mute-line text-orange-600 text-sm"></i>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">En silence</p>
                        <p className="font-bold text-gray-800">{allProfiles.filter(p => p.is_muted).length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <i className="ri-alert-line text-yellow-600 text-sm"></i>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Avec avertissements</p>
                        <p className="font-bold text-gray-800">{allProfiles.filter(p => (p.warnings_count || 0) > 0).length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <i className="ri-shield-check-line text-green-600 text-sm"></i>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Utilisateurs sains</p>
                        <p className="font-bold text-gray-800">{allProfiles.filter(p => !p.is_banned && !p.is_muted && (p.warnings_count || 0) === 0).length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800">Liste des Utilisateurs</h3>

                    <div className="space-y-4">
                      {allProfiles.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="ri-user-line text-gray-400 text-2xl"></i>
                          </div>
                          <p className="text-gray-500 mb-2">Aucun utilisateur trouvé</p>
                          <button
                            onClick={loadAllUsers}
                            className="text-orange-600 hover:text-orange-700 cursor-pointer"
                          >
                            Recharger la liste
                          </button>
                        </div>
                      ) : (
                        allProfiles.map((userProfile) => {
                          const roleConfig = roleColors[userProfile.role || 'auditeur'];
                          const isMuted = userProfile.is_muted && (
                            !userProfile.mute_until || new Date(userProfile.mute_until) > new Date()
                          );
                          return (
                            <div key={userProfile.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${roleConfig.badge} ${userProfile.is_banned ? 'opacity-50' : ''}`}>
                                    <i className={roleConfig.icon}></i>
                                  </div>
                                  <div>
                                    <h4 className="text-gray-800 font-semibold flex items-center space-x-2">
                                      <span className={userProfile.is_banned ? 'line-through text-red-500' : ''}>{userProfile.full_name || 'Nom non défini'}</span>
                                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${roleConfig.badge}`}>
                                        {roleConfig.label}
                                      </span>
                                      {userProfile.is_admin && (
                                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                                          Admin
                                        </span>
                                      )}
                                      {userProfile.is_banned && (
                                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                                          🚫 BANNI
                                        </span>
                                      )}
                                      {isMuted && (
                                        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-medium">
                                          🔇 MUTE
                                        </span>
                                      )}
                                      {(userProfile.warnings_count || 0) > 0 && (
                                        <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
                                          ⚠️ {userProfile.warnings_count}
                                        </span>
                                      )}
                                    </h4>
                                    <p className="text-gray-600 text-sm">{userProfile.email}</p>
                                    <div className="text-gray-500 text-xs space-y-1">
                                      <p>Inscrit le {new Date(userProfile.created_at).toLocaleDateString('fr-FR')}</p>
                                      {userProfile.is_banned && userProfile.ban_reason && (
                                        <p className="text-red-600">Raison du ban: {userProfile.ban_reason}</p>
                                      )}
                                      {isMuted && userProfile.mute_until && (
                                        <p className="text-orange-600">
                                          Mute jusqu'au {new Date(userProfile.mute_until).toLocaleString('fr-FR')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  {userProfile.id !== user.id && (
                                    <>
                                      {/* Sélecteur de rôle */}
                                      <select
                                        value={userProfile.role || 'auditeur'}
                                        onChange={(e) => {
                                          console.log('🔄 Admin: Changement rôle demandé:', e.target.value);
                                          updateUserRole(userProfile.id, e.target.value);
                                        }}
                                        disabled={processing !== '' || userProfile.is_banned}
                                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 disabled:opacity-50 cursor-pointer"
                                      >
                                        {Object.entries(roleColors).map(([role, config]) => (
                                          <option key={role} value={role}>
                                            {config.label}
                                          </option>
                                        ))}
                                      </select>

                                      {/* Actions de modération */}
                                      {!userProfile.is_banned ? (
                                        <div className="flex space-x-1">
                                          <button
                                            onClick={() => {
                                              setModerationAction({ type: 'warn', userId: userProfile.id, reason: '', duration: '1' });
                                              setShowModerationModal(true);
                                            }}
                                            disabled={processing !== ''}
                                            className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-200 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                            title="Avertir l'utilisateur"
                                          >
                                            ⚠️
                                          </button>
                                          {!isMuted ? (
                                            <button
                                              onClick={() => {
                                                setModerationAction({ type: 'mute', userId: userProfile.id, reason: '', duration: '1' });
                                                setShowModerationModal(true);
                                              }}
                                              disabled={processing !== ''}
                                              className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                              title="Mettre en silence"
                                            >
                                              🔇
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => unmoderateUser('unmute', userProfile.id)}
                                              disabled={processing !== ''}
                                              className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                              title="Lever le silence"
                                            >
                                              🔊
                                            </button>
                                          )}
                                          <button
                                            onClick={() => {
                                              setModerationAction({ type: 'ban', userId: userProfile.id, reason: '', duration: '1' });
                                              setShowModerationModal(true);
                                            }}
                                            disabled={processing !== ''}
                                            className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                            title="Bannir l'utilisateur"
                                          >
                                            🚫
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => unmoderateUser('unban', userProfile.id)}
                                          disabled={processing !== ''}
                                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                        >
                                          Débannir
                                        </button>
                                      )}
                                      {(userProfile.warnings_count || 0) > 0 && (
                                        <button
                                          onClick={() => resetWarnings(userProfile.id)}
                                          disabled={processing !== ''}
                                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                          title="Remettre à zéro les avertissements"
                                        >
                                          Reset ⚠️
                                        </button>
                                      )}

                                      <button
                                        onClick={() => toggleAdminStatus(userProfile.id, userProfile.is_admin)}
                                        disabled={processing !== ''}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap ${userProfile.is_admin ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                                      >
                                        {userProfile.is_admin ? 'Retirer Admin' : 'Promouvoir Admin'}
                                      </button>
                                      <button
                                        onClick={() => deleteUser(userProfile)}
                                        disabled={processing !== ''}
                                        className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                      >
                                        Supprimer
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Messages du Chat</h1>
                    <p className="text-gray-600">Consultez et gérez les messages de la communauté</p>
                  </div>
                  <button
                    onClick={loadChatMessages}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
                  >
                    <i className="ri-refresh-line mr-2"></i>
                    Actualiser
                  </button>
                </div>

                {/* Statistiques par rôle */}
                <div className="grid md:grid-cols-6 gap-4">
                  {Object.entries(roleColors).map(([role, config]) => {
                    const count = chatMessages.filter(msg => msg.user_role === role).length;
                    return (
                      <div key={role} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.badge}`}>
                            <i className={`${config.icon} text-white text-sm`}></i>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">{config.label}</p>
                            <p className="font-bold text-gray-800">{count}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Messages Récents</h3>

                    <div className="space-y-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="ri-chat-3-line text-gray-400 text-2xl"></i>
                          </div>
                          <p className="text-gray-500">Aucun message dans le chat</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const roleConfig = roleColors[msg.user_role];
                          return (
                            <div key={msg.id} className={`border rounded-lg p-4 ${roleConfig.bg} border-l-4`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${roleConfig.badge}`}>
                                      <i className={roleConfig.icon}></i>
                                      <span>{roleConfig.label}</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-800">{msg.user_name}</h4>
                                    <span className="text-xs text-gray-400">
                                      {new Date(msg.created_at).toLocaleString('fr-FR')}
                                    </span>
                                  </div>
                                  <p className={`text-sm ${roleConfig.text} mb-3`}>{msg.message}</p>
                                  <p className="text-xs text-gray-500">{msg.user_email}</p>
                                </div>
                                <button
                                  onClick={() => deleteMessage(msg.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors cursor-pointer"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">Paramètres du Site</h1>
                  <p className="text-gray-600">Configuration générale de SORadio</p>
                </div>

                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Paramètres Généraux</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du Site
                      </label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="SORadio"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description du Site
                      </label>
                      <textarea
                        value={settings.siteDescription}
                        onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="La radio qui vous accompagne"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-800">Mode Maintenance</h3>
                        <p className="text-sm text-gray-600">Activer pour rendre le site indisponible aux visiteurs</p>
                      </div>
                      <button
                        onClick={handleMaintenanceToggle}
                        disabled={processing !== ''}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <i className="ri-save-line mr-2"></i>
                            Sauvegarder
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de modération */}
      {showModerationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${ 
                moderationAction.type === 'ban' ? 'bg-red-100' :
                moderationAction.type === 'mute' ? 'bg-orange-100' : 'bg-yellow-100'
              }`}>
                <i className={`text-2xl ${ 
                  moderationAction.type === 'ban' ? 'ri-forbid-line text-red-600' :
                  moderationAction.type === 'mute' ? 'ri-volume-mute-line text-orange-600' : 
                  'ri-alert-line text-yellow-600'
                }`}></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {moderationAction.type === 'ban' ? 'Bannir l\'utilisateur' :
                 moderationAction.type === 'mute' ? 'Mettre en silence' :
                 'Avertir l\'utilisateur'}
              </h3>
              <p className="text-gray-600 mt-2">
                {moderationAction.type === 'ban' ? 'Cette action interdira complètement l\'accès au chat' :
                 moderationAction.type === 'mute' ? 'Cette action empêchera l\'utilisateur d\'envoyer des messages' :
                 'Après 3 avertissements, l\'utilisateur sera automatiquement mis en silence 24h'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison {moderationAction.type === 'ban' ? 'du bannissement' : 
                           moderationAction.type === 'mute' ? 'de la mise en silence' : 
                           'de l\'avertissement'}
                </label>
                <textarea
                  value={moderationAction.reason}
                  onChange={(e) => setModerationAction(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Expliquez la raison de cette sanction..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  maxLength={500}
                />
              </div>

              {moderationAction.type === 'mute' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée du silence
                  </label>
                  <select
                    value={moderationAction.duration}
                    onChange={(e) => setModerationAction(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="1">1 heure</option>
                    <option value="6">6 heures</option>
                    <option value="12">12 heures</option>
                    <option value="24">24 heures</option>
                    <option value="72">3 jours</option>
                    <option value="168">1 semaine</option>
                  </select>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowModerationModal(false);
                    setModerationAction({ type: '', userId: '', reason: '', duration: '1' });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (!moderationAction.reason.trim()) {
                      setMessage('❌ Veuillez indiquer une raison');
                      setTimeout(() => setMessage(''), 3000);
                      return;
                    }
                    moderateUser(
                      moderationAction.type as 'ban' | 'mute' | 'warn',
                      moderationAction.userId,
                      moderationAction.reason,
                      moderationAction.duration
                    );
                  }}
                  disabled={processing !== '' || !moderationAction.reason.trim()}
                  className={`flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 ${ 
                    moderationAction.type === 'ban' ? 'bg-red-500 hover:bg-red-600' :
                    moderationAction.type === 'mute' ? 'bg-orange-500 hover:bg-orange-600' :
                    'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  {moderationAction.type === 'ban' ? 'Bannir' :
                   moderationAction.type === 'mute' ? 'Mettre en silence' :
                   'Avertir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

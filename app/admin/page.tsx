
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getSettings, saveSettings, toggleMaintenanceMode, type SiteSettings } from '@/lib/settings';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  banned_until?: string;
  ban_reason?: string;
  is_banned?: boolean;
}

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  message: string;
  created_at: string;
  user_role: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

export default function AdminPanel() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    totalMessages: 0,
    activeUsers: 0,
    bannedUsers: 0,
    messagesPerRole: {} as Record<string, number>
  });

  // User management states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banDuration, setBanDuration] = useState('1h');
  const [banReason, setBanReason] = useState('');
  const [isPermanentBan, setIsPermanentBan] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'warning' | 'error'>('info');
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Chat moderation states
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showChatActions, setShowChatActions] = useState(false);
  const [muteDuration, setMuteDuration] = useState('30m');
  const [warningMessage, setWarningMessage] = useState('');
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const [clearChatLoading, setClearChatLoading] = useState(false);

  // État pour gérer les mises à jour de rôles
  const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(null);
  const [banUserLoading, setBanUserLoading] = useState(false);

  // États pour fermeture temporaire du chat
  const [chatClosed, setChatClosed] = useState(false);
  const [chatCloseReason, setChatCloseReason] = useState('');
  const [chatCloseUntil, setChatCloseUntil] = useState('');
  const [showCloseChatModal, setShowCloseChatModal] = useState(false);
  const [closeChatLoading, setCloseChatLoading] = useState(false);

  // États pour gestion des clés beta
  const [betaKeys, setBetaKeys] = useState<any[]>([]);
  const [showCreateBetaKeyModal, setShowCreateBetaKeyModal] = useState(false);
  const [betaKeyDescription, setBetaKeyDescription] = useState('');
  const [betaKeyExpiry, setBetaKeyExpiry] = useState('24h');
  const [createBetaKeyLoading, setCreateBetaKeyLoading] = useState(false);
  const [showDeleteBetaKeyModal, setShowDeleteBetaKeyModal] = useState(false);
  const [selectedBetaKey, setSelectedBetaKey] = useState<any>(null);

  // États pour suppression d'utilisateur
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [selectedUserForDeletion, setSelectedUserForDeletion] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const timeout = setTimeout(() => {
      console.error('Timeout de vérification admin');
      setLoading(false);
      window.location.href = '/';
    }, 10000);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Erreur session:', sessionError);
        clearTimeout(timeout);
        window.location.href = '/';
        return;
      }

      if (!session?.user) {
        console.log('Pas de session utilisateur');
        clearTimeout(timeout);
        window.location.href = '/';
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        console.error('Pas d\'accès admin:', profileError);
        clearTimeout(timeout);
        window.location.href = '/';
        return;
      }

      clearTimeout(timeout);
      setUser(session.user);
      await loadInitialData();
    } catch (error) {
      console.error('Erreur vérification accès:', error);
      clearTimeout(timeout);
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadSettings(),
        loadAllUsers(),
        loadChatMessages(),
        loadStats(),
        loadBetaKeys()
      ]);
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);

      // Charger l'état de fermeture du chat
      const { data: chatSettings, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('category', 'chat')
        .in('key', ['chatClosed', 'chatCloseReason', 'chatCloseUntil']);

      if (!error && chatSettings) {
        chatSettings.forEach((setting) => {
          if (setting.key === 'chatClosed') {
            setChatClosed(setting.value === 'true');
          } else if (setting.key === 'chatCloseReason') {
            setChatCloseReason(setting.value || '');
          } else if (setting.key === 'chatCloseUntil') {
            setChatCloseUntil(setting.value || '');
          }
        });
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement utilisateurs:', error);
        return;
      }

      const usersWithBanStatus = data.map(user => ({ ...user, is_banned: user.banned_until ? new Date(user.banned_until) > new Date() : false }));

      setAllUsers(usersWithBanStatus);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const loadChatMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          user_name,
          user_email,
          user_role,
          message,
          created_at,
          profiles!inner (
            id,
            full_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Erreur chargement messages:', error);
        return;
      }

      console.log('Messages chargés avec profils:', data);
      setChatMessages(data || []);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: users } = await supabase
        .from('profiles')
        .select('*');

      const { data: messages } = await supabase
        .from('chat_messages')
        .select('user_role, created_at');

      const totalUsers = users?.length || 0;
      const newUsersToday = users?.filter(u => u.created_at.startsWith(today)).length || 0;

      const bannedUsers = users?.filter(u => u.banned_until && new Date(u.banned_until) > new Date()).length || 0;

      const totalMessages = messages?.length || 0;
      const messagesPerRole = messages?.reduce((acc, msg) => {
        acc[msg.user_role] = (acc[msg.user_role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setStatsData({
        totalUsers,
        newUsersToday,
        totalMessages,
        activeUsers: Math.floor(totalUsers * 0.15),
        bannedUsers,
        messagesPerRole
      });
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const loadBetaKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('beta_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement clés beta:', error);
        return;
      }

      setBetaKeys(data || []);
    } catch (error) {
      console.error('Erreur chargement clés beta:', error);
    }
  };

  const saveSettingsData = async () => {
    if (!settings) return;

    setSettingsLoading(true);
    try {
      const success = await saveSettings(settings);
      if (success) {
        alert('Paramètres sauvegardés avec succès !');
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleMaintenanceToggle = async () => {
    if (!settings) return;

    const newStatus = !settings.system.maintenanceMode;

    try {
      const success = await toggleMaintenanceMode(
        newStatus,
        settings.system.maintenanceReason,
        settings.system.maintenanceEndTime
      );

      if (success) {
        setSettings({
          ...settings,
          system: {
            ...settings.system,
            maintenanceMode: newStatus
          }
        });
        alert(`Mode maintenance ${newStatus ? 'activé' : 'désactivé'}`);
      }
    } catch (error) {
      console.error('Erreur toggle maintenance:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (roleUpdateLoading === userId) return;

    console.log(`🔄 Début mise à jour rôle: ${userId} -> ${newRole}`);
    setRoleUpdateLoading(userId);

    try {
      const isAdmin = newRole === 'admin';

      // 1. Vérifier d'abord que l'utilisateur existe
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id, role, is_admin, email, full_name')
        .eq('id', userId)
        .single();

      if (checkError || !existingUser) {
        throw new Error('Utilisateur non trouvé dans la base de données');
      }

      console.log(`👤 Utilisateur trouvé: ${existingUser.email}, rôle actuel: ${existingUser.role}`);

      // 2. Effectuer la mise à jour avec retry
      let updateAttempts = 0;
      let updateSuccess = false;
      let updateResult = null;

      while (updateAttempts < 3 && !updateSuccess) {
        updateAttempts++;
        console.log(`📝 Tentative de mise à jour ${updateAttempts}/3`);

        const { data, error } = await supabase
          .from('profiles')
          .update({
            role: newRole,
            is_admin: isAdmin,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select('*')
          .single();

        if (error) {
          console.error(`❌ Erreur tentative ${updateAttempts}:`, error);
          if (updateAttempts === 3) {
            throw error;
          }
          // Attendre 1 seconde avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          updateResult = data;
          updateSuccess = true;
          console.log(`✅ Mise à jour réussie à la tentative ${updateAttempts}`);
        }
      }

      if (!updateSuccess || !updateResult) {
        throw new Error('Échec de toutes les tentatives de mise à jour');
      }

      // 3. Vérification immédiate
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('id, role, is_admin, updated_at')
        .eq('id', userId)
        .single();

      if (verifyError) {
        console.warn(`⚠️ Erreur vérification (mais mise à jour peut avoir réussi):`, verifyError);
      } else {
        console.log(`🔍 Vérification: rôle=${verifyData.role}, admin=${verifyData.is_admin}`);
      }

      // 4. Mise à jour immédiate de l'état local
      setAllUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user =>
          user.id === userId
            ? {
                ...user,
                role: newRole,
                is_admin: isAdmin,
                updated_at: new Date().toISOString()
              }
            : user
        );
        return updatedUsers;
      });

      // 5. Rechargement différé pour confirmation
      setTimeout(async () => {
        await loadAllUsers();
        console.log('🔄 Rechargement des utilisateurs terminé');
      }, 2000);

      // Message de succès
      const roleNames = {
        'auditeur': 'Auditeur',
        'moderateur': 'Modérateur',
        'journaliste': 'Journaliste',
        'animateur': 'Animateur',
        'vip': 'VIP',
        'admin': 'Administrateur'
      };

      alert(`✅ Rôle mis à jour avec succès !\n\nUtilisateur: ${existingUser.full_name || existingUser.email}\nNouveau rôle: ${roleNames[newRole as keyof typeof roleNames] || newRole}`);
    } catch (error: any) {
      console.error('💥 ERREUR mise à jour rôle:', error);

      let errorMessage = 'Erreur lors de la mise à jour du rôle';

      if (error.message?.includes('permission denied') || error.code === 'PGRST301') {
        errorMessage = 'Permissions insuffisantes - Vérifiez vos droits d\'administrateur';
      } else if (error.message?.includes('row level security') || error.code === 'PGRST401') {
        errorMessage = 'Règles de sécurité RLS - Contactez le développeur';
      } else if (error.message?.includes('not found') || error.code === 'PGRST106') {
        errorMessage = 'Utilisateur non trouvé';
      } else if (error.message?.includes('unique constraint')) {
        errorMessage = 'Conflit de données - Réessayez';
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }

      alert(`❌ ${errorMessage}\n\nCode erreur: ${error.code || 'inconnu'}\nVeuillez réessayer ou contacter le support.`);
    } finally {
      setRoleUpdateLoading(null);
    }
  };

  const banUser = async () => {
    if (!selectedUser || banUserLoading) return;

    console.log(`🚫 Début bannissement: ${selectedUser.email}`);
    setBanUserLoading(true);

    try {
      let banUntil = null;

      // Calculer la date de fin de bannissement
      if (!isPermanentBan) {
        const now = new Date();
        const duration = banDuration;

        if (duration.endsWith('h')) {
          const hours = parseInt(duration);
          banUntil = new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
        } else if (duration.endsWith('d')) {
          const days = parseInt(duration);
          banUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
        } else if (duration === '1w') {
          banUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (duration === '1m') {
          banUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      console.log(`📅 Date bannissement: ${banUntil ? new Date(banUntil).toLocaleString('fr-FR') : 'Permanent'}`);

      // Vérifier d'abord que l'utilisateur existe
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', selectedUser.id)
        .single();

      if (checkError || !existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Effectuer le bannissement avec retry
      let banAttempts = 0;
      let banSuccess = false;
      let banResult = null;

      while (banAttempts < 3 && !banSuccess) {
        banAttempts++;
        console.log(`📝 Tentative bannissement ${banAttempts}/3`);

        const { data, error } = await supabase
          .from('profiles')
          .update({
            banned_until: banUntil,
            ban_reason: banReason.trim() || 'Aucune raison spécifiée',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedUser.id)
          .select('*')
          .single();

        if (error) {
          console.error(`❌ Erreur tentative ${banAttempts}:`, error);
          if (banAttempts === 3) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          banResult = data;
          banSuccess = true;
          console.log(`✅ Bannissement réussi à la tentative ${banAttempts}`);
        }
      }

      if (!banSuccess || !banResult) {
        throw new Error('Échec de toutes les tentatives de bannissement');
      }

      // Fermer le modal et réinitialiser
      setShowBanModal(false);
      setBanReason('');
      setIsPermanentBan(false);
      setSelectedUser(null);

      // Recharger les données
      await Promise.all([
        loadAllUsers(),
        loadStats()
      ]);

      // Message de confirmation
      const banMessage = isPermanentBan
        ? 'Utilisateur banni définitivement !'
        : `Utilisateur banni jusqu'au ${new Date(banUntil!).toLocaleString('fr-FR')} !`;

      alert(`✅ ${banMessage}\n\nUtilisateur: ${selectedUser.full_name || selectedUser.email}\nRaison: ${banReason.trim() || 'Aucune raison spécifiée'}`);
    } catch (error: any) {
      console.error('💥 Erreur complète bannissement:', error);

      let errorMessage = 'Erreur lors du bannissement';

      if (error.message?.includes('permission denied') || error.code === 'PGRST301') {
        errorMessage = 'Permissions insuffisantes pour bannir cet utilisateur';
      } else if (error.message?.includes('row level security') || error.code === 'PGRST401') {
        errorMessage = 'Règles de sécurité RLS empêchent le bannissement';
      } else if (error.message?.includes('not found') || error.code === 'PGRST106') {
        errorMessage = 'Utilisateur non trouvé';
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }

      alert(`❌ ${errorMessage}\n\nCode erreur: ${error.code || 'inconnu'}\nVeuillez vérifier vos permissions ou contacter le support.`);
    } finally {
      setBanUserLoading(false);
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      console.log(`🔓 Débannissement: ${userId}`);

      // Vérifier que l'utilisateur existe
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id, email, full_name, banned_until')
        .eq('id', userId)
        .single();

      if (checkError || !existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      if (!existingUser.banned_until) {
        alert('⚠️ Cet utilisateur n\'est pas banni');
        return;
      }

      // Effectuer le débannissement
      const { data: updateResult, error } = await supabase
        .from('profiles')
        .update({
          banned_until: null,
          ban_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Débannissement réussi');

      // Recharger les données
      await Promise.all([
        loadAllUsers(),
        loadStats()
      ]);

      alert(`✅ Utilisateur débanni avec succès !\n\nUtilisateur: ${existingUser.full_name || existingUser.email}\nL\'utilisateur peut maintenant se reconnecter normalement.`);
    } catch (error: any) {
      console.error('💥 Erreur débannissement:', error);

      let errorMessage = 'Erreur lors du débannissement';

      if (error.message?.includes('permission denied') || error.code === 'PGRST301') {
        errorMessage = 'Permissions insuffisantes pour débannir cet utilisateur';
      } else if (error.message?.includes('row level security') || error.code === 'PGRST401') {
        errorMessage = 'Règles de sécurité empêchent le débannissement';
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }

      alert(`❌ ${errorMessage}\n\nCode erreur: ${error.code || 'inconnu'}\nVeuillez vérifier vos permissions.`);
    }
  };

  const clearAllMessages = async () => {
    setClearChatLoading(true);
    try {
      console.log('🧹 Début de la suppression de tous les messages...');

      // Méthode plus robuste : supprimer tous les messages existants
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .gt('created_at', '1900-01-01T00:00:00.000Z'); // Supprimer tous les messages créés après 1900

      if (error) {
        console.error('❌ Erreur suppression messages:', error);

        // Messages d'erreur détaillés
        let errorMessage = 'Erreur lors de la suppression des messages';

        if (error.message?.includes('permission denied')) {
          errorMessage = 'Permissions insuffisantes pour supprimer les messages';
        } else if (error.message?.includes('row level security')) {
          errorMessage = 'Règles de sécurité empêchent la suppression';
        } else if (error.message) {
          errorMessage = `Erreur: ${error.message}`;
        }

        alert(`❌ ${errorMessage}\n\nVeuillez vérifier vos permissions ou contacter le support.`);
        return;
      }

      console.log('✅ Tous les messages ont été supprimés');

      // Recharger les messages et statistiques
      await Promise.all([
        loadChatMessages(),
        loadStats()
      ]);

      setShowClearChatModal(false);
      alert('✅ Tous les messages ont été supprimés avec succès !');
    } catch (error: any) {
      console.error('💥 Erreur complète suppression messages:', error);

      let errorMessage = 'Erreur lors de la suppression des messages';

      if (error.message?.includes('permission denied')) {
        errorMessage = 'Permissions insuffisantes pour cette opération';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Problème de connexion réseau';
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }

      alert(`💥 ${errorMessage}\n\nVeuillez réessayer ou contacter le support technique.`);

      // Recharger les données pour restaurer l'état correct
      await loadChatMessages();
    } finally {
      setClearChatLoading(false);
    }
  };

  const closeChatTemporarily = async () => {
    setCloseChatLoading(true);
    try {
      const updates = [
        {
          category: 'chat',
          key: 'chatClosed',
          value: 'true',
          updated_at: new Date().toISOString()
        },
        {
          category: 'chat',
          key: 'chatCloseReason',
          value: chatCloseReason,
          updated_at: new Date().toISOString()
        }
      ];

      if (chatCloseUntil) {
        updates.push({
          category: 'chat',
          key: 'chatCloseUntil',
          value: chatCloseUntil,
          updated_at: new Date().toISOString()
        });
      }

      const { error } = await supabase
        .from('site_settings')
        .upsert(updates, {
          onConflict: 'category,key',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Erreur fermeture chat:', error);
        alert('Erreur lors de la fermeture du chat');
        return;
      }

      setChatClosed(true);
      setShowCloseChatModal(false);
      alert('Chat fermé temporairement avec succès !');
    } catch (error) {
      console.error('Erreur fermeture chat:', error);
      alert('Erreur lors de la fermeture du chat');
    } finally {
      setCloseChatLoading(false);
    }
  };

  const reopenChat = async () => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert([
          {
            category: 'chat',
            key: 'chatClosed',
            value: 'false',
            updated_at: new Date().toISOString()
          },
          {
            category: 'chat',
            key: 'chatCloseReason',
            value: '',
            updated_at: new Date().toISOString()
          },
          {
            category: 'chat',
            key: 'chatCloseUntil',
            value: '',
            updated_at: new Date().toISOString()
          }
        ], {
          onConflict: 'category,key',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Erreur réouverture chat:', error);
        alert('Erreur lors de la réouverture du chat');
        return;
      }

      setChatClosed(false);
      setChatCloseReason('');
      setChatCloseUntil('');
      alert('Chat rouvert avec succès !');
    } catch (error) {
      console.error('Erreur réouverture chat:', error);
      alert('Erreur lors de la réouverture du chat');
    }
  };

  const generateBetaKey = () => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    const part1 = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `SORADIO-BETA-${part1}-${part2}`;
  };

  const createBetaKey = async () => {
    if (!betaKeyDescription.trim()) {
      alert('Veuillez saisir une description');
      return;
    }

    setCreateBetaKeyLoading(true);
    try {
      const keyCode = generateBetaKey();
      let expiresAt = new Date();

      // Calculer la date d'expiration
      switch (betaKeyExpiry) {
        case '1h':
          expiresAt.setHours(expiresAt.getHours() + 1);
          break;
        case '24h':
          expiresAt.setHours(expiresAt.getHours() + 24);
          break;
        case '7d':
          expiresAt.setDate(expiresAt.getDate() + 7);
          break;
        case '30d':
          expiresAt.setDate(expiresAt.getDate() + 30);
          break;
        default:
          expiresAt.setHours(expiresAt.getHours() + 24);
      }

      const { data, error } = await supabase
        .from('beta_keys')
        .insert({
          key_code: keyCode,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          usage_count: 0,
          max_usage: 1, // Une seule utilisation
          description: betaKeyDescription.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur création clé beta:', error);
        alert('Erreur lors de la création de la clé beta');
        return;
      }

      // Recharger les clés
      await loadBetaKeys();

      // Fermer le modal et réinitialiser
      setShowCreateBetaKeyModal(false);
      setBetaKeyDescription('');
      setBetaKeyExpiry('24h');

      // Afficher la clé créée
      alert(`Clé beta créée avec succès !\n\nClé : ${keyCode}\n\nCette clé ne peut être utilisée qu'une seule fois et expire le ${expiresAt.toLocaleString('fr-FR')}`);
    } catch (error) {
      console.error('Erreur création clé beta:', error);
      alert('Erreur lors de la création de la clé beta');
    } finally {
      setCreateBetaKeyLoading(false);
    }
  };

  const deleteBetaKey = async () => {
    if (!selectedBetaKey) return;

    try {
      console.log(' Suppression de la clé beta:', selectedBetaKey.id);

      const { error } = await supabase
        .from('beta_keys')
        .delete()
        .eq('id', selectedBetaKey.id);

      if (error) {
        console.error(' Erreur suppression clé beta:', error);

        // Messages d'erreur plus détaillés
        let errorMessage = 'Erreur lors de la suppression de la clé beta';

        if (error.message?.includes('permission denied')) {
          errorMessage = 'Permissions insuffisantes pour supprimer cette clé';
        } else if (error.message?.includes('row level security')) {
          errorMessage = 'Règles de sécurité empêchent la suppression';
        } else if (error.message?.includes('not found')) {
          errorMessage = 'Clé beta non trouvée';
        } else if (error.message) {
          errorMessage = `Erreur: ${error.message}`;
        }

        alert(` ${errorMessage}\n\nVeuillez réessayer ou contacter le support technique.`);
        return;
      }

      console.log(' Clé beta supprimée avec succès');

      // Recharger les clés
      await loadBetaKeys();

      // Fermer le modal
      setShowDeleteBetaKeyModal(false);
      setSelectedBetaKey(null);

      alert(` Clé beta supprimée avec succès !\n\nClé : ${selectedBetaKey.key_code}`);
    } catch (error: any) {
      console.error(' Erreur complète suppression clé beta:', error);

      let errorMessage = 'Erreur lors de la suppression de la clé beta';

      if (error.message?.includes('permission denied')) {
        errorMessage = 'Permissions insuffisantes pour supprimer cette clé';
      } else if (error.message?.includes('referenced')) {
        errorMessage = 'Impossible de supprimer : la clé est encore référencée';
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }

      alert(` ${errorMessage}\n\nVeuillez réessayer ou contacter le support technique.`);

      // Recharger les données pour restaurer l'état correct
      await loadBetaKeys();
    }
  };

  const toggleBetaKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      console.log(' Modification statut clé beta:', keyId, !currentStatus);

      const { error } = await supabase
        .from('beta_keys')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId);

      if (error) {
        console.error(' Erreur modification statut clé beta:', error);

        let errorMessage = 'Erreur lors de la modification du statut';

        if (error.message?.includes('permission denied')) {
          errorMessage = 'Permissions insuffisantes pour modifier cette clé';
        } else if (error.message?.includes('row level security')) {
          errorMessage = 'Règles de sécurité empêchent la modification';
        } else if (error.message) {
          errorMessage = `Erreur: ${error.message}`;
        }

        alert(` ${errorMessage}\n\nVeuillez réessayer ou contacter le support technique.`);
        return;
      }

      console.log(' Statut clé beta modifié avec succès');

      await loadBetaKeys();
      alert(` Clé beta ${!currentStatus ? 'activée' : 'désactivée'} avec succès !`);
    } catch (error: any) {
      console.error(' Erreur modification statut clé beta:', error);

      let errorMessage = 'Erreur lors de la modification du statut';

      if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }

      alert(` ${errorMessage}\n\nVeuillez réessayer ou contacter le support technique.`);

      // Recharger les données pour restaurer l'état correct
      await loadBetaKeys();
    }
  };

  const deleteUser = async () => {
    if (!selectedUserForDeletion) return;

    setDeleteUserLoading(true);
    try {
      // 1. Supprimer d'abord tous les messages de chat de l'utilisateur
      const { error: chatError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', selectedUserForDeletion.id);

      if (chatError) {
        console.error('Erreur suppression messages chat:', chatError);
        // Continue même si cette étape échoue
      }

      // 2. Supprimer toutes les clés beta créées par cet utilisateur
      const { error: betaKeysError } = await supabase
        .from('beta_keys')
        .delete()
        .eq('created_by', selectedUserForDeletion.id);

      if (betaKeysError) {
        console.error('Erreur suppression clés beta:', betaKeysError);
        // Continue même si cette étape échoue
      }

      // 3. Supprimer le profil utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUserForDeletion.id);

      if (profileError) {
        console.error('Erreur suppression profil:', profileError);
        throw new Error(`Erreur lors de la suppression du profil: ${profileError.message}`);
      }

      // 4. Supprimer l'utilisateur de l'authentification (optionnel, nécessite des permissions admin)
      // Cette partie peut échouer selon les permissions, c'est normal
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(selectedUserForDeletion.id);
        if (authError) {
          console.warn('Impossible de supprimer l\'utilisateur de l\'auth (permissions insuffisantes):', authError);
        }
      } catch (authDeleteError) {
        console.warn('Échec suppression utilisateur auth:', authDeleteError);
      }

      // Recharger les données
      await Promise.all([
        loadAllUsers(),
        loadChatMessages(),
        loadStats(),
        loadBetaKeys()
      ]);

      setShowDeleteUserModal(false);
      setSelectedUserForDeletion(null);

      alert(`Utilisateur ${selectedUserForDeletion.full_name || selectedUserForDeletion.email} supprimé avec succès !\n\nToutes ses données associées ont été effacées :\n- Messages du chat\n- Clés beta créées\n- Profil utilisateur`);
    } catch (error: any) {
      console.error('Erreur complète suppression utilisateur:', error);

      let errorMessage = 'Erreur lors de la suppression de l\'utilisateur';

      if (error.message?.includes('permission denied')) {
        errorMessage = 'Permissions insuffisantes pour supprimer cet utilisateur';
      } else if (error.message?.includes('referenced')) {
        errorMessage = 'Impossible de supprimer : l\'utilisateur a des données liées';
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }

      alert(` ${errorMessage}\n\nVeuillez réessayer ou contacter le support technique.`);

      // Recharger les données pour restaurer l'état correct
      await loadAllUsers();
    } finally {
      setDeleteUserLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      console.log(`🗑️ Suppression du message: ${messageId}`);

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('❌ Erreur suppression message:', error);

        let errorMessage = 'Erreur lors de la suppression du message';

        if (error.message?.includes('permission denied')) {
          errorMessage = 'Permissions insuffisantes pour supprimer ce message';
        } else if (error.message?.includes('row level security')) {
          errorMessage = 'Règles de sécurité empêchent la suppression';
        } else if (error.message) {
          errorMessage = `Erreur: ${error.message}`;
        }

        alert(`❌ ${errorMessage}\n\nVeuillez vérifier vos permissions ou contacter le support.`);
        return;
      }

      console.log('✅ Message supprimé avec succès');

      // Recharger les messages et statistiques
      await Promise.all([
        loadChatMessages(),
        loadStats()
      ]);
    } catch (error: any) {
      console.error('💥 Erreur complète suppression message:', error);

      let errorMessage = 'Erreur lors de la suppression du message';

      if (error.message?.includes('permission denied')) {
        errorMessage = 'Permissions insuffisantes pour cette opération';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Problème de connexion réseau';
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }

      alert(`💥 ${errorMessage}\n\nVeuillez réessayer ou contacter le support technique.`);

      // Recharger les données pour restaurer l'état correct
      await loadChatMessages();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du panel admin...</p>
          <p className="text-gray-500 text-sm mt-2">Vérification des droits d'accès...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Tableau de Bord</h2>
              <p className="text-gray-600">Vue d'ensemble de SORadio</p>
            </div>

            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="ri-user-line text-blue-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Utilisateurs Total</p>
                    <p className="text-2xl font-bold text-gray-800">{statsData.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="ri-user-add-line text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nouveaux Aujourd'hui</p>
                    <p className="text-2xl font-bold text-gray-800">{statsData.newUsersToday}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="ri-chat-3-line text-purple-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Messages Chat</p>
                    <p className="text-2xl font-bold text-gray-800">{statsData.totalMessages}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="ri-radio-line text-orange-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Utilisateurs Actifs</p>
                    <p className="text-2xl font-bold text-gray-800">{statsData.activeUsers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions Rapides</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer text-left"
                >
                  <i className="ri-user-settings-line text-blue-600 text-xl mb-2 block"></i>
                  <h4 className="font-medium text-gray-800">Gérer Utilisateurs</h4>
                  <p className="text-sm text-gray-600">Bannir, promouvoir, gérer les rôles</p>
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer text-left"
                >
                  <i className="ri-chat-3-line text-green-600 text-xl mb-2 block"></i>
                  <h4 className="font-medium text-gray-800">Modérer Chat</h4>
                  <p className="text-sm text-gray-600">Supprimer messages, fermer temporairement</p>
                </button>

                <button
                  onClick={() => setActiveTab('beta')}
                  className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer text-left"
                >
                  <i className="ri-key-line text-purple-600 text-xl mb-2 block"></i>
                  <h4 className="font-medium text-gray-800">Clés Beta</h4>
                  <p className="text-sm text-gray-600">Créer et gérer les accès beta</p>
                </button>
              </div>
            </div>

            {/* Statut du système */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Statut du Système</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-800">Radio en ligne</span>
                  </div>
                  <span className="text-sm text-green-600">Opérationnel</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${chatClosed ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="font-medium text-gray-800">Chat</span>
                  </div>
                  <span className={`text-sm ${chatClosed ? 'text-red-600' : 'text-green-600'}`}>
                    {chatClosed ? 'Fermé' : 'Ouvert'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${settings?.system.maintenanceMode ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                    <span className="font-medium text-gray-800">Site Web</span>
                  </div>
                  <span className={`text-sm ${settings?.system.maintenanceMode ? 'text-orange-600' : 'text-green-600'}`}>
                    {settings?.system.maintenanceMode ? 'Maintenance' : 'En ligne'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Gestion des Utilisateurs</h2>
                <p className="text-gray-600">Gérer les comptes utilisateur et leurs permissions</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={loadAllUsers}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap flex items-center"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  Actualiser
                </button>
                <div className="text-sm text-gray-500">
                  Total: {allUsers.length} utilisateurs
                </div>
              </div>
            </div>

            {/* Tableau des utilisateurs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-4 px-6 font-medium text-gray-700">Utilisateur</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-700">Rôle</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-700">Statut</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-700">Inscription</th>
                      <th className="text-right py-4 px-6 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-gray-800">
                              {user.full_name || user.email}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            disabled={roleUpdateLoading === user.id}
                            className={`px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 ${roleUpdateLoading === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <option value="auditeur">Auditeur</option>
                            <option value="vip">VIP</option>
                            <option value="animateur">Animateur</option>
                            <option value="journaliste">Journaliste</option>
                            <option value="moderateur">Modérateur</option>
                            <option value="admin">Admin</option>
                          </select>
                          {roleUpdateLoading === user.id && (
                            <div className="mt-1 text-xs text-orange-600 flex items-center">
                              <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                              Mise à jour...
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col space-y-1">
                            {user.is_banned ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <i className="ri-forbid-line mr-1"></i>
                                Banni
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <i className="ri-check-line mr-1"></i>
                                Actif
                              </span>
                            )}
                            {user.is_admin && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <i className="ri-shield-star-line mr-1"></i>
                                Admin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {user.is_banned ? (
                              <button
                                onClick={() => unbanUser(user.id)}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
                              >
                                <i className="ri-check-line mr-1"></i>
                                Débannir
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowBanModal(true);
                                }}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                              >
                                <i className="ri-forbid-line mr-1"></i>
                                Bannir
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedUserForDeletion(user);
                                setShowDeleteUserModal(true);
                              }}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Modération du Chat</h2>
                <p className="text-gray-600">Gérer les messages et modérer les discussions</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-2 rounded-lg text-sm font-medium ${chatClosed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  <i className={`${chatClosed ? 'ri-lock-line' : 'ri-chat-3-line'} mr-2`}></i>
                  Chat {chatClosed ? 'Fermé' : 'Ouvert'}
                </div>
              </div>
            </div>

            {/* Actions de modération */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions de Modération</h3>
              <div className="flex flex-wrap gap-4">
                {chatClosed ? (
                  <button
                    onClick={reopenChat}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-lock-unlock-line mr-2"></i>
                    Rouvrir le Chat
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCloseChatModal(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-lock-line mr-2"></i>
                    Fermer Temporairement
                  </button>
                )}
                <button
                  onClick={() => setShowClearChatModal(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-delete-bin-line mr-2"></i>
                  Vider le Chat
                </button>
              </div>

              {/* Statut de fermeture */}
              {chatClosed && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <i className="ri-lock-line text-orange-600 text-lg mt-0.5"></i>
                    <div>
                      <h4 className="font-medium text-orange-800 mb-1">Chat temporairement fermé</h4>
                      {chatCloseReason && (
                        <p className="text-orange-700 text-sm mb-2">
                          <strong>Raison :</strong> {chatCloseReason}
                        </p>
                      )}
                      {chatCloseUntil && (
                        <p className="text-orange-600 text-sm">
                          <strong>Réouverture prévue :</strong> {new Date(chatCloseUntil).toLocaleString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Messages récents */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Messages Récents</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {chatMessages.length} messages au total
                </p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <i className="ri-chat-3-line text-4xl mb-2 block"></i>
                    <p>Aucun message</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {chatMessages.map((message) => (
                      <div key={message.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-800">
                                {message.user_name || message.profiles?.full_name || message.profiles?.email || message.user_email || 'Utilisateur'}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${message.user_role === 'admin' ? 'bg-red-100 text-red-800' : message.user_role === 'moderateur' ? 'bg-green-100 text-green-800' : message.user_role === 'journaliste' ? 'bg-blue-100 text-blue-800' : message.user_role === 'animateur' ? 'bg-purple-100 text-purple-800' : message.user_role === 'vip' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                              >
                                {message.user_role || message.profiles?.role || 'auditeur'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.created_at).toLocaleString('fr-FR')}
                              </span>
                            </div>
                            <p className="text-gray-700">{message.message}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              Email: {message.user_email || message.profiles?.email || 'Non disponible'}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteMessage(message.id)}
                            className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer le message"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'beta':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Gestion des Clés Beta</h2>
                <p className="text-gray-600">Créer et gérer l'accès beta au site</p>
              </div>
              <button
                onClick={() => setShowCreateBetaKeyModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:scale-105 transition-transform cursor-pointer whitespace-nowrap shadow-lg"
              >
                <i className="ri-add-line mr-2"></i>
                Créer une Clé
              </button>
            </div>

            {/* Statistiques des clés */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-gray-800">{betaKeys.length}</div>
                <div className="text-sm text-gray-600">Total Clés</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-green-600">
                  {betaKeys.filter((key) => key.is_active && new Date(key.expires_at) > new Date()).length}
                </div>
                <div className="text-sm text-gray-600">Actives</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-orange-600">
                  {betaKeys.filter((key) => key.usage_count >= key.max_usage).length}
                </div>
                <div className="text-sm text-gray-600">Utilisées</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-red-600">
                  {betaKeys.filter((key) => new Date(key.expires_at) <= new Date()).length}
                </div>
                <div className="text-sm text-gray-600">Expirées</div>
              </div>
            </div>

            {/* Liste des clés */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Toutes les Clés Beta</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Clé</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Description</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Statut</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Usage</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-700">Expiration</th>
                      <th className="text-right py-3 px-6 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {betaKeys.map((key) => {
                      const isExpired = new Date(key.expires_at) <= new Date();
                      const isUsed = key.usage_count >= key.max_usage;
                      const isActive = key.is_active && !isExpired && !isUsed;

                      return (
                        <tr key={key.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                {key.key_code}
                              </code>
                              <button
                                onClick={() => navigator.clipboard.writeText(key.key_code)}
                                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                                title="Copier la clé"
                              >
                                <i className="ri-file-copy-line"></i>
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="max-w-xs">
                              <p className="text-sm text-gray-800 truncate">{key.description}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col space-y-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : isUsed ? 'bg-orange-100 text-orange-800' : isExpired ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
                              >
                                {isActive ? 'Active' : isUsed ? 'Utilisée' : isExpired ? 'Expirée' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${key.usage_count >= key.max_usage ? 'bg-red-500' : 'bg-blue-500'}`}
                                  style={{ width: `${(key.usage_count / key.max_usage) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">
                                {key.usage_count}/{key.max_usage}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {new Date(key.expires_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => toggleBetaKeyStatus(key.id, key.is_active)}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors cursor-pointer ${key.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                              >
                                {key.is_active ? 'Désactiver' : 'Activer'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBetaKey(key);
                                  setShowDeleteBetaKeyModal(true);
                                }}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors cursor-pointer"
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Paramètres du Site</h2>
              <p className="text-gray-600">Configuration générale de SORadio</p>
            </div>

            {settings && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="space-y-6">
                  {/* Mode maintenance */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-800">Mode Maintenance</h3>
                      <p className="text-sm text-gray-600">Activer pour fermer temporairement le site</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.system.maintenanceMode}
                        onChange={handleMaintenanceToggle}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  {/* Informations générales */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Informations Générales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom de la radio
                        </label>
                        <input
                          type="text"
                          value={settings.general.name}
                          onChange={(e) => setSettings({ ...settings, general: { ...settings.general, name: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Slogan
                        </label>
                        <input
                          type="text"
                          value={settings.general.slogan}
                          onChange={(e) => setSettings({ ...settings, general: { ...settings.general, slogan: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fréquence FM
                        </label>
                        <input
                          type="text"
                          value={settings.general.frequency}
                          onChange={(e) => setSettings({ ...settings, general: { ...settings.general, frequency: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email de contact
                        </label>
                        <input
                          type="email"
                          value={settings.general.email}
                          onChange={(e) => setSettings({ ...settings, general: { ...settings.general, email: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={saveSettingsData}
                      disabled={settingsLoading}
                      className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-lg"
                    >
                      {settingsLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
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
            )}
          </div>
        );

      default:
        return <div>Section non trouvée</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <i className="ri-settings-line text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
                <p className="text-gray-500 text-sm">SORadio Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-orange-500 transition-colors cursor-pointer"
              >
                <i className="ri-home-line mr-2"></i>
                Back to Site
              </Link>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-gray-600"></i>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex space-x-8">
          <div className="w-64 bg-white rounded-xl p-6 shadow-sm h-fit">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <i className="ri-dashboard-line mr-3"></i>
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'users' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <i className="ri-user-settings-line mr-3"></i>
                Gestion Utilisateurs
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'chat' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <i className="ri-chat-3-line mr-3"></i>
                Chat Moderation
              </button>
              <button
                onClick={() => setActiveTab('beta')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'beta' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <i className="ri-key-line mr-3"></i>
                Clés Beta
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <i className="ri-settings-3-line mr-3"></i>
                Settings
              </button>
            </nav>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Modals pour les fonctionnalités existantes */}
      {showCreateBetaKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Créer une Clé Beta</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={betaKeyDescription}
                  onChange={(e) => setBetaKeyDescription(e.target.value)}
                  placeholder="Ex: Accès beta pour les testeurs..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {betaKeyDescription.length}/500 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée de validité
                </label>
                <select
                  value={betaKeyExpiry}
                  onChange={(e) => setBetaKeyExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="1h">1 heure</option>
                  <option value="24h">24 heures</option>
                  <option value="7d">7 jours</option>
                  <option value="30d">30 jours</option>
                </select>
              </div>

              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-2">Caractéristiques de la clé :</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• <strong>Usage unique</strong> - Ne peut être utilisée qu'une seule fois</li>
                  <li>• <strong>Expiration automatique</strong> - Devient inutilisable après la date limite</li>
                  <li>• <strong>Accès complet</strong> - Permet de contourner le mode maintenance</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateBetaKeyModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={createBetaKey}
                disabled={createBetaKeyLoading || !betaKeyDescription.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 disabled:hover:scale-100 whitespace-nowrap"
              >
                {createBetaKeyLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <i className="ri-key-line mr-2"></i>
                    Créer la Clé
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Fermer le Chat Temporairement</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de la fermeture *
                </label>
                <textarea
                  value={chatCloseReason}
                  onChange={(e) => setChatCloseReason(e.target.value)}
                  placeholder="Ex: Maintenance technique, modération renforcée..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cette raison sera visible par les utilisateurs • {chatCloseReason.length}/500 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Réouverture automatique (optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={chatCloseUntil}
                  onChange={(e) => setChatCloseUntil(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laisser vide pour réouverture manuelle uniquement
                </p>
              </div>

              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-2">Conséquences de la fermeture :</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Les utilisateurs ne pourront plus envoyer de messages</li>
                  <li>• Les messages existants restent visibles</li>
                  <li>• La raison sera affichée aux utilisateurs</li>
                  <li>• Vous pourrez rouvrir manuellement à tout moment</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCloseChatModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={closeChatTemporarily}
                disabled={closeChatLoading || !chatCloseReason.trim()}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 disabled:hover:scale-100 whitespace-nowrap"
              >
                {closeChatLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                    Fermeture...
                  </>
                ) : (
                  <>
                    <i className="ri-lock-line mr-2"></i>
                    Fermer le Chat
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression d'utilisateur */}
      {showDeleteUserModal && selectedUserForDeletion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-delete-bin-line text-red-600 text-2xl"></i>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4">Supprimer l'utilisateur</h3>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium mb-2">⚠️ ATTENTION : Action irréversible</p>
                <p className="text-red-700 text-sm leading-relaxed">
                  Vous êtes sur le point de supprimer définitivement l'utilisateur :
                </p>
                <div className="bg-white rounded-lg p-3 mt-3 border border-red-200">
                  <p className="font-bold text-gray-800">{selectedUserForDeletion.full_name || 'Nom non défini'}</p>
                  <p className="text-gray-600 text-sm">{selectedUserForDeletion.email}</p>
                  <p className="text-gray-500 text-xs">Rôle: {selectedUserForDeletion.role}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-medium text-gray-800 mb-2">Données qui seront supprimées :</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Profil utilisateur complet</li>
                  <li>✓ Tous les messages du chat</li>
                  <li>✓ Clés beta créées par cet utilisateur</li>
                  <li>✓ Compte d'authentification (si possible)</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-yellow-800 text-sm">
                  <i className="ri-warning-line mr-1"></i>
                  Cette action ne peut pas être annulée. L'utilisateur devra recréer un compte s'il souhaite revenir.
                </p>
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  setShowDeleteUserModal(false);
                  setSelectedUserForDeletion(null);
                }}
                disabled={deleteUserLoading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={deleteUser}
                disabled={deleteUserLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                {deleteUserLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <i className="ri-delete-bin-line mr-2"></i>
                    Supprimer Définitivement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression de clé beta */}
      {showDeleteBetaKeyModal && selectedBetaKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-key-line text-red-600 text-2xl"></i>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4">Supprimer la Clé Beta</h3>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium mb-2">⚠️ ATTENTION : Action irréversible</p>
                <p className="text-red-700 text-sm leading-relaxed">
                  Vous êtes sur le point de supprimer définitivement cette clé beta :
                </p>
                <div className="bg-white rounded-lg p-3 mt-3 border border-red-200">
                  <p className="font-mono text-sm text-gray-800 bg-gray-100 px-2 py-1 rounded">
                    {selectedBetaKey.key_code}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">{selectedBetaKey.description}</p>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Usage: {selectedBetaKey.usage_count}/{selectedBetaKey.max_usage}</span>
                    <span>Expire: {new Date(selectedBetaKey.expires_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-yellow-800 text-sm">
                  <i className="ri-warning-line mr-1"></i>
                  Cette action ne peut pas être annulée. La clé deviendra définitivement inutilisable.
                </p>
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  setShowDeleteBetaKeyModal(false);
                  setSelectedBetaKey(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={deleteBetaKey}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-delete-bin-line mr-2"></i>
                Supprimer Définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression du chat */}
      {showClearChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-delete-bin-line text-red-600 text-2xl"></i>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4">Vider complètement le Chat</h3>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium mb-2">⚠️ ATTENTION : Action irréversible</p>
                <p className="text-red-700 text-sm leading-relaxed">
                  Vous êtes sur le point de supprimer définitivement <strong>TOUS</strong> les messages du chat.
                </p>
                <div className="bg-white rounded-lg p-3 mt-3 border border-red-200">
                  <p className="text-gray-800 font-medium">Messages à supprimer :</p>
                  <p className="text-2xl font-bold text-red-600">{chatMessages.length} messages</p>
                  <p className="text-gray-600 text-sm">De tous les utilisateurs</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-yellow-800 text-sm">
                  <i className="ri-warning-line mr-1"></i>
                  Cette action supprimera définitivement tous les messages. L'historique du chat sera perdu.
                </p>
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowClearChatModal(false)}
                disabled={clearChatLoading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={clearAllMessages}
                disabled={clearChatLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {clearChatLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <i className="ri-delete-bin-line mr-2"></i>
                    Vider Définitivement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de bannissement */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-forbid-line text-red-600 text-2xl"></i>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4">Bannir l'utilisateur</h3>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="font-medium text-gray-800">{selectedUser.full_name || 'Nom non défini'}</p>
                <p className="text-gray-600 text-sm">{selectedUser.email}</p>
                <p className="text-gray-500 text-xs">Rôle: {selectedUser.role}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée du bannissement
                </label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  disabled={isPermanentBan || banUserLoading}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100"
                >
                  <option value="1h">1 heure</option>
                  <option value="6h">6 heures</option>
                  <option value="24h">24 heures</option>
                  <option value="3d">3 jours</option>
                  <option value="7d">7 jours</option>
                  <option value="1w">1 semaine</option>
                  <option value="1m">1 mois</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="permanentBan"
                  checked={isPermanentBan}
                  onChange={(e) => setIsPermanentBan(e.target.checked)}
                  disabled={banUserLoading}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 disabled:opacity-50"
                />
                <label htmlFor="permanentBan" className="text-sm font-medium text-gray-700">
                  Bannissement permanent
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du bannissement
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Ex: Comportement inapproprié, spam, violation des règles..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 resize-none"
                  rows={3}
                  maxLength={500}
                  disabled={banUserLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {banReason.length}/500 caractères • Cette raison sera visible par l'utilisateur
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">Conséquences du bannissement :</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• L'utilisateur ne pourra plus se connecter</li>
                  <li>• Tous ses messages resteront visibles</li>
                  <li>• Il recevra un message d'explication</li>
                  <li>• {isPermanentBan ? 'Bannissement définitif' : 'Déban automatique à la fin de la période'}</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                  setIsPermanentBan(false);
                  setSelectedUser(null);
                }}
                disabled={banUserLoading}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={banUser}
                disabled={banUserLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {banUserLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                    Bannissement...
                  </>
                ) : (
                  <>
                    <i className="ri-forbid-line mr-2"></i>
                    {isPermanentBan ? 'Bannir Définitivement' : 'Bannir Temporairement'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

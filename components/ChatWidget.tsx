
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface ChatMessage {
  id: string;
  user_name: string;
  user_email: string;
  user_role: 'admin' | 'journaliste' | 'moderateur' | 'animateur' | 'vip' | 'auditeur';
  message: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'journaliste' | 'moderateur' | 'animateur' | 'vip' | 'auditeur';
  is_banned?: boolean;
  is_muted?: boolean;
  ban_reason?: string;
  mute_until?: string;
  warnings_count?: number;
}

interface ChatWidgetProps {
  user?: any;
  onAuthRequest: () => void;
}

export default function ChatWidget({ user, onAuthRequest }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [presenceChannel, setPresenceChannel] = useState<any>(null);

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

  const [chatClosed, setChatClosed] = useState(false);
  const [chatCloseReason, setChatCloseReason] = useState('');
  const [chatCloseUntil, setChatCloseUntil] = useState('');

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        setAuthInitialized(true);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Erreur chargement profil utilisateur:', error);
      } finally {
        setAuthInitialized(true);
      }
    };

    loadUserProfile();
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      console.log('🔥 Chat ouvert - Configuration des systèmes...');
      loadMessages();
      setupRealtimeSubscription();
      if (user) {
        setupPresenceChannel();
      }
    } else {
      console.log('🔒 Chat fermé - Nettoyage des subscriptions...');
      cleanupSubscriptions();
    }

    return () => {
      cleanupSubscriptions();
    };
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && data) {
        console.log('📨 Messages chargés:', data.length);
        setMessages(data);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (realtimeChannel) {
      console.log('🧹 Nettoyage ancien canal messages...');
      realtimeChannel.unsubscribe();
    }

    setRealtimeStatus('connecting');
    console.log('⚡ Configuration du canal temps réel messages...');

    const channel = supabase
      .channel('chat_messages_realtime_v3', {
        config: {
          broadcast: { self: false },
          presence: { key: 'messages' }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          console.log('📩 Nouveau message reçu en temps réel:', payload.new);
          const newMessage = payload.new as ChatMessage;

          setMessages((prev) => {
            console.log('📋 Messages actuels avant traitement:', prev.length);

            const filteredMessages = prev.filter((msg) => !msg.id.startsWith('temp-'));
            console.log('🧹 Messages après suppression temporaires:', filteredMessages.length);

            const messageExists = filteredMessages.some(
              (msg) =>
                msg.id === newMessage.id ||
                (msg.message === newMessage.message &&
                  msg.user_email === newMessage.user_email &&
                  Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000)
            );

            if (!messageExists) {
              console.log('✅ Ajout du nouveau message au chat:', newMessage.id);
              const updatedMessages = [...filteredMessages, newMessage];
              console.log('📋 Total messages après ajout:', updatedMessages.length);
              return updatedMessages;
            }

            console.log('⚠️ Message déjà présent ou dupliqué, ignoré');
            return filteredMessages;
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut canal messages:', status);
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          console.log('✅ Canal messages connecté');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected');
          console.log('❌ Canal messages déconnecté');
        }
      });

    setRealtimeChannel(channel);
  };

  const setupPresenceChannel = () => {
    if (!user) {
      console.log('❌ Pas d\'utilisateur pour la présence');
      return;
    }

    if (presenceChannel) {
      console.log('🧹 Nettoyage ancien canal présence...');
      presenceChannel.unsubscribe();
    }

    console.log('👥 Configuration du canal de présence pour:', user.email);

    const channel = supabase
      .channel('chat_presence_v3', {
        config: {
          presence: {
            key: user.id
          }
        }
      })
      .on(
        'presence',
        { event: 'sync' },
        () => {
          console.log('🔄 Sync présence...');
          const state = channel.presenceState();
          const uniqueUsers = Object.keys(state).length;
          console.log('👥 Utilisateurs uniques en ligne:', uniqueUsers, state);
          setOnlineUsers(uniqueUsers);
        }
      )
      .on(
        'presence',
        { event: 'join' },
        ({ key, newPresences }) => {
          console.log('➕ Utilisateur rejoint:', key, newPresences);
          setOnlineUsers((prev) => {
            const newCount = prev + newPresences.length;
            console.log('👥 Nouveau compteur:', newCount);
            return newCount;
          });
        }
      )
      .on(
        'presence',
        { event: 'leave' },
        ({ key, leftPresences }) => {
          console.log('➖ Utilisateur parti:', key, leftPresences);
          setOnlineUsers((prev) => {
            const newCount = Math.max(0, prev - leftPresences.length);
            console.log('👥 Nouveau compteur:', newCount);
            return newCount;
          });
        }
      )
      .subscribe(async (status) => {
        console.log('📡 Statut canal présence:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Canal présence connecté - Tracking utilisateur...');
          try {
            await channel.track({
              user_id: user.id,
              user_email: user.email,
              user_name: userProfile?.full_name || user.email,
              online_at: new Date().toISOString()
            });
            console.log('✅ Utilisateur tracké avec succès');
          } catch (error) {
            console.error('❌ Erreur tracking utilisateur:', error);
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.log('❌ Canal présence déconnecté');
        }
      });

    setPresenceChannel(channel);

    const handleBeforeUnload = () => {
      console.log('🚪 Nettoyage présence avant fermeture');
      if (channel) {
        channel.untrack();
        channel.unsubscribe();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (channel) {
        channel.untrack();
        channel.unsubscribe();
      }
    };
  };

  const cleanupSubscriptions = () => {
    console.log('🧹 Nettoyage complet des subscriptions...');

    if (realtimeChannel) {
      console.log('🧹 Fermeture canal messages...');
      realtimeChannel.unsubscribe();
      setRealtimeChannel(null);
    }

    if (presenceChannel) {
      console.log('🧹 Fermeture canal présence...');
      presenceChannel.untrack();
      presenceChannel.unsubscribe();
      setPresenceChannel(null);
    }

    setOnlineUsers(0);
    setRealtimeStatus('disconnected');

    console.log('✅ Nettoyage terminé');
  };

  const checkChatStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('category', 'chat')
        .in('key', ['chatClosed', 'chatCloseReason', 'chatCloseUntil']);

      if (!error && data) {
        let isClosed = false;
        let reason = '';
        let until = '';

        data.forEach((setting) => {
          if (setting.key === 'chatClosed') {
            isClosed = setting.value === 'true';
          } else if (setting.key === 'chatCloseReason') {
            reason = setting.value || '';
          } else if (setting.key === 'chatCloseUntil') {
            until = setting.value || '';
          }
        });

        if (isClosed && until) {
          const reopenTime = new Date(until);
          const now = new Date();

          if (now >= reopenTime) {
            await supabase
              .from('site_settings')
              .upsert(
                [
                  { category: 'chat', key: 'chatClosed', value: 'false' },
                  { category: 'chat', key: 'chatCloseReason', value: '' },
                  { category: 'chat', key: 'chatCloseUntil', value: '' }
                ],
                { onConflict: 'category,key' }
              );

            setChatClosed(false);
            setChatCloseReason('');
            setChatCloseUntil('');
            return;
          }
        }

        setChatClosed(isClosed);
        setChatCloseReason(reason);
        setChatCloseUntil(until);
      }
    } catch (error) {
      console.error('Erreur vérification statut chat:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkChatStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const chatStatusChannel = supabase
        .channel('chat-status-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'site_settings',
            filter: 'category=eq.chat'
          },
          (payload: any) => {
            if (payload.new) {
              if (payload.new.key === 'chatClosed') {
                setChatClosed(payload.new.value === 'true');
              } else if (payload.new.key === 'chatCloseReason') {
                setChatCloseReason(payload.new.value || '');
              } else if (payload.new.key === 'chatCloseUntil') {
                setChatCloseUntil(payload.new.value || '');
              }
            }
          }
        )
        .subscribe();

      return () => {
        chatStatusChannel.unsubscribe();
      };
    }
  }, [isOpen]);

  const sendMessage = async () => {
    // VÉRIFICATION CRITIQUE : Chat fermé
    if (chatClosed) {
      alert('Le chat est temporairement fermé. Vous ne pouvez pas envoyer de messages pour le moment.');
      return;
    }

    if (!newMessage.trim() || !user || !userProfile || loading) return;

    console.log('📤 Envoi du message:', newMessage.trim());
    setLoading(true);

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      user_name: userProfile.full_name || user.email,
      user_email: user.email,
      user_role: userProfile.role || 'auditeur',
      message: newMessage.trim(),
      created_at: new Date().toISOString()
    };

    setMessages((prev) => {
      const filtered = prev.filter((msg) => !msg.id.startsWith('temp-') || msg.user_email !== user.email);
      return [...filtered, tempMessage];
    });

    const messageToSend = newMessage.trim();
    setNewMessage('');
    try {
      console.log('💾 Sauvegarde en base...');
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_name: userProfile.full_name || user.email,
          user_email: user.email,
          user_role: userProfile.role || 'auditeur',
          message: messageToSend
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur envoi message:', error);
        setNewMessage(messageToSend);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        alert('Erreur lors de l\'envoi du message');
      } else {
        console.log('✅ Message sauvegardé:', data);

        setTimeout(() => {
          setMessages((prev) => {
            const filtered = prev.filter((msg) => msg.id !== tempId);
            const exists = filtered.some(
              (msg) =>
                msg.id === data.id ||
                (msg.message === data.message &&
                  msg.user_email === data.user_email &&
                  Math.abs(new Date(msg.created_at).getTime() - new Date(data.created_at).getTime()) < 2000)
            );

            if (!exists) {
              console.log('🔄 Ajout forcé du message après sauvegarde');
              return [...filtered, data];
            }
            console.log('✅ Message déjà présent via temps réel');
            return filtered;
          });
        }, 500);
      }
    } catch (error) {
      console.error('❌ Échec envoi message:', error);
      setNewMessage(messageToSend);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusDisplay = () => {
    switch (realtimeStatus) {
      case 'connected':
        return { text: 'Temps réel', color: 'text-green-600' };
      case 'connecting':
        return { text: 'Connexion...', color: 'text-yellow-600' };
      default:
        return { text: 'Hors ligne', color: 'text-red-600' };
    }
  };

  const handleAuthRequest = () => {
    setIsOpen(false);
    onAuthRequest();
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all duration-300 cursor-pointer ${
            chatClosed
              ? 'bg-gradient-to-r from-gray-500 to-gray-600 animate-none'
              : 'bg-gradient-to-r from-orange-500 to-red-500 animate-pulse'
          }`}
        >
          {isOpen ? (
            <i className="ri-close-line text-2xl"></i>
          ) : (
            <div className="relative">
              {chatClosed ? (
                <i className="ri-lock-line text-2xl"></i>
              ) : (
                <i className="ri-chat-3-line text-2xl"></i>
              )}
              {!chatClosed && onlineUsers > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                  {onlineUsers}
                </div>
              )}
            </div>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
          <div
            className={`p-4 text-white ${
              chatClosed
                ? 'bg-gradient-to-r from-gray-500 to-gray-600'
                : 'bg-gradient-to-r from-orange-500 to-red-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center space-x-2">
                  <span>Chat SORadio</span>
                  {chatClosed && <i className="ri-lock-line"></i>}
                </h3>
                <div className="flex items-center space-x-2 text-sm opacity-90">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      chatClosed
                        ? 'bg-gray-400'
                        : realtimeStatus === 'connected'
                        ? 'bg-green-400 animate-pulse'
                        : realtimeStatus === 'connecting'
                        ? 'bg-yellow-400 animate-pulse'
                        : 'bg-red-400'
                    }`}
                  ></div>
                  <span>
                    {chatClosed
                      ? 'Chat fermé temporairement'
                      : onlineUsers > 0
                      ? `${onlineUsers} en ligne`
                      : 'Personne en ligne'}
                    • {chatClosed ? 'Fermé' : getStatusDisplay().text}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </div>

          {chatClosed && (
            <div className="p-4 bg-orange-50 border-b border-orange-200">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="ri-lock-line text-orange-600 text-sm"></i>
                </div>
                <div className="flex-1">
                  <p className="text-orange-800 font-medium text-sm mb-1">Chat temporairement fermé</p>
                  {chatCloseReason && <p className="text-orange-700 text-sm mb-2">{chatCloseReason}</p>}
                  {chatCloseUntil && (
                    <p className="text-orange-600 text-xs">
                      Réouverture prévue : {new Date(chatCloseUntil).toLocaleString('fr-FR')}
                    </p>
                  )}
                  {!chatCloseUntil && (
                    <p className="text-orange-600 text-xs">Réouverture manuelle par l'équipe</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-gray-50 border-b text-xs">
            <div className="flex flex-wrap gap-2">
              {Object.entries(roleColors).map(([role, config]) => (
                <div key={role} className="flex items-center space-x-1">
                  <div className={`w-3 h-3 rounded-full ${config.badge}`}></div>
                  <span className="text-gray-600">{config.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className={`${chatClosed ? 'ri-lock-line' : 'ri-chat-3-line'} text-4xl mb-2 block`}></i>
                <p>{chatClosed ? 'Chat fermé' : 'Aucun message'}</p>
                <p className="text-xs mt-1">
                  {chatClosed ? 'Le chat est temporairement fermé' : 'Soyez le premier à écrire !'}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const roleConfig = roleColors[msg.user_role];
                const isTemporary = msg.id.startsWith('temp-');
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl border-l-4 ${roleConfig.bg} transition-all duration-500 ${
                      isTemporary ? 'opacity-70 scale-95 animate-pulse border-l-orange-400' : 'opacity-100 scale-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${roleConfig.badge}`}>
                        <i className={roleConfig.icon}></i>
                        <span>{roleConfig.label}</span>
                      </div>
                      <span className="font-semibold text-sm">{msg.user_name}</span>
                      <span className="text-xs text-gray-500">
                        {isTemporary ? (
                          <span className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
                            <span>Envoi...</span>
                          </span>
                        ) : (
                          formatTime(msg.created_at)
                        )}
                      </span>
                    </div>
                    <p className={`text-sm ${roleConfig.text} ${isTemporary ? 'italic' : ''}`}>
                      {msg.message}
                    </p>
                    {isTemporary && (
                      <div className="mt-2 flex items-center space-x-1 text-xs text-orange-600">
                        <div className="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Message en cours d'envoi...</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-gray-50">
            {!authInitialized ? (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Vérification identité...</p>
              </div>
            ) : user && userProfile ? (
              <div>
                <div className="flex items-center space-x-2 mb-2 text-xs text-gray-600">
                  <div className={`w-4 h-4 rounded-full ${roleColors[userProfile.role || 'auditeur'].badge} flex items-center justify-center`}>
                    <i className={`${roleColors[userProfile.role || 'auditeur'].icon} text-white text-xs`}></i>
                  </div>
                  <span>Connecté en tant que <strong>{roleColors[userProfile.role || 'auditeur'].label}</strong> - {userProfile.full_name || user.email}</span>
                  {userProfile.is_banned && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                      Banni
                    </span>
                  )}
                  {userProfile.is_muted && (
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-medium">
                      Muet
                    </span>
                  )}
                  {(userProfile.warnings_count || 0) > 0 && (
                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
                      {userProfile.warnings_count}
                    </span>
                  )}
                </div>

                {chatClosed ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-lock-line text-orange-600 text-xl"></i>
                    </div>
                    <p className="text-orange-600 font-medium mb-2">Chat temporairement fermé</p>
                    <p className="text-orange-500 text-xs">
                      {chatCloseReason || 'Le chat est fermé pour maintenance'}
                    </p>
                    {chatCloseUntil && (
                      <p className="text-orange-500 text-xs mt-1">
                        Réouverture : {new Date(chatCloseUntil).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                ) : userProfile.is_banned ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-forbid-line text-red-600 text-xl"></i>
                    </div>
                    <p className="text-red-600 font-medium mb-2">Vous êtes banni du chat</p>
                    <p className="text-red-500 text-xs">
                      {userProfile.ban_reason && `Raison : ${userProfile.ban_reason}`}
                    </p>
                  </div>
                ) : userProfile.is_muted && (!userProfile.mute_until || new Date(userProfile.mute_until) > new Date()) ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-volume-mute-line text-orange-600 text-xl"></i>
                    </div>
                    <p className="text-orange-600 font-medium mb-2">Vous êtes en mode silencieux</p>
                    <p className="text-orange-500 text-xs">
                      {userProfile.mute_until
                        ? `Fin le : ${new Date(userProfile.mute_until).toLocaleString('fr-FR')}`
                        : 'Durée indéterminée'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !loading && !chatClosed) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder={chatClosed ? "Chat fermé temporairement..." : "Tapez votre message..."}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                        maxLength={500}
                        disabled={loading || chatClosed}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || loading || chatClosed}
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap disabled:hover:scale-100"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <i className="ri-send-plane-line"></i>
                        )}
                      </button>
                    </div>
                    <p className={`text-xs mt-1 flex items-center space-x-2`}>
                      <span className={chatClosed ? 'text-orange-600' : getStatusDisplay().color}>
                        {chatClosed ? 'Chat fermé' : getStatusDisplay().text}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">{onlineUsers} personne(s) en ligne</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">Messages: {messages.length}</span>
                      {(userProfile.warnings_count || 0) > 0 && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="text-yellow-600">{userProfile.warnings_count} avertissement(s)</span>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="ri-user-line text-orange-600 text-xl"></i>
                </div>
                <p className="text-sm text-gray-600 mb-3 font-medium">
                  {chatClosed ? 'Chat temporairement fermé' : 'Connectez-vous pour participer au chat'}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  {chatClosed
                    ? chatCloseReason || 'Le chat est fermé pour maintenance'
                    : 'Rejoignez la communauté SORadio et discutez en temps réel avec les autres auditeurs !'}
                </p>
                {!chatClosed && (
                  <button
                    onClick={handleAuthRequest}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap shadow-lg"
                  >
                    <i className="ri-login-circle-line mr-2"></i>
                    Se connecter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

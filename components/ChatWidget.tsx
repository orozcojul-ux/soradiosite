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

  // 加载用户资料
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
        console.error('加载用户资料错误:', error);
      } finally {
        setAuthInitialized(true);
      }
    };

    loadUserProfile();
  }, [user]);

  // 加载聊天消息
  useEffect(() => {
    if (isOpen) {
      loadMessages();
      setupRealtimeSubscription();
      setupPresenceChannel();
    }

    return () => {
      if (isOpen) {
        cleanupSubscriptions();
      }
    };
  }, [isOpen]);

  // 自动滚动到底部
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
        setMessages(data);
      }
    } catch (error) {
      console.error('加载消息错误:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    setRealtimeStatus('connecting');

    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            // 移除临时消息并添加真实消息
            const filtered = prev.filter(msg => !msg.id.startsWith('temp-'));
            return [...filtered, newMessage];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CLOSED') {
          setRealtimeStatus('disconnected');
        }
      });

    return channel;
  };

  const setupPresenceChannel = () => {
    const presenceChannel = supabase
      .channel('online_users')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.keys(state).length;
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => prev + newPresences.length);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prev => Math.max(0, prev - leftPresences.length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await presenceChannel.track({
            user_id: user.id,
            user_email: user.email,
            online_at: new Date().toISOString(),
          });
        }
      });

    return presenceChannel;
  };

  const cleanupSubscriptions = () => {
    supabase.removeAllChannels();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !userProfile || loading) return;

    setLoading(true);

    // 创建临时消息以便立即显示
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_name: userProfile.full_name || user.email,
      user_email: user.email,
      user_role: userProfile.role || 'auditeur',
      message: newMessage.trim(),
      created_at: new Date().toISOString()
    };

    // 立即显示临时消息
    setMessages(prev => [...prev, tempMessage]);
    const messageToSend = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_name: userProfile.full_name || user.email,
          user_email: user.email,
          user_role: userProfile.role || 'auditeur',
          message: messageToSend
        });

      if (error) {
        console.error('发送消息错误:', error);
        // 恢复消息并移除临时消息
        setNewMessage(messageToSend);
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      setNewMessage(messageToSend);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
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
      {/* 浮动按钮 */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all duration-300 cursor-pointer animate-pulse"
        >
          {isOpen ? (
            <i className="ri-close-line text-2xl"></i>
          ) : (
            <div className="relative">
              <i className="ri-chat-3-line text-2xl"></i>
              {onlineUsers > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                  {onlineUsers}
                </div>
              )}
            </div>
          )}
        </button>
      </div>

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Chat SORadio</h3>
                <div className="flex items-center space-x-2 text-sm opacity-90">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    realtimeStatus === 'connected' ? 'bg-green-400' : realtimeStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></div>
                  <span>
                    {onlineUsers > 0 ? `${onlineUsers} 在线` : '无人在线'} • {getStatusDisplay().text}
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

          {/* 角色图例 */}
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

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-chat-3-line text-4xl mb-2 block"></i>
                <p>暂无消息</p>
                <p className="text-xs mt-1">成为第一个发言的人！</p>
              </div>
            ) : (
              messages.map((msg) => {
                const roleConfig = roleColors[msg.user_role];
                const isTemporary = msg.id.startsWith('temp-');
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl border-l-4 ${roleConfig.bg} transition-opacity ${
                      isTemporary ? 'opacity-70' : 'opacity-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${roleConfig.badge}`}>
                        <i className={roleConfig.icon}></i>
                        <span>{roleConfig.label}</span>
                      </div>
                      <span className="font-semibold text-sm">{msg.user_name}</span>
                      <span className="text-xs text-gray-500">
                        {isTemporary ? '发送中...' : formatTime(msg.created_at)}
                      </span>
                    </div>
                    <p className={`text-sm ${roleConfig.text}`}>
                      {msg.message}
                    </p>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="p-4 border-t bg-gray-50">
            {!authInitialized ? (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">验证身份中...</p>
              </div>
            ) : user && userProfile ? (
              <div>
                <div className="flex items-center space-x-2 mb-2 text-xs text-gray-600">
                  <div className={`w-4 h-4 rounded-full ${roleColors[userProfile.role || 'auditeur'].badge} flex items-center justify-center`}>
                    <i className={`${roleColors[userProfile.role || 'auditeur'].icon} text-white text-xs`}></i>
                  </div>
                  <span>已登录为 <strong>{roleColors[userProfile.role || 'auditeur'].label}</strong> - {userProfile.full_name || user.email}</span>
                  {userProfile.is_banned && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                      已封禁
                    </span>
                  )}
                  {userProfile.is_muted && (
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-medium">
                      禁言中
                    </span>
                  )}
                  {(userProfile.warnings_count || 0) > 0 && (
                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
                      ⚠️ {userProfile.warnings_count}
                    </span>
                  )}
                </div>

                {userProfile.is_banned ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-forbid-line text-red-600 text-xl"></i>
                    </div>
                    <p className="text-red-600 font-medium mb-2">您已被禁止聊天</p>
                    <p className="text-red-500 text-xs">
                      {userProfile.ban_reason && `原因：${userProfile.ban_reason}`}
                    </p>
                  </div>
                ) : userProfile.is_muted && (!userProfile.mute_until || new Date(userProfile.mute_until) > new Date()) ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-volume-mute-line text-orange-600 text-xl"></i>
                    </div>
                    <p className="text-orange-600 font-medium mb-2">您已被禁言</p>
                    <p className="text-orange-500 text-xs">
                      {userProfile.mute_until
                        ? `解禁时间：${new Date(userProfile.mute_until).toLocaleString('zh-CN')}`
                        : '无限期'
                      }
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
                          if (e.key === 'Enter' && !loading) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="输入消息..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                        maxLength={500}
                        disabled={loading}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || loading}
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <i className="ri-send-plane-line"></i>
                        )}
                      </button>
                    </div>
                    <p className={`text-xs mt-1 ${getStatusDisplay().color}`}>
                      系统已优化 • {getStatusDisplay().text} • {onlineUsers} 人在线
                      {(userProfile.warnings_count || 0) > 0 && (
                        <span className="text-yellow-600 ml-2">
                          • {userProfile.warnings_count} 次警告
                        </span>
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
                <p className="text-sm text-gray-600 mb-3 font-medium">登录后参与聊天</p>
                <p className="text-xs text-gray-500 mb-4">
                  加入 SORadio 社区，与其他听众实时交流！
                </p>
                <button
                  onClick={handleAuthRequest}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:scale-105 transition-transform cursor-pointer whitespace-nowrap shadow-lg"
                >
                  <i className="ri-login-circle-line mr-2"></i>
                  登录
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
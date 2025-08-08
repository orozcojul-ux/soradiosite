
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  user_name: string;
  message: string;
  created_at: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      // Pour l'instant, on simule des messages
      const mockMessages: Message[] = [
        {
          id: '1',
          user_name: 'Sophie',
          message: 'Salut tout le monde ! J\'adore cette radio 🎵',
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          user_name: 'Marc',
          message: 'Le morning show était génial ce matin !',
          created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          user_name: 'Julie',
          message: 'Quelqu\'un connaît le titre qui passait vers 14h ?',
          created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString()
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile) return;

    const message: Message = {
      id: Date.now().toString(),
      user_name: profile.full_name || 'Auditeur',
      message: newMessage.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Ici on pourrait sauvegarder en base de données
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 z-40 cursor-pointer ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-gradient-to-r from-orange-500 to-red-500 hover:scale-110'
        }`}
      >
        <div className="w-6 h-6 flex items-center justify-center text-white text-xl mx-auto">
          <i className={isOpen ? 'ri-close-line' : 'ri-chat-3-line'}></i>
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl z-30 flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-radio-line text-white"></i>
              </div>
              <div>
                <h3 className="font-semibold">Chat SORadio</h3>
                <p className="text-xs opacity-90">En ligne maintenant</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-orange-600">
                    {message.user_name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(message.created_at)}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-sm text-gray-800">
                  {message.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {user ? (
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-100">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  maxLength={200}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <i className="ri-send-plane-fill text-sm"></i>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Connectez-vous pour participer au chat
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

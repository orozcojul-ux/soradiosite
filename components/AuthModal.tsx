
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setCurrentMode(mode);
    setEmail('');
    setPassword('');
    setFullName('');
    setMessage('');
    setLoading(false);
  }, [mode, isOpen]);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage('Veuillez remplir tous les champs.');
      return;
    }

    if (currentMode === 'signup' && !fullName.trim()) {
      setMessage('Veuillez entrer votre nom complet.');
      return;
    }

    if (password.length < 6) {
      setMessage('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (loading) return;

    setLoading(true);
    setMessage('');

    try {
      if (currentMode === 'signup') {
        // INSCRIPTION avec Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim()
            }
          }
        });

        if (authError) {
          console.error('Erreur auth:', authError);
          if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
            setMessage('Cet email est déjà enregistré. Essayez de vous connecter.');
          } else {
            setMessage('Erreur d\'inscription: ' + authError.message);
          }
          setLoading(false);
          return;
        }

        if (authData.user) {
          // Créer le profil directement sans vérification préalable
          // Utiliser upsert pour éviter les conflits de clé unique
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: email.trim().toLowerCase(),
              full_name: fullName.trim(),
              is_admin: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
            .select()
            .single();

          if (profileError) {
            console.error('Erreur profil:', profileError);
            setMessage('Erreur lors de la création du profil: ' + profileError.message);
            setLoading(false);
            return;
          }

          // Succès
          if (profileData) {
            localStorage.setItem('user_session', JSON.stringify(profileData));
            setMessage('Compte créé avec succès !');

            setTimeout(() => {
              setLoading(false);
              onClose();
              window.location.reload();
            }, 1500);
          }
        }

      } else {
        // CONNEXION avec Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password
        });

        if (authError) {
          console.error('Erreur connexion:', authError);
          setMessage('Email ou mot de passe incorrect');
          setLoading(false);
          return;
        }

        if (authData.user) {
          // Récupérer le profil complet
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError || !profileData) {
            console.error('Erreur récupération profil:', profileError);
            setMessage('Erreur lors de la récupération du profil');
            setLoading(false);
            return;
          }

          // Sauvegarder la session localement
          localStorage.setItem('user_session', JSON.stringify(profileData));

          setMessage('Connexion réussie !');

          setTimeout(() => {
            setLoading(false);
            onClose();
            window.location.reload();
          }, 1500);
        }
      }

    } catch (error: any) {
      console.error('Erreur générale:', error);
      setMessage('Une erreur inattendue s\'est produite');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {currentMode === 'login' ? 'Connexion' : 'Inscription'}
          </h2>
          <button
            onClick={() => {
              if (!loading) {
                onClose();
              }
            }}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            disabled={loading}
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {currentMode === 'signup' && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
                placeholder="Votre nom complet"
                required
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
              placeholder="votre@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-sm ${message.includes('succès') || message.includes('réussie') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>
                  {currentMode === 'signup' ? 'Création en cours...' : 'Connexion...'}
                </span>
              </div>
            ) : (
              currentMode === 'login' ? 'Se connecter' : 'Créer le compte'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {currentMode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
          </p>
          <button
            onClick={() => {
              if (!loading) {
                setCurrentMode(currentMode === 'login' ? 'signup' : 'login');
                setMessage('');
              }
            }}
            className="text-orange-500 hover:text-orange-600 font-medium mt-1 cursor-pointer"
            disabled={loading}
          >
            {currentMode === 'login' ? 'Créer un compte' : 'Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
}

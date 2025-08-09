
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onAuthSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, mode, onAuthSuccess }: AuthModalProps) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (currentMode === 'signup') {
        console.log('📝 INSCRIPTION avec nouveau système:', formData.email);

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            }
          }
        });

        if (authError) {
          console.error('❌ Erreur inscription:', authError);
          throw authError;
        }

        if (authData.user) {
          console.log('✅ Inscription réussie:', authData.user.email);
          
          // Le profil sera créé automatiquement par le trigger
          setMessage('✅ Inscription réussie ! Vérifiez vos emails.');

          setTimeout(() => {
            onClose();
            if (onAuthSuccess) onAuthSuccess();
          }, 2000);
        }
      } else {
        console.log('🔑 CONNEXION avec nouveau système:', formData.email);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          console.error('❌ Erreur connexion:', error);
          throw error;
        }

        if (data.user) {
          console.log('✅ CONNEXION RÉUSSIE:', data.user.email);
          setMessage('✅ Connexion réussie !');

          setTimeout(() => {
            onClose();
            if (onAuthSuccess) onAuthSuccess();
          }, 800);
        }
      }
    } catch (error: any) {
      console.error('❌ ERREUR AUTH:', error);

      let errorMessage = 'Erreur inconnue';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'Cet email est déjà utilisé';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Le mot de passe doit faire au moins 6 caractères';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
      } else {
        errorMessage = error.message || 'Erreur de connexion';
      }

      setMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-xl"></i>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-radio-line text-white text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {currentMode === 'login' ? 'Connexion' : 'Inscription'}
          </h2>
          <p className="text-gray-600">
            {currentMode === 'login' 
              ? 'Connectez-vous à SORadio' 
              : 'Créez votre compte SORadio'
            }
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 text-center text-sm ${
            message.includes('✅')
              ? 'bg-green-50 text-green-600 border border-green-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentMode === 'signup' && (
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                placeholder="Votre nom complet"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="votre@email.fr"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{currentMode === 'login' ? 'Connexion...' : 'Inscription...'}</span>
              </div>
            ) : (
              currentMode === 'login' ? 'Se connecter' : 'S\'inscrire'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setCurrentMode(currentMode === 'login' ? 'signup' : 'login');
              setMessage('');
              setFormData({ email: '', password: '', fullName: '' });
            }}
            className="text-orange-600 hover:text-orange-700 font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            {currentMode === 'login' 
              ? 'Pas encore de compte ? Inscrivez-vous' 
              : 'Déjà un compte ? Connectez-vous'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

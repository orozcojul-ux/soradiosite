'use client';

import { supabase } from './supabase';

export interface SiteSettings {
  general: {
    name: string;
    slogan: string;
    frequency: string;
    email: string;
    phone: string;
    address: string;
  };
  streaming: {
    primaryUrl: string;
    backupUrl: string;
    bitrate: string;
    format: string;
    maxListeners: string;
    sourcePassword: string;
  };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    spotify: string;
    tiktok: string;
  };
  email: {
    smtpServer: string;
    smtpPort: string;
    emailUser: string;
    emailPassword: string;
    audienceNotif: boolean;
    techAlerts: boolean;
    newUsers: boolean;
    dailyReports: boolean;
  };
  api: {
    publicKey: string;
    secretKey: string;
    webhookStats: string;
    webhookListeners: string;
  };
  system: {
    maintenanceMode: boolean;
    maintenanceReason: string;
    maintenanceEndTime: string;
  };
}

export const getSettings = async (): Promise<SiteSettings> => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('category, key, value');

    if (error) throw error;

    const settings: any = {
      general: {},
      streaming: {},
      social: {},
      email: {},
      api: {},
      system: {}
    };

    data?.forEach((item) => {
      if (settings[item.category]) {
        // Convertir en boolean pour les champs email et system
        if ((item.category === 'email' && ['audienceNotif', 'techAlerts', 'newUsers', 'dailyReports'].includes(item.key)) ||
            (item.category === 'system' && item.key === 'maintenanceMode')) {
          settings[item.category][item.key] = item.value === 'true';
        } else {
          settings[item.category][item.key] = item.value;
        }
      }
    });

    return settings as SiteSettings;
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    // Retourner des valeurs par défaut en cas d'erreur
    return {
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
        maintenanceReason: 'Maintenance programmée du système',
        maintenanceEndTime: ''
      }
    };
  }
};

export const saveSettings = async (settings: SiteSettings): Promise<boolean> => {
  try {
    const updates: Array<{ category: string; key: string; value: string }> = [];

    // Convertir l'objet settings en format pour la base de données
    Object.entries(settings).forEach(([category, values]) => {
      Object.entries(values).forEach(([key, value]) => {
        updates.push({
          category,
          key,
          value: typeof value === 'boolean' ? value.toString() : value
        });
      });
    });

    // Utiliser upsert pour insérer ou mettre à jour
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        updates.map(update => ({ ...update, updated_at: new Date().toISOString() })),
        { 
          onConflict: 'category,key',
          ignoreDuplicates: false
        }
      );

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error);
    return false;
  }
};

export const toggleMaintenanceMode = async (
  isActive: boolean, 
  reason?: string, 
  endTime?: string
): Promise<boolean> => {
  try {
    const updates = [
      {
        category: 'system',
        key: 'maintenanceMode',
        value: isActive.toString(),
        updated_at: new Date().toISOString()
      }
    ];

    if (reason) {
      updates.push({
        category: 'system',
        key: 'maintenanceReason',
        value: reason,
        updated_at: new Date().toISOString()
      });
    }

    if (endTime) {
      updates.push({
        category: 'system',
        key: 'maintenanceEndTime',
        value: endTime,
        updated_at: new Date().toISOString()
      });
    }

    const { error } = await supabase
      .from('site_settings')
      .upsert(updates, { 
        onConflict: 'category,key',
        ignoreDuplicates: false
      });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Erreur lors du changement du mode maintenance:', error);
    return false;
  }
};

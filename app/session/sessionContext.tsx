import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';

type SessionContextType = {
  session: Session | null;
  loading: boolean;
  authenticating: boolean;  // Nouveau state pour vérifier si on est en train d'authentifier
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
  authenticating: true,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(true); // Gère l'état d'authentification

  useEffect(() => {
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, sessionData) => {
        try {
          console.log("Changement d'état d'authentification:", _event);
          if (sessionData) {
            console.log("Session mise à jour:", sessionData);
            await AsyncStorage.setItem('session', JSON.stringify(sessionData));
            setSession(sessionData);
          } else {
            console.log("Pas de session, nettoyage d'AsyncStorage");
            await AsyncStorage.removeItem('session');
            setSession(null);
          }
          setLoading(false);
        } catch (error) {
          console.error("Erreur lors du changement d'état d'authentification:", error);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function checkSession() {
    try {
      console.log("Vérification de la session...");
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Erreur lors de la récupération de la session:", error);
        throw error;
      }

      if (data?.session) {
        console.log("Session trouvée:", data.session);
        await AsyncStorage.setItem('session', JSON.stringify(data.session));
        setSession(data.session);
      } else {
        console.log("Aucune session active trouvée");
        // Vérifier la session stockée avant de l'effacer
        const storedSession = await AsyncStorage.getItem('session');
        if (storedSession) {
          try {
            const parsedSession = JSON.parse(storedSession);
            if (parsedSession?.access_token) {
              // Vérifier si le token est toujours valide
              const { data: { user }, error: userError } = await supabase.auth.getUser(parsedSession.access_token);
              
              if (!userError && user) {
                console.log("Session stockée valide, utilisation de cette session");
                setSession(parsedSession);
                return;
              } else {
                console.log("Session stockée invalide, suppression");
              }
            }
          } catch (e) {
            console.error("Erreur lors de la lecture de la session stockée:", e);
          }
        }
        await AsyncStorage.removeItem('session');
        setSession(null);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la session:', error);
    } finally {
      setAuthenticating(false);
      setLoading(false);
    }
  }

  return (
    <SessionContext.Provider value={{ session, loading, authenticating }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

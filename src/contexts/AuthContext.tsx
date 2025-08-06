import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { loadDataFromSupabase, syncDataToSupabase, clearLocalData } from '@/lib/data-manager';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext: useEffect started.");
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session: Session | null) => {
        console.log(`AuthContext: onAuthStateChange event: ${_event}, session available: ${!!session}`);
        
        if (session?.user) {
          const currentUser = { id: session.user.id, email: session.user.email! };
          setUser(currentUser);
          console.log("AuthContext: User state set:", currentUser);

          // Запускаем загрузку данных в фоновом режиме, не блокируя UI
          if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
            console.log("AuthContext: Triggering non-blocking data load.");
            loadDataFromSupabase(session.user);
          }
        } else {
          setUser(null);
          console.log("AuthContext: User state set to null.");
          if (_event === 'SIGNED_OUT') {
            console.log("AuthContext: Clearing local data due to SIGNED_OUT.");
            clearLocalData();
          }
        }

        // Важно: убираем состояние загрузки СРАЗУ ПОСЛЕ проверки сессии.
        // Это позволит отобразить UI, не дожидаясь ответа от loadDataFromSupabase.
        setLoading(false);
        console.log("AuthContext: setLoading(false). UI should now be unblocked.");
      }
    );

    return () => {
      console.log("AuthContext: useEffect cleanup, unsubscribing from auth state changes.");
      subscription.unsubscribe();
    };
  }, []);

  const register = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    console.log("AuthContext: Attempting to register user:", email);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("AuthContext: Registration error:", error.message);
      return { success: false, message: 'Ошибка регистрации: ' + error.message };
    }
    if (data.user) {
      console.log("AuthContext: User registered, syncing initial data.");
      await syncDataToSupabase(false);
    }
    console.log("AuthContext: Registration successful.");
    return { success: true };
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    console.log("AuthContext: Attempting to log in user:", email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("AuthContext: Login error:", error.message);
      return { success: false, message: 'Ошибка входа: ' + error.message };
    }
    console.log("AuthContext: Login successful.");
    return { success: true };
  };

  const logout = async () => {
    console.log("AuthContext: Attempting to log out user.");
    await supabase.auth.signOut();
    console.log("AuthContext: Logout initiated.");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {/* Убрано !loading, чтобы дочерние компоненты могли управлять своим состоянием загрузки */}
      {children}
    </AuthContext.Provider>
  );
};

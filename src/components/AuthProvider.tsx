'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  points: number;
  isAdmin?: boolean;
  predictions?: {
    champion: string;
    runnerUp: string;
    thirdPlace: string;
    submittedAt: string;
  };
  photoURL?: string;
  country?: string;
  streak?: { type: 'exact' | 'winner' | null; count: number };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const creatingProfile = useRef(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
  // Enlazar datos del perfil del usuario de Firestore en tiempo real
        const userRef = doc(db, 'users', firebaseUser.uid);

        const unsubscribeProfile = onSnapshot(userRef,
          async (docSnap) => {
          if (docSnap.exists()) {
            creatingProfile.current = false;
            setProfile(docSnap.data() as UserProfile);
            setLoading(false);
          } else if (!creatingProfile.current) {
            creatingProfile.current = true;
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario Sin Nombre',
              email: firebaseUser.email || '',
              points: 0,
              isAdmin: false,
              photoURL: firebaseUser.photoURL || '',
              country: '',
            };
            try {
              await setDoc(userRef, { ...newProfile, joinedAt: new Date().toISOString(), welcomeSeen: false });

              // Registrar en el feed de actividad
              try {
                await addDoc(collection(db, 'history'), {
                  userId: firebaseUser.uid,
                  userName: newProfile.name,
                  userPhoto: newProfile.photoURL || null,
                  message: `🎉 ${newProfile.name} se unió a la PollaMax`,
                  timestamp: new Date().toISOString(),
                });
              } catch (e) {
                console.error('Error creating history entry:', e);
              }
            } catch (e) {
              console.error('Error creating user profile:', e);
            }

            setProfile(newProfile);
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error reading user profile:', error);
          setProfile(null);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

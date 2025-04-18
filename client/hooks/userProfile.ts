import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface Profile {
  nickname: string;
  bio: string;
  dateOfBirth: Date;
  weight: string;
  height: string;
  dietaryRestrictions: string[];
  hasMedicalConditions: boolean;
  medicalConditions: Array<{
    condition: string;
    medication: string;
    duration: string;
  }>;
  substanceUse: {
    alcohol: boolean;
    smoking: boolean;
    other: string;
  };
  allergies: string[];
  connectedApps: string[];
  profileImage?: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Convert Firestore Timestamp to Date
          setProfile({
            ...data,
            dateOfBirth: data.dateOfBirth?.toDate() || new Date(),
          } as Profile);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, updates);
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return { profile, loading, error, updateProfile };
}
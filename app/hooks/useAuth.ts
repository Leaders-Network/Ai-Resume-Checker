import { useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';

const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const localUser = localStorage.getItem('user');
        if (!localUser) {
          signOut(auth).then(() => {
            window.location.replace('/signin');
          });
          return;
        }
        setUser(localUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      localStorage.setItem('user', user.uid);
      setUser(user.uid);
    } catch (error) {
      console.error(error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      localStorage.setItem('user', user.uid);
      setUser(user.uid);
    } catch (error) {
      console.error(error);
    }
  };

  return { user, loading, signUp, signIn };
};

export default useAuth;
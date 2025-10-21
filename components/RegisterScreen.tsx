// Contributors:
//  Luke Arvey - 3 Hours
//  Ridley Wills - 3 Hours
//  Tristan Van - 3 Hours

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import type { User } from '../src/App';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import app from '../src/firebaseConfig';

interface RegisterScreenProps {
  onRegister?: (user: User) => void;
}

export function RegisterScreen({ onRegister }: RegisterScreenProps) {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'reviewer'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleRegister = async () => {
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const u = res.user;
      const userDoc = {
        id: u.uid,
        name: name || (u.email?.split('@')[0] ?? ''),
        email: u.email,
        role: role,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', u.uid), userDoc);

      const userObj: User = {
        id: u.uid,
        name: userDoc.name,
        email: userDoc.email ?? '',
        type: role,
      };
      onRegister?.(userObj);
      // navigate to proper dashboard
      if (role === 'reviewer') navigate('/reviewer');
      else navigate('/student');
    } catch (err) {
      setError((err as Error).message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div>
              <Label>Account type</Label>
              <div className="flex gap-2 mt-2">
                <Button variant={role === 'student' ? 'default' : 'ghost'} onClick={() => setRole('student')}>Student</Button>
                <Button variant={role === 'reviewer' ? 'default' : 'ghost'} onClick={() => setRole('reviewer')}>Reviewer</Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleRegister} disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
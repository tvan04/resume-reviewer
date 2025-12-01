import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import type { User } from '../src/App';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '../src/firebaseConfig';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, 'users', res.user.uid);
      const userSnap = await getDoc(userRef);
      let name: string;
      let role: 'student' | 'reviewer' = 'student';
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (typeof data.name === 'string' && data.name.trim() !== '') {
          name = data.name;
        } else {
          // fallback: use email prefix if name missing/empty
          name = res.user.email?.split('@')[0] ?? '';
        }
        if (data.role === 'reviewer' || data.role === 'student') role = data.role;
      } else {
        // fallback: use email prefix if no user doc
        name = res.user.email?.split('@')[0] ?? '';
      }
      const userObj: User = {
        id: res.user.uid,
        name,
        email: res.user.email ?? '',
        type: role,
      };
      onLogin(userObj);
      navigate(role === 'reviewer' ? '/reviewer' : '/student');
    } catch (err) {
      setError((err as Error).message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your email and password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div>
              <label>Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label>Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleLogin} disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/register')}>
                Register
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

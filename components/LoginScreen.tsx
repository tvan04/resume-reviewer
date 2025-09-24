import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User } from '../src/App';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (userType: 'student' | 'reviewer') => {
    setIsLoading(true);
    
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock authentication - in real app, this would validate credentials
    const mockUser: User = {
      id: userType === 'student' ? 'student1' : 'reviewer1',
      name: userType === 'student' ? 'John Doe' : 'John Smith',
      email: email || (userType === 'student' ? 'john.doe@vanderbilt.edu' : 'john.smith@vanderbilt.edu'),
      type: userType
    };
    
    onLogin(mockUser);
    setIsLoading(false);
  };

  const handleDemoLogin = (userType: 'student' | 'reviewer') => {
    const mockUser: User = {
      id: userType === 'student' ? 'student1' : 'reviewer1',
      name: userType === 'student' ? 'John Doe' : 'John Smith',
      email: userType === 'student' ? 'john.doe@vanderbilt.edu' : 'john.smith@vanderbilt.edu',
      type: userType
    };
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vanderbilt Resume Reviewer
          </h1>
          <p className="text-gray-600">
            Streamline your resume review process
          </p>
        </div>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="student">Student Login</TabsTrigger>
            <TabsTrigger value="reviewer">Reviewer Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle>Student Portal</CardTitle>
                <CardDescription>
                  Access your resume submissions and feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="student-email">Vanderbilt Email</label>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="your.name@vanderbilt.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="student-password">Password</label>
                  <Input
                    id="student-password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline"
                  onClick={() => handleLogin('student')}
                  disabled={isLoading}
                  className="w-full"
                >
                  Log In With SSO
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleDemoLogin('student')}
                  className="w-full"
                >
                  Demo as Student
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviewer">
            <Card>
              <CardHeader>
                <CardTitle>Reviewer Portal</CardTitle>
                <CardDescription>
                  Career Center staff access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="reviewer-email">Staff Email</label>
                  <Input
                    id="reviewer-email"
                    type="email"
                    placeholder="staff@vanderbilt.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="reviewer-password">Password</label>
                  <Input
                    id="reviewer-password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline"
                  onClick={() => handleLogin('reviewer')}
                  disabled={isLoading}
                  className="w-full"
                >
                  Log In With SSO
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleDemoLogin('reviewer')}
                  className="w-full"
                >
                  Demo as Reviewer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Secure authentication powered by Vanderbilt SSO</p>
        </div>
      </div>
    </div>
  );
}
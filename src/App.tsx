import React, { useState } from 'react';
import { StudentDashboard } from '../components/StudentDashboard';
import { ReviewerDashboard } from '../components/ReviewerDashboard';
import { LoginScreen } from '../components/LoginScreen';
import { UploadScreen } from '../components/UploadScreen';
import { ReviewScreen } from '../components/ReviewScreen';
import { ResumeViewScreen } from '../components/ResumeViewScreen';
import { AccountScreen } from '../components/AccountScreen';
import './App.css';

export type UserType = 'student' | 'reviewer' | null;

export type Screen = 
  | 'login'
  | 'studentDashboard'
  | 'reviewerDashboard'
  | 'upload'
  | 'review'
  | 'resumeView'
  | 'account';

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
}

export interface Resume {
  id: string;
  fileName: string;
  studentId: string;
  studentName: string;
  uploadDate: string;
  status: 'pending' | 'in-review' | 'reviewed' | 'approved';
  reviewerId?: string;
  reviewerName?: string;
  comments: Comment[];
  version: number;
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  resolved: boolean;
  replies: Reply[];
}

export interface Reply {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  // Mock data for demonstration
  const [resumes, setResumes] = useState<Resume[]>([
    {
      id: '1',
      fileName: 'John_Doe_Resume_v1.pdf',
      studentId: 'student1',
      studentName: 'John Doe',
      uploadDate: '2025-01-01T12:00:00Z',
      status: 'pending',
      comments: [],
      version: 1
    },
    {
      id: '2',
      fileName: 'John_Doe_Resume_v2.pdf',
      studentId: 'student1',
      studentName: 'John Doe',
      uploadDate: '2025-01-02T10:30:00Z',
      status: 'in-review',
      reviewerId: 'reviewer1',
      reviewerName: 'John Smith',
      comments: [
        {
          id: 'c1',
          text: 'Consider adding more specific metrics to your achievements.',
          authorId: 'reviewer1',
          authorName: 'John Smith',
          createdAt: '2025-01-02T14:00:00Z',
          resolved: false,
          replies: []
        }
      ],
      version: 2
    },
    {
      id: '3',
      fileName: 'Jane_Smith_Resume.pdf',
      studentId: 'student2',
      studentName: 'Jane Smith',
      uploadDate: '2025-01-03T09:15:00Z',
      status: 'reviewed',
      reviewerId: 'reviewer1',
      reviewerName: 'John Smith',
      comments: [
        {
          id: 'c2',
          text: 'Great work on the formatting! This looks professional.',
          authorId: 'reviewer1',
          authorName: 'John Smith',
          createdAt: '2025-01-03T11:00:00Z',
          resolved: true,
          replies: [
            {
              id: 'r1',
              text: 'Thank you for the feedback!',
              authorId: 'student2',
              authorName: 'Jane Smith',
              createdAt: '2025-01-03T11:30:00Z'
            }
          ]
        }
      ],
      version: 1
    }
  ]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.type === 'student') {
      setCurrentScreen('studentDashboard');
    } else {
      setCurrentScreen('reviewerDashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('login');
    setSelectedResumeId(null);
  };

  const handleNavigation = (screen: Screen, resumeId?: string) => {
    setCurrentScreen(screen);
    if (resumeId) {
      setSelectedResumeId(resumeId);
    }
  };

  const handleResumeUpload = (resumeData: Omit<Resume, 'id' | 'uploadDate' | 'version'>) => {
    const newResume: Resume = {
      ...resumeData,
      id: Date.now().toString(),
      uploadDate: new Date().toISOString(),
      version: 1
    };
    setResumes(prev => [...prev, newResume]);
  };

  const handleCommentAdd = (resumeId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'replies'>) => {
    setResumes(prev => prev.map(resume => {
      if (resume.id === resumeId) {
        const newComment: Comment = {
          ...comment,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          replies: []
        };
        return {
          ...resume,
          comments: [...resume.comments, newComment]
        };
      }
      return resume;
    }));
  };

  const handleStatusUpdate = (resumeId: string, status: Resume['status']) => {
    setResumes(prev => prev.map(resume => 
      resume.id === resumeId ? { ...resume, status } : resume
    ));
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} />;
      
      case 'studentDashboard':
        return (
          <StudentDashboard
            user={currentUser!}
            resumes={resumes.filter(r => r.studentId === currentUser?.id)}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
          />
        );
      
      case 'reviewerDashboard':
        return (
          <ReviewerDashboard
            user={currentUser!}
            resumes={resumes}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
          />
        );
      
      case 'upload':
        return (
          <UploadScreen
            user={currentUser!}
            onUpload={handleResumeUpload}
            onNavigate={handleNavigation}
          />
        );
      
      case 'review':
        const resumeToReview = resumes.find(r => r.id === selectedResumeId);
        return resumeToReview ? (
          <ReviewScreen
            user={currentUser!}
            resume={resumeToReview}
            onAddComment={handleCommentAdd}
            onStatusUpdate={handleStatusUpdate}
            onNavigate={handleNavigation}
          />
        ) : (
          <div>Resume not found</div>
        );
      
      case 'resumeView':
        const resumeToView = resumes.find(r => r.id === selectedResumeId);
        return resumeToView ? (
          <ResumeViewScreen
            user={currentUser!}
            resume={resumeToView}
            onNavigate={handleNavigation}
          />
        ) : (
          <div>Resume not found</div>
        );
      
      case 'account':
        return (
          <AccountScreen
            user={currentUser!}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
          />
        );
      
      default:
        return <div>Screen not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {renderScreen()}
    </div>
  );
}
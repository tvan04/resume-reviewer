// Contributors:
//  Luke Arvey - 2 Hours
//  Ridley Wills - 3 Hours
//  Tristan Van - 5 Hours

import React, { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import { StudentDashboard } from "../components/StudentDashboard";
import { ReviewerDashboard } from "../components/ReviewerDashboard";
import { LoginScreen } from "../components/LoginScreen";
import { UploadScreen } from "../components/UploadScreen";
import { ReviewScreen } from "../components/ReviewScreen";
import { ResumeViewScreen } from "../components/ResumeViewScreen";
import { AccountScreen } from "../components/AccountScreen";
import { RegisterScreen } from "../components/RegisterScreen";
import { Timestamp } from "firebase/firestore";
import "./App.css";

export type UserType = "student" | "reviewer" | null;

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
  uploadDate: string | Timestamp;
  status: "pending" | "in-review" | "reviewed" | "approved";
  reviewerId?: string;
  reviewerName?: string;
  sharedWithIds?: string[];
  comments: Comment[];
  version: number;
  downloadURL: string;
  storagePath: string;

  sharedWith?: {
    id: string;
    name: string;
  }[];
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleResumeUpload = (
    resumeData: Omit<Resume, "id" | "uploadDate" | "version">
  ) => {
    const newResume: Resume = {
      ...resumeData,
      id: Date.now().toString(),
      uploadDate: new Date().toISOString(),
      version: 1,
    };
    setResumes((prev) => [...prev, newResume]);
  };

  const handleCommentAdd = (
    resumeId: string,
    comment: Omit<Comment, "id" | "createdAt" | "replies">
  ) => {
    setResumes((prev) =>
      prev.map((resume) => {
        if (resume.id === resumeId) {
          const newComment: Comment = {
            ...comment,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            replies: [],
          };
          return {
            ...resume,
            comments: [...resume.comments, newComment],
          };
        }
        return resume;
      })
    );
  };

  const handleStatusUpdate = (resumeId: string, status: Resume["status"]) => {
    setResumes((prev) =>
      prev.map((resume) =>
        resume.id === resumeId ? { ...resume, status } : resume
      )
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Routes>
        <Route path="/login" element={<LoginScreen onLogin={handleLogin} />} />

        <Route
          path="/register"
          element={<RegisterScreen onRegister={handleLogin} />}
        />

        <Route
          path="/student"
          element={
            currentUser?.type === "student" ? (
              <StudentDashboard
                user={currentUser}
                resumes={resumes.filter((r) => r.studentId === currentUser.id)}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/reviewer"
          element={
            currentUser?.type === "reviewer" ? (
              <ReviewerDashboard
                user={currentUser}
                resumes={resumes}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/upload"
          element={
            currentUser ? (
              <UploadScreen user={currentUser} onUpload={handleResumeUpload} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/review/:id"
          element={
            <ReviewWrapper
              currentUser={currentUser}
              resumes={resumes}
              onAddComment={handleCommentAdd}
              onStatusUpdate={handleStatusUpdate}
            />
          }
        />

        <Route
          path="/resume/:id"
          element={
            <ResumeViewWrapper currentUser={currentUser} resumes={resumes} />
          }
        />

        <Route
          path="/account"
          element={
            currentUser ? (
              <AccountScreen user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

/** Helper wrapper for /review/:id */
function ReviewWrapper({
  currentUser,
  resumes,
  onAddComment,
  onStatusUpdate,
}: {
  currentUser: User | null;
  resumes: Resume[];
  onAddComment: (
    id: string,
    comment: Omit<Comment, "id" | "createdAt" | "replies">
  ) => void;
  onStatusUpdate: (id: string, status: Resume["status"]) => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <ReviewScreen
      user={currentUser}
      onAddComment={onAddComment}
      onStatusUpdate={onStatusUpdate}
    />
  );
}

/** Helper wrapper for /resume/:id */
function ResumeViewWrapper({
  currentUser,
  resumes,
}: {
  currentUser: User | null;
  resumes: Resume[];
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!currentUser) return <Navigate to="/login" replace />;

  return <ResumeViewScreen user={currentUser} resumes={resumes} />;
}

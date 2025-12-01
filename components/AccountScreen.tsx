import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from './Navigation';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
  User as UserIcon,
  Shield, 
  Trash2,
  ArrowLeft,
  Save,
  Settings
} from 'lucide-react';
import { User } from '../src/App';
import app from '../src/firebaseConfig';
import { getFirestore, doc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, updatePassword, deleteUser } from 'firebase/auth';

interface AccountScreenProps {
  user: User;
  onLogout: () => void;
  onUserUpdate?: (user: User) => void; // <-- add this
}

export function AccountScreen({ user, onLogout, onUserUpdate }: AccountScreenProps) {
  const navigate = useNavigate();
  const db = getFirestore(app);
  const auth = getAuth(app);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- Statistics state ---
  const [stats, setStats] = useState({
    resumesSubmitted: 0,      // student: resumes submitted
    resumesApproved: 0,       // student: resumes approved
    commentsReceived: 0,      // student: comments from reviewers
    resumesReceived: 0,       // reviewer: resumes assigned to them
    resumesApprovedByReviewer: 0, // reviewer: resumes they approved
    commentsReceivedFromStudents: 0, // reviewer: comments from students (replies)
  });

  // --- Password change modal state ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // --- Save profile changes (name only) ---
  const handleSave = async () => {
    setIsEditing(false);
    try {
      await updateDoc(doc(db, 'users', user.id), { name: editedUser.name });
      onUserUpdate?.({ ...user, name: editedUser.name });

      if (user.type === 'student') {
        // Update studentName in all their resumes
        const q = query(collection(db, 'resumes'), where('studentId', '==', user.id));
        const snap = await getDocs(q);
        const updates: Promise<void>[] = [];
        snap.forEach((resumeDoc) => {
          // Update studentName
          updates.push(updateDoc(resumeDoc.ref, { studentName: editedUser.name }));
          // Update replies' authorName if any replies from this student
          const data = resumeDoc.data();
          if (Array.isArray(data.comments)) {
            let changed = false;
            const updatedComments = data.comments.map((c: any) => {
              if (Array.isArray(c.replies)) {
                let repliesChanged = false;
                const updatedReplies = c.replies.map((r: any) => {
                  if (r.authorId === user.id && r.authorName !== editedUser.name) {
                    repliesChanged = true;
                    changed = true;
                    return { ...r, authorName: editedUser.name };
                  }
                  return r;
                });
                if (repliesChanged) {
                  return { ...c, replies: updatedReplies };
                }
              }
              return c;
            });
            if (changed) {
              updates.push(updateDoc(resumeDoc.ref, { comments: updatedComments }));
            }
          }
        });
        await Promise.all(updates);
      } else if (user.type === 'reviewer') {
        // Update authorName in all comments authored by this reviewer
        const q = query(collection(db, 'resumes'), where('sharedWithIds', 'array-contains', user.id));
        const snap = await getDocs(q);
        const updates: Promise<void>[] = [];
        snap.forEach((resumeDoc) => {
          const data = resumeDoc.data();
          if (Array.isArray(data.comments)) {
            let changed = false;
            const updatedComments = data.comments.map((c: any) => {
              let commentChanged = false;
              // Update comment authorName
              let updatedComment = c;
              if (c.authorId === user.id && c.authorName !== editedUser.name) {
                updatedComment = { ...c, authorName: editedUser.name };
                commentChanged = true;
                changed = true;
              }
              // Update replies authored by this reviewer
              if (Array.isArray(c.replies)) {
                let repliesChanged = false;
                const updatedReplies = c.replies.map((r: any) => {
                  if (r.authorId === user.id && r.authorName !== editedUser.name) {
                    repliesChanged = true;
                    changed = true;
                    return { ...r, authorName: editedUser.name };
                  }
                  return r;
                });
                if (repliesChanged) {
                  updatedComment = { ...updatedComment, replies: updatedReplies };
                  commentChanged = true;
                }
              }
              return commentChanged ? updatedComment : c;
            });
            if (changed) {
              updates.push(updateDoc(resumeDoc.ref, { comments: updatedComments }));
            }
          }
        });
        await Promise.all(updates);
      }
    } catch (err) {
      alert('Failed to update profile.');
    }
  };

  // --- Change password ---
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setPasswordSuccess('Password updated successfully.');
        setShowPasswordModal(false);
        setNewPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    }
  };

  // --- Delete account ---
  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    try {
      // If student, delete all their resumes
      if (user.type === 'student') {
        const q = query(collection(db, 'resumes'), where('studentId', '==', user.id));
        const snap = await getDocs(q);
        const batchDeletes: Promise<void>[] = [];
        snap.forEach((resumeDoc) => {
          batchDeletes.push(deleteDoc(resumeDoc.ref));
        });
        await Promise.all(batchDeletes);
      }
      // Delete user doc from Firestore
      await deleteDoc(doc(db, 'users', user.id));
      // Delete user from Auth
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }
      onLogout();
      navigate('/login');
    } catch (err) {
      alert('Failed to delete account. Please re-login and try again.');
    }
  };

  // --- Fetch statistics ---
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      if (user.type === 'student') {
        const q = query(collection(db, 'resumes'), where('studentId', '==', user.id));
        const snap = await getDocs(q);
        let resumesSubmitted = 0, resumesApproved = 0, commentsReceived = 0;
        snap.forEach(doc => {
          resumesSubmitted++;
          const data = doc.data();
          if (data.status === 'approved') resumesApproved++;
          if (Array.isArray(data.comments)) {
            // Only count comments from reviewers (not student themselves)
            commentsReceived += data.comments.filter((c: any) => c.authorId !== user.id).length;
          }
        });
        setStats({
          resumesSubmitted,
          resumesApproved,
          commentsReceived,
          resumesReceived: 0,
          resumesApprovedByReviewer: 0,
          commentsReceivedFromStudents: 0,
        });
      } else if (user.type === 'reviewer') {
        const q = query(collection(db, 'resumes'), where('sharedWithIds', 'array-contains', user.id));
        const snap = await getDocs(q);
        let resumesReceived = 0, resumesApprovedByReviewer = 0, commentsReceivedFromStudents = 0;
        snap.forEach(doc => {
          resumesReceived++;
          const data = doc.data();
          if (data.status === 'approved') resumesApprovedByReviewer++;
          if (Array.isArray(data.comments)) {
            // Count replies from students to this reviewer's comments
            data.comments.forEach((c: any) => {
              if (Array.isArray(c.replies)) {
                commentsReceivedFromStudents += c.replies.filter((r: any) => r.authorId !== user.id).length;
              }
            });
          }
        });
        setStats({
          resumesSubmitted: 0,
          resumesApproved: 0,
          commentsReceived: 0,
          resumesReceived,
          resumesApprovedByReviewer,
          commentsReceivedFromStudents,
        });
      }
    };
    fetchStats();
  }, [db, user]);

  // remove custom onNavigate usage — use react-router directly
  const goToDashboard = () => {
    if (user.type === 'reviewer') navigate('/reviewer');
    else navigate('/student');
  };

  return (
    <div className="min-h-screen bg-white">
      <NavigationBar 
        user={user} 
        onLogout={onLogout} 
      />
      
      <div className="px-[79px] pt-[20px] pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={goToDashboard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-black">Account Settings</h1>
              <p className="text-lg text-gray-600">Manage your profile and preferences</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      Profile Information
                    </CardTitle>
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave}>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={editedUser.name}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedUser.email}
                        disabled // Email editing disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Account Type</Label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium capitalize">
                        {user.type === 'student' ? 'Student' : 'Career Center Reviewer'}
                      </span>
                      {user.type === 'reviewer' && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Staff
                        </span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Account Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {user.type === 'student' ? (
                        <>
                          <div className="text-center p-4 bg-blue-50 rounded">
                            <div className="text-2xl font-bold text-blue-600">{stats.resumesSubmitted}</div>
                            <div className="text-sm text-gray-600">Resumes Submitted</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded">
                            <div className="text-2xl font-bold text-green-600">{stats.resumesApproved}</div>
                            <div className="text-sm text-gray-600">Resumes Approved</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded">
                            <div className="text-2xl font-bold text-orange-600">{stats.commentsReceived}</div>
                            <div className="text-sm text-gray-600">Comments Received</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-center p-4 bg-blue-50 rounded">
                            <div className="text-2xl font-bold text-blue-600">{stats.resumesReceived}</div>
                            <div className="text-sm text-gray-600">Resumes Received</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded">
                            <div className="text-2xl font-bold text-green-600">{stats.resumesApprovedByReviewer}</div>
                            <div className="text-sm text-gray-600">Resumes Approved</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded">
                            <div className="text-2xl font-bold text-orange-600">{stats.commentsReceivedFromStudents}</div>
                            <div className="text-sm text-gray-600">Comments Received</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Resume files are only accessible to you and assigned reviewers.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <h3 className="font-medium">Access Control</h3>
                    <p className="text-sm text-gray-600">
                      You can control who has access to your resumes. Only authorized career center 
                      staff can be assigned as reviewers.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded">
                      <h4 className="font-medium mb-2">Current Permissions</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Career Center staff can view assigned resumes</li>
                        <li>• You can revoke access at any time</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <p className="font-medium">Change Password</p>
                        <p className="text-sm text-gray-600">
                          Update your credentials
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!showDeleteConfirm ? (
                      <div className="flex items-center justify-between p-4 border border-red-200 rounded">
                        <div>
                          <p className="font-medium text-red-600">Delete Account</p>
                          <p className="text-sm text-gray-600">
                            Permanently delete your account and all data
                          </p>
                        </div>
                        <Button 
                          variant="destructive"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    ) : (
                      <Alert className="border-red-200">
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-600">
                          <div className="space-y-4">
                            <p className="font-medium">Are you sure you want to delete your account?</p>
                            <p className="text-sm">
                              This action cannot be undone. All your resumes, comments, and data will be permanently deleted.
                            </p>
                            <div className="flex gap-2">
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={handleDeleteAccount}
                              >
                                Yes, Delete Account
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowDeleteConfirm(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            <input
              type="password"
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            {passwordError && <div className="text-red-600 text-sm mb-2">{passwordError}</div>}
            {passwordSuccess && <div className="text-green-600 text-sm mb-2">{passwordSuccess}</div>}
            <div className="flex gap-2 mt-4">
              <Button onClick={handleChangePassword}>Update</Button>
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
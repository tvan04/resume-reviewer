import { useState } from 'react';
import { Navigation } from './Navigation';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
  User as UserIcon, 
  Bell, 
  Shield, 
  Download,
  Trash2,
  ArrowLeft,
  Save,
  Settings
} from 'lucide-react';
import { User, Screen } from '../src/App';

interface AccountScreenProps {
  user: User;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

export function AccountScreen({ user, onNavigate, onLogout }: AccountScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [notifications, setNotifications] = useState({
    emailOnNewComment: true,
    emailOnStatusChange: true,
    emailOnApproval: true,
    pushNotifications: false
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    // In real app, this would make API call to update user
    setIsEditing(false);
    // Show success message
  };

  const handleDeleteAccount = () => {
    // In real app, this would make API call to delete account
    setShowDeleteConfirm(false);
    onLogout();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation user={user} onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="px-[79px] pt-[212px] pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => onNavigate(user.type === 'student' ? 'studentDashboard' : 'reviewerDashboard')}
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
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
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
                        onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
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
                            <div className="text-2xl font-bold text-blue-600">3</div>
                            <div className="text-sm text-gray-600">Resumes Uploaded</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded">
                            <div className="text-2xl font-bold text-green-600">1</div>
                            <div className="text-sm text-gray-600">Approved Resumes</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded">
                            <div className="text-2xl font-bold text-orange-600">5</div>
                            <div className="text-sm text-gray-600">Comments Received</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-center p-4 bg-blue-50 rounded">
                            <div className="text-2xl font-bold text-blue-600">15</div>
                            <div className="text-sm text-gray-600">Resumes Reviewed</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded">
                            <div className="text-2xl font-bold text-green-600">12</div>
                            <div className="text-sm text-gray-600">Approved</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded">
                            <div className="text-2xl font-bold text-orange-600">23</div>
                            <div className="text-sm text-gray-600">Comments Added</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Email Notifications</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Comments</p>
                        <p className="text-sm text-gray-600">
                          Get notified when reviewers add comments to your resume
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailOnNewComment}
                        onCheckedChange={(checked: boolean) => 
                          setNotifications(prev => ({ ...prev, emailOnNewComment: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Status Changes</p>
                        <p className="text-sm text-gray-600">
                          Get notified when your resume status changes
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailOnStatusChange}
                        onCheckedChange={(checked: boolean) => 
                          setNotifications(prev => ({ ...prev, emailOnStatusChange: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Resume Approvals</p>
                        <p className="text-sm text-gray-600">
                          Get notified when your resume is approved
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailOnApproval}
                        onCheckedChange={(checked: boolean) => 
                          setNotifications(prev => ({ ...prev, emailOnApproval: checked }))
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Push Notifications</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Browser Notifications</p>
                        <p className="text-sm text-gray-600">
                          Receive instant notifications in your browser
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked: boolean) => 
                          setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                        }
                      />
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
                      Your data is protected by Vanderbilt's security policies. Resume files are encrypted 
                      and only accessible to you and assigned reviewers.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <h3 className="font-medium">Data Management</h3>
                    
                    <div className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <p className="font-medium">Download Your Data</p>
                        <p className="text-sm text-gray-600">
                          Export all your resumes and feedback
                        </p>
                      </div>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <Separator />

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
                        <li>• All access is logged for security</li>
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
                          Update your Vanderbilt credentials
                        </p>
                      </div>
                      <Button variant="outline">
                        Change Password
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600">
                          Add an extra layer of security
                        </p>
                      </div>
                      <Button variant="outline">
                        Enable 2FA
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
    </div>
  );
}
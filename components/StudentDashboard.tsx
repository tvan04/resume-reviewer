import { Navigation } from './Navigation';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { User, Resume, Screen } from '../src/App';
import { ImageWithFallback } from './ImageWithFallback';

interface StudentDashboardProps {
  user: User;
  resumes: Resume[];
  onNavigate: (screen: Screen, resumeId?: string) => void;
  onLogout: () => void;
}

export function StudentDashboard({ user, resumes, onNavigate, onLogout }: StudentDashboardProps) {
  const getStatusIcon = (status: Resume['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in-review':
        return <AlertCircle className="w-4 h-4" />;
      case 'reviewed':
        return <CheckCircle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Resume['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-review':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const yourResumes = resumes.filter(r => r.status === 'pending');
  const submittedResumes = resumes.filter(r => r.status === 'in-review');
  const reviewedResumes = resumes.filter(r => ['reviewed', 'approved'].includes(r.status));

  return (
    <div className="min-h-screen bg-white">
      <Navigation user={user} onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="px-[79px] pt-[20px] pb-16">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-[64px] font-bold text-black tracking-[-1.28px] leading-normal mb-6">
            Welcome, {user.name}
          </h1>
          
          <div className="flex gap-4 mb-8">
            <Button
              variant="secondary" 
              onClick={() => onNavigate('upload')}
              className="bg-[#e6e6e6] text-black px-6 py-3 text-2xl"
            >
              Build Resume from Template
            </Button>
            <Button 
              variant="secondary"
              className="bg-[#e6e6e6] text-black px-6 py-3 text-2xl"
            >
              Print Uploaded Resume
            </Button>
          </div>
        </div>

        {/* Your Resumes Section */}
        <section className="mb-16">
          <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
            Your Resumes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {yourResumes.map((resume) => (
              <Card 
                key={resume.id}
                className="cursor-pointer hover:shadow-lg transition-shadow border border-black"
                onClick={() => onNavigate('resumeView', resume.id)}
              >
                <CardContent className="p-0">
                  <div className="h-64 bg-gray-100 border-b border-black flex items-center justify-center">
                    <ImageWithFallback
                      src="/placeholder-resume.png"
                      alt={resume.fileName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-sm truncate">{resume.fileName}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatDate(resume.uploadDate)}
                    </p>
                    <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(resume.status)}
                        {resume.status.charAt(0).toUpperCase() + resume.status.slice(1).replace('-', ' ')}
                      </span>
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Upload New Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border border-black border-dashed"
              onClick={() => onNavigate('upload')}
            >
              <CardContent className="p-0">
                <div className="h-64 border-b border-black border-dashed flex items-center justify-center">
                  <div className="text-center">
                    <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-black">Upload New</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-medium text-sm text-center">Add New Resume</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Submitted For Review Section */}
        {submittedResumes.length > 0 && (
          <section className="mb-16">
            <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
              Submitted For Review
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submittedResumes.map((resume) => (
                <Card 
                  key={resume.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border border-black"
                  onClick={() => onNavigate('resumeView', resume.id)}
                >
                  <CardContent className="p-0">
                    <div className="h-64 bg-gray-100 border-b border-black flex items-center justify-center">
                      <ImageWithFallback
                        src="/placeholder-resume.png"
                        alt={resume.fileName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-sm truncate">{resume.fileName}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Reviewer: {resume.reviewerName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(resume.uploadDate)}
                      </p>
                      <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(resume.status)}
                          In Review
                        </span>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Reviewed Resumes Section */}
        {reviewedResumes.length > 0 && (
          <section>
            <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
              Reviewed Resumes
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviewedResumes.map((resume) => (
                <Card 
                  key={resume.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border border-black"
                  onClick={() => onNavigate('resumeView', resume.id)}
                >
                  <CardContent className="p-0">
                    <div className="h-64 bg-gray-100 border-b border-black flex items-center justify-center">
                      <ImageWithFallback
                        src="/placeholder-resume.png"
                        alt={resume.fileName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-sm truncate">{resume.fileName}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Reviewed by: {resume.reviewerName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(resume.uploadDate)}
                      </p>
                      <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(resume.status)}
                          {resume.status === 'approved' ? 'Approved' : 'Reviewed'}
                        </span>
                      </Badge>
                      {resume.comments.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {resume.comments.length} comment{resume.comments.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
import { Navigation } from "./Navigation";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { User, Resume, Screen } from "../src/App";
import { ImageWithFallback } from "./ImageWithFallback";

interface ReviewerDashboardProps {
  user: User;
  resumes: Resume[];
  onNavigate: (screen: Screen, resumeId?: string) => void;
  onLogout: () => void;
}

export function ReviewerDashboard({
  user,
  resumes,
  onNavigate,
  onLogout,
}: ReviewerDashboardProps) {
  const getStatusIcon = (status: Resume["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in-review":
        return <AlertCircle className="w-4 h-4" />;
      case "reviewed":
        return <CheckCircle className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Resume["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-review":
        return "bg-blue-100 text-blue-800";
      case "reviewed":
        return "bg-green-100 text-green-800";
      case "approved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const resumesInProgress = resumes.filter(
    (r) => r.status === "in-review" && r.reviewerId === user.id
  );
  const newSubmissions = resumes.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-white">
      <Navigation user={user} onNavigate={onNavigate} onLogout={onLogout} />

      <div className="px-[79px] pt-[20px] pb-16">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-[64px] font-bold text-black tracking-[-1.28px] leading-normal mb-2">
            Welcome, {user.name}
          </h1>
          <p className="text-[24px] text-[rgba(0,0,0,0.75)] mb-8">
            Look below for resumes to be reviewed
          </p>
        </div>

        {/* Resumes in Progress Section */}
        {resumesInProgress.length > 0 && (
          <section className="mb-16">
            <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
              Resumes in Progress
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumesInProgress.map((resume) => (
                <Card
                  key={resume.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border border-black"
                  onClick={() => onNavigate("review", resume.id)}
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
                      <p className="font-medium text-sm truncate">
                        {resume.fileName}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Student: {resume.studentName}
                      </p>
                      <p className="text-xs text-gray-600">
                        Submitted: {formatDateTime(resume.uploadDate)}
                      </p>
                      <Badge
                        className={`mt-2 ${getStatusColor(resume.status)}`}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(resume.status)}
                          In Progress
                        </span>
                      </Badge>
                      {resume.comments.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {resume.comments.length} comment
                          {resume.comments.length !== 1 ? "s" : ""} added
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Newly Submitted Resumes Section */}
        {/* Newly Submitted Resumes Section */}
        <section>
          <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
            Newly Submitted Resumes
          </h2>

          {newSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newSubmissions.map((resume) => (
                <Card
                  key={resume.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border border-black"
                  onClick={() => onNavigate("review", resume.id)}
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
                      <p className="font-medium text-sm truncate">
                        {resume.fileName}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Student: {resume.studentName}
                      </p>
                      <p className="text-xs text-gray-600">
                        Submitted: {formatDateTime(resume.uploadDate)}
                      </p>
                      <Badge
                        className={`mt-2 ${getStatusColor(resume.status)}`}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(resume.status)}
                          Pending Review
                        </span>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                No new submissions
              </h3>
              <p className="text-gray-500">
                New resume submissions will appear here for review.
              </p>
            </div>
          )}
        </section>

        {/* Quick Stats */}
        <section className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {newSubmissions.length}
                </div>
                <p className="text-sm text-gray-600">Pending Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {resumesInProgress.length}
                </div>
                <p className="text-sm text-gray-600">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {resumes.filter((r) => r.status === "reviewed").length}
                </div>
                <p className="text-sm text-gray-600">Reviewed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {resumes.filter((r) => r.status === "approved").length}
                </div>
                <p className="text-sm text-gray-600">Approved</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

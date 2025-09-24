import { useState } from "react";
import { Navigation } from "./Navigation";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  Send,
  ArrowLeft,
  Download,
  Printer,
  Share2,
  AlertCircle,
  User as UserIcon,
} from "lucide-react";
import { User, Resume, Screen } from "../src/App";
import { ImageWithFallback } from "./ImageWithFallback";

interface ResumeViewScreenProps {
  user: User;
  resume: Resume;
  onNavigate: (screen: Screen, resumeId?: string) => void;
}

export function ResumeViewScreen({
  user,
  resume,
  onNavigate,
}: ResumeViewScreenProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState("");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
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

  const getStatusMessage = (status: Resume["status"]) => {
    switch (status) {
      case "pending":
        return "Your resume is waiting to be assigned to a reviewer.";
      case "in-review":
        return "Your resume is currently being reviewed. You'll be notified when feedback is available.";
      case "reviewed":
        return "Your resume has been reviewed! Check the comments below for feedback.";
      case "approved":
        return "Congratulations! Your resume has been approved and is ready for submission.";
      default:
        return "Resume status unknown.";
    }
  };

  const unresolvedComments = resume.comments.filter((c) => !c.resolved);
  const resolvedComments = resume.comments.filter((c) => c.resolved);

  return (
    <div className="min-h-screen bg-white">
      <Navigation
        user={user}
        onNavigate={onNavigate}
        onLogout={() => onNavigate("login")}
      />

      <div className="px-[79px] pt-[20px] pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {/* Header */}
          <div className="mb-8">
            {/* Back to Dashboard Button */}
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => onNavigate("studentDashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>

            {/* File Name, Uploaded Date, and Status */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-black">
                  {resume.fileName}
                </h1>
                <p className="text-lg text-gray-600">
                  Uploaded {formatDate(resume.uploadDate)}
                </p>
              </div>

              <Badge
                className={`${getStatusColor(
                  resume.status
                )} flex items-center gap-1`}
              >
                {getStatusIcon(resume.status)}
                {resume.status.charAt(0).toUpperCase() +
                  resume.status.slice(1).replace("-", " ")}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge
              className={`${getStatusColor(
                resume.status
              )} flex items-center gap-1`}
            >
              {getStatusIcon(resume.status)}
              {resume.status.charAt(0).toUpperCase() +
                resume.status.slice(1).replace("-", " ")}
            </Badge>
          </div>
        </div>

        {/* Status Alert */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {getStatusMessage(resume.status)}
            {resume.reviewerName && (
              <span>
                {" "}
                Assigned reviewer: <strong>{resume.reviewerName}</strong>
              </span>
            )}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resume Viewer */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Resume Preview
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 min-h-[800px] rounded-lg flex items-center justify-center">
                  <ImageWithFallback
                    src="/placeholder-resume-full.png"
                    alt={resume.fileName}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info and Comments Panel */}
          <div className="space-y-6">
            {/* Resume Info */}
            <Card>
              <CardHeader>
                <CardTitle>Resume Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">File Name</p>
                  <p className="text-sm">{resume.fileName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className={`${getStatusColor(resume.status)} text-xs`}>
                    {resume.status.charAt(0).toUpperCase() +
                      resume.status.slice(1).replace("-", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Uploaded</p>
                  <p className="text-sm">{formatDate(resume.uploadDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Version</p>
                  <p className="text-sm">v{resume.version}</p>
                </div>
                {resume.reviewerName && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Reviewer
                    </p>
                    <p className="text-sm">{resume.reviewerName}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {resume.status === "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share with Reviewer
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Replace Resume
                  </Button>
                </CardContent>
              </Card>
            )}

            {resume.status === "approved" && (
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Submit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Printer className="w-4 h-4 mr-2" />
                    Print for Career Fair
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Final Version
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Feedback ({resume.comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resume.comments.length > 0 ? (
                  <div className="space-y-4">
                    {/* Unresolved Comments */}
                    {unresolvedComments.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-red-600 mb-3">
                          Action Required ({unresolvedComments.length})
                        </h4>
                        {unresolvedComments.map((comment) => (
                          <div
                            key={comment.id}
                            className="border-l-4 border-red-200 pl-4 mb-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm flex items-center gap-2">
                                  <UserIcon className="w-3 h-3" />
                                  {comment.authorName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(comment.createdAt)}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm mb-3 bg-red-50 p-3 rounded">
                              {comment.text}
                            </p>

                            {/* Student can reply */}
                            <div className="ml-4 space-y-2 border-l border-gray-200 pl-3">
                              {comment.replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="bg-blue-50 p-2 rounded"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-xs">
                                      {reply.authorName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatDate(reply.createdAt)}
                                    </p>
                                  </div>
                                  <p className="text-sm">{reply.text}</p>
                                </div>
                              ))}

                              {/* Reply button */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Reply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resolved Comments */}
                    {resolvedComments.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-green-600 mb-3">
                          Resolved ({resolvedComments.length})
                        </h4>
                        {resolvedComments.map((comment) => (
                          <div
                            key={comment.id}
                            className="border-l-2 border-green-200 pl-4 mb-4 opacity-75"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm flex items-center gap-2">
                                  <UserIcon className="w-3 h-3" />
                                  {comment.authorName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(comment.createdAt)}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Resolved
                              </Badge>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No feedback yet</p>
                    <p className="text-sm">
                      {resume.status === "pending"
                        ? "Share your resume with a reviewer to receive feedback"
                        : "Feedback will appear here once your review is complete"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Version History */}
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div>
                      <p className="text-sm font-medium">
                        v{resume.version} (Current)
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(resume.uploadDate)}
                      </p>
                    </div>
                    <Badge variant="secondary">Latest</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

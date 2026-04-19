import { Calendar, DollarSign, Clock, User, FileText, X, Briefcase } from "lucide-react";

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    description: string;
    total_pay: number;
    status: string;
    percentage: number;
    application_deadline: string | null;
    submission_deadline: string | null;
    company_name?: string;
  };
  onApply: (project: any) => void;
}

export default function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
  onApply,
}: ProjectDetailsModalProps) {
  if (!isOpen) return null;

  const isExpired = (deadline: string | null): boolean => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const expired = isExpired(project.submission_deadline);
  const applicationExpired = isExpired(project.application_deadline);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">
                    {project.title}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    {project.company_name || "Company"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                {project.percentage > 0 && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-zinc-100 text-zinc-700">
                    {project.percentage}% Complete
                  </span>
                )}
                {expired && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Expired
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 transition-colors ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-zinc-600" />
              Project Description
            </h3>
            <div className="prose prose-zinc max-w-none">
              <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">
                {project.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Budget */}
            <div className="bg-zinc-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-zinc-900">Budget</h4>
              </div>
              <p className="text-2xl font-bold text-zinc-900">
                ₹{project.total_pay.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500">Total budget</p>
            </div>

            {/* Progress */}
            <div className="bg-zinc-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-zinc-900">Progress</h4>
              </div>
              <p className="text-2xl font-bold text-zinc-900">
                {project.percentage}%
              </p>
              <p className="text-sm text-zinc-500">Completed</p>
            </div>

            {/* Application Deadline */}
            <div className="bg-zinc-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <h4 className="font-medium text-zinc-900">Apply By</h4>
              </div>
              <p className={`text-sm font-medium ${applicationExpired ? 'text-red-600' : 'text-zinc-900'}`}>
                {formatDate(project.application_deadline)}
              </p>
              <p className="text-sm text-zinc-500">
                {applicationExpired ? "Expired" : "Application deadline"}
              </p>
            </div>

            {/* Submission Deadline */}
            <div className="bg-zinc-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-zinc-900">Submit By</h4>
              </div>
              <p className={`text-sm font-medium ${expired ? 'text-red-600' : 'text-zinc-900'}`}>
                {formatDate(project.submission_deadline)}
              </p>
              <p className="text-sm text-zinc-500">
                {expired ? "Expired" : "Submission deadline"}
              </p>
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">Important Information</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              {applicationExpired && (
                <li>• Application period has ended</li>
              )}
              {expired && (
                <li>• Project submission deadline has passed</li>
              )}
              {project.percentage > 0 && (
                <li>• Project is already in progress ({project.percentage}% complete)</li>
              )}
              <li>• Review the project requirements carefully before applying</li>
              <li>• Make sure you can meet the deadlines if you apply</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-zinc-200 p-6 rounded-b-xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors font-medium"
            >
              Close
            </button>
            <button
              onClick={() => onApply(project)}
              disabled={expired}
              className={`flex-1 px-6 py-3 rounded-lg transition-colors font-medium ${
                expired
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {expired ? "Project Expired" : "Apply for This Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

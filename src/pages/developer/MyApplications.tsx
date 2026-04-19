import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { InsightBadge } from "../../components/ml/InsightBadge";
import { ViewDetailsModal } from "../../components/ViewDetailsModal";
import EditSubmissionModal from "../../components/EditSubmissionModal";
import { FileText, ArrowRight, Clock, Briefcase, Edit3 } from "lucide-react";

/* ---------------- RAW SUPABASE TYPE ---------------- */

type RawSubmission = {
  id: string;
  created_at: string | null;
  description: string | null;
  github_link: string | null;
  figma_link: string | null;
  expected_pay: number | null;
  estimated_hours: number | null;
  availability: number | null;
  selected: boolean | null;
  accepted: boolean | null;
  projects: {
    id: string;
    title: string | null;
    status: string | null;
    percentage: number | null;
    submission_deadline: string | null;
    company: {
      id: string | null;
    } | null;
  } | null;
};

interface ApplicationData {
  description: string;
  links: {
    github: string;
    figma: string;
  };
  estimatedHours: string;
  availability: string;
  expectedAmount: string;
}

/* ---------------- UI TYPE ---------------- */

interface Application {
  id: string;
  project: string;
  company: string;
  status: string;
  fitScore: number;
  appliedDate: string;
  applicationData: ApplicationData;
  projectId: string;
  percentage?: number;
  submissionDeadline?: string | null;
  submissionId?: string;
}

/* ---------------- COMPONENT ---------------- */

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "active" | "completed">("all");

  // Generate random fit score between 70-99
  const generateRandomScore = () => {
    return Math.floor(Math.random() * 30) + 70; // 70-99 range
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  /* ---------------- FETCH FROM SUPABASE ---------------- */

  const fetchApplications = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from("submissions")
      .select(`
        id,
        created_at,
        description,
        github_link,
        figma_link,
        expected_pay,
        estimated_hours,
        availability,
        selected,
        accepted,
        projects (
          id,
          title,
          status,
          percentage,
          submission_deadline,
          company (
            id
          )
        )
      `)
      .eq("developer_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return;
    }

    if (!data || data.length === 0) {
      setApplications([]);
      return;
    }

    const mapped: Application[] = (data as unknown as RawSubmission[]).map((sub) => {
      const status = sub.accepted
        ? "Accepted"
        : sub.selected
        ? "Shortlisted"
        : "Pending";

      return {
        id: sub.id,
        project: sub.projects?.title ?? "Untitled Project",
        company: sub.projects?.company?.id
          ? `Company #${sub.projects.company.id}`
          : "Unknown Company",
        status,
        fitScore: generateRandomScore(),
        appliedDate: sub.created_at
          ? new Date(sub.created_at).toLocaleDateString()
          : "—",
        applicationData: {
          description: sub.description ?? "",
          links: {
            github: sub.github_link ?? "",
            figma: sub.figma_link ?? "",
          },
          estimatedHours: sub.estimated_hours?.toString() ?? "",
          availability: sub.availability?.toString() ?? "",
          expectedAmount: sub.expected_pay?.toString() ?? "",
        },
        projectId: sub.projects?.id ?? "",
        percentage: sub.projects?.percentage ?? 0,
        submissionDeadline: sub.projects?.submission_deadline ?? null,
        submissionId: sub.id,
      };
    });

    setApplications(mapped);
  };

  const handleEditSubmission = (app: Application) => {
    // Find the original submission data
    const submissionData = {
      id: app.submissionId!,
      description: app.applicationData.description,
      github_link: app.applicationData.links.github,
      figma_link: app.applicationData.links.figma,
      expected_pay: parseFloat(app.applicationData.expectedAmount) || 0,
      estimated_hours: parseInt(app.applicationData.estimatedHours) || 0,
      availability: parseInt(app.applicationData.availability) || 0,
    };
    setEditingSubmission(submissionData);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchApplications(); // Refresh the data
  };

  /* ---------------- FILTER LOGIC ---------------- */
  
  const getFilteredApplications = () => {
    switch (activeTab) {
      case "pending":
        return applications.filter(app => app.status === "Pending");
      case "active":
        return applications.filter(app => 
          (app.status === "Accepted" || app.status === "Shortlisted") && 
          (app.percentage === undefined || app.percentage < 100)
        );
      case "completed":
        return applications.filter(app => app.percentage !== undefined && app.percentage >= 100);
      default:
        return applications;
    }
  };

  const filteredApplications = getFilteredApplications();

  const getTabCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter(app => app.status === "Pending").length,
      active: applications.filter(app => 
        (app.status === "Accepted" || app.status === "Shortlisted") && 
        (app.percentage === undefined || app.percentage < 100)
      ).length,
      completed: applications.filter(app => app.percentage !== undefined && app.percentage >= 100).length,
    };
  };

  const tabCounts = getTabCounts();

  /* ---------------- UI ---------------- */

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            My Applications
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage your submissions and track project progress
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "all" as const, label: "All Applications", icon: FileText },
              { id: "pending" as const, label: "Pending", icon: Clock },
              { id: "active" as const, label: "Active Work", icon: Briefcase },
              { id: "completed" as const, label: "Completed", icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const count = tabCounts[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-2 px-1 border-b-2 text-sm font-medium transition-colors
                    ${activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {count > 0 && (
                    <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-xs">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Applications Grid */}
        <div className="grid gap-4">
          {filteredApplications.map((app) => (
            <Card
              key={app.id}
              className="hover:border-zinc-300 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                      {activeTab === "active" ? (
                        <Briefcase className="w-5 h-5 text-zinc-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-zinc-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-zinc-900 mb-1">
                        {app.project}
                      </h2>
                      <p className="text-sm text-zinc-500 mb-3">
                        {app.company}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <Badge
                          variant={
                            app.status === "Accepted"
                              ? "success"
                              : app.status === "Shortlisted"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {app.status}
                        </Badge>

                        <InsightBadge
                          label="Fit Score"
                          score={app.fitScore}
                        />

                        <span className="text-xs text-zinc-500">
                          Applied on {app.appliedDate}
                        </span>
                      </div>

                      {/* Progress tracking for active projects */}
                      {(activeTab === "active" || activeTab === "completed") && app.percentage !== undefined && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600">Progress</span>
                            <span className="text-zinc-500">{app.percentage}%</span>
                          </div>
                          <div className="w-full bg-zinc-100 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${app.percentage}%` }}
                            />
                          </div>
                          {app.submissionDeadline && (
                            <p className="text-xs text-zinc-500 mt-2">
                              Deadline: {new Date(app.submissionDeadline).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {activeTab === "active" && (
                      <button
                        onClick={() => handleEditSubmission(app)}
                        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedApplication(app);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-lg bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              {activeTab === "active" ? (
                <Briefcase className="w-8 h-8 text-zinc-400" />
              ) : (
                <FileText className="w-8 h-8 text-zinc-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-zinc-900 mb-2">
              {activeTab === "pending" && "No pending applications"}
              {activeTab === "active" && "No active work"}
              {activeTab === "completed" && "No completed projects"}
              {activeTab === "all" && "No applications yet"}
            </h3>
            <p className="text-zinc-500">
              {activeTab === "pending" && "Your submitted applications will appear here"}
              {activeTab === "active" && "Projects you're working on will appear here"}
              {activeTab === "completed" && "Finished projects will appear here"}
              {activeTab === "all" && "Start by applying to projects from the Explore page"}
            </p>
          </div>
        )}
      </div>

      {selectedApplication && (
        <ViewDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedApplication(null);
          }}
          projectTitle={selectedApplication.project}
          company={selectedApplication.company}
          status={selectedApplication.status}
          appliedDate={selectedApplication.appliedDate}
          applicationData={selectedApplication.applicationData}
        />
      )}

      {editingSubmission && (
        <EditSubmissionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingSubmission(null);
          }}
          submission={editingSubmission}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}

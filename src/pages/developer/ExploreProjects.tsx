import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import ApplyModal from "../../components/ApplyModal";
import ProjectDetailsModal from "../../components/ProjectDetailsModal";
import { supabase } from "../../supabaseClient";
import { AlertCircle, Eye } from "lucide-react";

/* ---------------- TYPES ---------------- */
interface Project {
  id: string;
  title: string;
  description: string;
  total_pay: number;
  status: string | null;
  percentage: number | null;
  application_deadline: string | null;
  submission_deadline: string | null;
  company_name?: string;
}

/* ---------------- CONSTANTS ---------------- */
const PAGE_SIZE = 10;

/* ---------------- COMPONENT ---------------- */
export default function ExploreProjects() {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Project | null>(null);

  /* ---------------- FETCH PROJECTS ---------------- */
  const fetchProjects = async (pageNumber: number) => {
    setLoading(true);
    const from = pageNumber * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("projects")
      .select(`
        id,
        title,
        description,
        total_pay,
        status,
        percentage,
        application_deadline,
        submission_deadline
      `)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching projects:", error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setHasMore(false);
      setLoading(false);
      return;
    }

    // Filter out 100% completed projects
    const filtered = data.filter((p) => {
      const isComplete = p.percentage != null && p.percentage >= 100;
      return !isComplete;
    });

    // Map company name (since we can't join due to database structure)
    const mapped = filtered.map((p: any) => ({
      ...p,
      company_name: "Company", // Default placeholder since company join failed
    }));

    // Add to list (replace on page 0, append otherwise)
    setProjects((prev) =>
      pageNumber === 0 ? mapped : [...prev, ...mapped]
    );

    if (mapped.length < PAGE_SIZE) {
      setHasMore(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    setProjects([]);
    setPage(0);
    setHasMore(true);
    fetchProjects(0);
  }, []);

  /* ---------------- HANDLE URL PARAMS ---------------- */
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    if (projectId) {
      // Find the project in the current projects list
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setSelectedProjectForDetails(project);
        setIsDetailsModalOpen(true);
      } else {
        // If not found in current list, fetch it directly
        const fetchSingleProject = async () => {
          const { data } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single();
          
          if (data) {
            const mappedProject = {
              ...data,
              company_name: "Company"
            };
            setSelectedProjectForDetails(mappedProject);
            setIsDetailsModalOpen(true);
          }
        };
        fetchSingleProject();
      }
    }
  }, [searchParams, projects]);

  /* ---------------- HELPERS ---------------- */
  const isExpired = (deadline: string | null): boolean => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProjectForDetails(project);
    setIsDetailsModalOpen(true);
  };

  /* ---------------- APPLY HANDLERS ---------------- */
  const handleApply = (project: Project) => {
    // Optional: prevent applying to expired projects
    if (isExpired(project.submission_deadline)) {
      alert("This project has expired and is no longer accepting applications.");
      return;
    }

    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleSubmitApplication = async (data: any) => {
    if (!selectedProject) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to apply.");
      return;
    }

    const { error } = await supabase.from("submissions").insert({
      project_id: selectedProject.id,
      developer_id: user.id,
      github_link: data.githubLink || null,
      figma_link: data.figmaLink || null,
      description: data.description || null,
      expected_pay: data.expectedAmount || null,
      estimated_hours: data.estimatedHours || null,
      availability: data.availability || null,
      selected: false,
      accepted: false,
    });

    if (error) {
      console.error(error.message);
      alert("Failed to submit application.");
      return;
    }

    alert("Application submitted successfully!");
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  /* ---------------- UI ---------------- */
  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Explore Projects</h1>
          <p className="text-zinc-500 mt-1">Browse live projects and apply instantly</p>
        </div>

        {/* PROJECT LIST */}
        <div className="grid gap-4">
          {projects.map((project) => {
            const expired = isExpired(project.submission_deadline);

            return (
              <Card
                key={project.id}
                className={`hover:border-zinc-300 transition-colors ${
                  expired ? "opacity-75" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-zinc-900">
                          {project.title}
                        </h2>
                        {expired && (
                          <Badge variant="warning" className="flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Expired
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-zinc-500 line-clamp-2">
                        {project.description || "No description available"}
                      </p>

                      <p className="text-sm text-zinc-500">Budget: ₹{project.total_pay}</p>

                      <div className="flex gap-2 flex-wrap">
                        {project.status && <Badge>{project.status}</Badge>}
                        {project.percentage !== null && (
                          <Badge variant="secondary">
                            {project.percentage}% Complete
                          </Badge>
                        )}
                        {project.submission_deadline && (
                          <Badge variant="outline">
                            Deadline: {new Date(project.submission_deadline).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(project)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button
                        onClick={() => handleApply(project)}
                        disabled={expired}
                        variant={expired ? "secondary" : "primary"}
                        size="sm"
                      >
                        {expired ? "Expired" : "Apply"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* LOAD MORE */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchProjects(nextPage);
              }}
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}

        {!hasMore && projects.length > 0 && (
          <p className="text-center text-sm text-zinc-500 mt-6">
            You’ve reached the end
          </p>
        )}

        {projects.length === 0 && !loading && (
          <p className="text-center text-zinc-500 py-10">
            No active projects available at the moment.
          </p>
        )}
      </div>

      {/* PROJECT DETAILS MODAL */}
      {selectedProjectForDetails && (
        <ProjectDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedProjectForDetails(null);
          }}
          project={{
            ...selectedProjectForDetails,
            status: selectedProjectForDetails.status || "Unknown",
            percentage: selectedProjectForDetails.percentage || 0,
            application_deadline: selectedProjectForDetails.application_deadline,
            submission_deadline: selectedProjectForDetails.submission_deadline,
            company_name: selectedProjectForDetails.company_name,
          }}
          onApply={handleApply}
        />
      )}

      {/* APPLY MODAL */}
      {selectedProject && (
        <ApplyModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProject(null);
          }}
          projectId={selectedProject.id}
          projectTitle={selectedProject.title}
          company="Company"
        />
      )}
    </>
  );
}
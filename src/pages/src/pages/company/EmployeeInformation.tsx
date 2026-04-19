import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Mail,
  Briefcase,
  Star,
  MessageCircle,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  User,
  Link,
  GitBranch,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../supabaseClient";

/* ---------------- Types ---------------- */

interface Project {
  id: string;
  title: string;
  status: string;
  percentage: number;
  total_pay: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  rating: number;
  experience: number;
  skills: string;
  submission_id: string;
  description?: string;
  expected_pay?: number;
  availability?: number;
  selected: boolean;
  accepted: boolean;
  link?: string;
  figma_link?: string;
  github_link?: string;
}

interface ProjectEmployees {
  projectId: string;
  projectTitle: string;
  project: Project;
  employees: Employee[];
}

/* ---------------- Component ---------------- */

export default function EmployeeInformation() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectEmployees, setProjectEmployees] = useState<ProjectEmployees[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  /* ---------------- Fetch Projects ---------------- */

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("id, title, status, percentage, total_pay")
        .eq("company_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error.message);
        setLoading(false);
        return;
      }

      setProjects(data || []);
      setLoading(false);
    };

    loadProjects();
  }, []);

  /* ---------------- Fetch Employees for Project ---------------- */

  const fetchProjectEmployees = async (projectId: string) => {
    setLoadingEmployees(true);

    try {
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("*")
        .eq("project_id", projectId);

      if (submissionsError) {
        console.error("Error fetching submissions:", submissionsError);
        setLoadingEmployees(false);
        return;
      }

      if (!submissions || submissions.length === 0) {
        setProjectEmployees([]);
        setLoadingEmployees(false);
        return;
      }

      const employees: Employee[] = [];

      for (const submission of submissions) {
        const { data: devData } = await supabase
          .from("developers")
          .select("rating, experience, skills")
          .eq("id", submission.developer_id)
          .maybeSingle();

        const { data: profileData } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", submission.developer_id)
          .maybeSingle();

        employees.push({
          id: submission.developer_id,
          name: profileData?.name || "Unknown",
          email: profileData?.email || "No email",
          rating: devData?.rating || 0,
          experience: devData?.experience || 0,
          skills: devData?.skills || "",
          submission_id: submission.id,
          description: submission.description || "",
          expected_pay: submission.expected_pay || 0,
          availability: submission.availability,
          selected: submission.selected || false,
          accepted: submission.accepted || false,
          link: submission.link || "",
          figma_link: submission.figma_link || "",
          github_link: submission.github_link || "",
        });
      }

      // Get project details
      const { data: projectData } = await supabase
        .from("projects")
        .select("id, title, status, percentage, total_pay")
        .eq("id", projectId)
        .single();

      setProjectEmployees([{
        projectId,
        projectTitle: projectData?.title || "Unknown Project",
        project: projectData || {
          id: projectId,
          title: "Unknown Project",
          status: "Unknown",
          percentage: 0,
          total_pay: 0,
        },
        employees,
      }]);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  /* ---------------- Handlers ---------------- */

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    fetchProjectEmployees(project.id);
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleShowProfile = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowProfileDialog(true);
  };

  const handleShowSubmission = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowSubmissionDialog(true);
  };

  const handleMessageEmployee = (employee: Employee) => {
    // Navigate to company messages with employee ID
    navigate("/company/messages", {
      state: { 
        recipientId: employee.id,
        recipientName: employee.name,
        recipientEmail: employee.email 
      }
    });
  };

  const formatAvailability = (hours: number | undefined) => {
    if (hours === undefined || hours === null) return "Not specified";
    if (hours >= 40) return "Full-time";
    if (hours >= 20) return "Part-time";
    return `${hours} hrs/week`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "text-green-600";
      case "in progress": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  const getEmployeeStatusColor = (employee: Employee) => {
    if (employee.accepted) return "text-green-600";
    if (employee.selected) return "text-yellow-600";
    return "text-gray-600";
  };

  /* ---------------- Render ---------------- */

  if (loading) {
    return <p className="text-zinc-500">Loading employee information...</p>;
  }

  return (
    <div className="p-4 max-h-screen overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-zinc-900">Employee Information</h1>
        <p className="text-zinc-500 mt-1">
          View projects and employees working on them
        </p>
      </div>

      {/* Main Content - Fixed Height Container */}
      <div className="h-[calc(100vh-12rem)] overflow-hidden flex gap-6">
        {/* Projects List - Left Side */}
        <div className="w-2/5 h-full overflow-y-auto overflow-x-hidden border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 sticky top-0 bg-gray-50 pb-2">Projects</h2>
          
          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                <p className="text-zinc-500">No projects found</p>
                <p className="text-sm text-zinc-400 mt-2">
                  Create your first project to start managing employees
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Card 
                  key={project.id}
                  className={`cursor-pointer transition-shadow ${
                    selectedProject?.id === project.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => handleProjectClick(project)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-zinc-900 mb-1">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-zinc-600">
                          <span className={`font-medium ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                          <span>{project.percentage}%</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Employees List - Right Side */}
        {selectedProject && (
          <div className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2 z-10">
              <h2 className="text-lg font-semibold text-zinc-900">
                Employees - {selectedProject.title}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProject(null);
                  setProjectEmployees([]);
                }}
              >
                Back
              </Button>
            </div>

            {loadingEmployees ? (
              <div className="text-center py-8">
                <p className="text-zinc-500">Loading employees...</p>
              </div>
            ) : projectEmployees.length === 0 || projectEmployees[0]?.employees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                <p className="text-zinc-500">No employees found for this project</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  // Remove duplicates before mapping
                  const employees = projectEmployees[0]?.employees || [];
                  const uniqueEmployees = employees.filter((emp, index, self) => 
                    index === self.findIndex((e) => e.id === emp.id)
                  );
                  
                  return uniqueEmployees.map((employee) => (
                    <Card key={employee.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-zinc-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-zinc-900">
                              {employee.name}
                            </h4>
                            <Badge 
                              variant={employee.accepted ? "secondary" : employee.selected ? "warning" : "outline"}
                              className={getEmployeeStatusColor(employee)}
                            >
                              {employee.accepted ? "Accepted" : employee.selected ? "Selected" : "Applied"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowProfile(employee)}
                          >
                            Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowSubmission(employee)}
                          >
                            Submission
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMessageEmployee(employee)}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ));
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Dialog */}
      {showProfileDialog && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900">
                {selectedEmployee.name} - Profile
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileDialog(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-3">Contact Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-zinc-600" />
                    <span>{selectedEmployee.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Rating: {selectedEmployee.rating.toFixed(1)} / 5</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>Experience: {selectedEmployee.experience} years</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {selectedEmployee.skills && (
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.skills.split(",").map((skill, index) => (
                      <span 
                        key={index}
                        className="text-sm bg-zinc-100 text-zinc-700 px-3 py-2 rounded-lg"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowProfileDialog(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowProfileDialog(false);
                    handleMessageEmployee(selectedEmployee);
                  }}
                  className="flex-1"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Dialog */}
      {showSubmissionDialog && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900">
                {selectedEmployee.name} - Submission
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubmissionDialog(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Application Status */}
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-3">Application Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-zinc-600" />
                    <span>Status: {selectedEmployee.accepted ? "Accepted" : selectedEmployee.selected ? "Selected" : "Applied"}</span>
                  </div>
                  {selectedEmployee.expected_pay && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span>Expected Pay: ₹{selectedEmployee.expected_pay.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedEmployee.availability && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>Availability: {formatAvailability(selectedEmployee.availability)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Links */}
              {(selectedEmployee.link || selectedEmployee.figma_link || selectedEmployee.github_link) && (
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-3">Portfolio Links</h3>
                  <div className="space-y-3">
                    {selectedEmployee.link && (
                      <a
                        href={selectedEmployee.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Link className="w-4 h-4" />
                        <span>Portfolio Link</span>
                      </a>
                    )}
                    {selectedEmployee.figma_link && (
                      <a
                        href={selectedEmployee.figma_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-purple-600 hover:text-purple-700"
                      >
                        <GitBranch className="w-4 h-4" />
                        <span>Figma Link</span>
                      </a>
                    )}
                    {selectedEmployee.github_link && (
                      <a
                        href={selectedEmployee.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-700"
                      >
                        <GitBranch className="w-4 h-4" />
                        <span>GitHub Link</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Submission Description */}
              {selectedEmployee.description && (
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-3">Submission Details</h3>
                  <div className="bg-zinc-50 p-4 rounded-lg text-sm text-zinc-700">
                    {selectedEmployee.description}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmissionDialog(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowSubmissionDialog(false);
                    handleMessageEmployee(selectedEmployee);
                  }}
                  className="flex-1"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

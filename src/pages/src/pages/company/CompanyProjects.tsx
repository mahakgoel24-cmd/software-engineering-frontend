import React, { useEffect, useState, useRef } from "react";
import {
  CheckCircle2,
  Mail,
  Briefcase,
  DollarSign,
  X,
  User,
  Download,
  Star,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

type Project = {
  id: string;
  title: string;
  status: string;
  percentage: number;
};

type Candidate = {
  id: string;
  submissionId: string;
  name: string;
  status: "Selected" | "Applied";
  skills: string[];
  experience: string;
  email: string;
  budget: string;
  availability: number | null;
  bio: string;
  rating: number;
  resume: string | null;
  selected: boolean;
  accepted: boolean;
};

type SubmissionGroup = {
  projectId: string;
  projectTitle: string;
  candidates: Candidate[];
};

const formatAvailability = (hours: number | null) => {
  if (hours === null) return "Not specified";
  if (hours >= 40) return "Full-time";
  if (hours >= 20) return "Part-time";
  return `${hours} hrs/week`;
};

const CompanyProjects = () => {
  const navigate = useNavigate();
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Submissions modal
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [groups, setGroups] = useState<SubmissionGroup[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [newRating, setNewRating] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [totalPay, setTotalPay] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  // Real-time subscription ref
  const subscriptionRef = useRef<any>(null);

  const sendProjectToModel = async (projectId: string) => {
    try {
      // Step 1: Reset all selected to false for this project when view is clicked
      const { data: submissions, error: resetError } = await supabase
        .from("submissions")
        .select("id")
        .eq("project_id", projectId);

      if (resetError) {
        console.error("Error fetching submissions for reset:", resetError);
        throw resetError;
      }

      if (submissions && submissions.length > 0) {
        const submissionIds = submissions.map(sub => sub.id);
        const { error: updateError } = await supabase
          .from("submissions")
          .update({ selected: false })
          .in("id", submissionIds);

        if (updateError) {
          console.error("Error resetting selected field:", updateError);
          throw updateError;
        }
      }

      // Step 2: Send project to ML model
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Model API error:", response.status, errorText);
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log("Model response:", result);

      // Step 3: Update database with model's selections (real-time subscription will handle UI updates)
      if (result && result.shortlisted) {
        // Update database - set selected to true only for model-selected users
        const { error: modelUpdateError } = await supabase
          .from("submissions")
          .update({ selected: true })
          .in("id", result.shortlisted);

        if (modelUpdateError) {
          console.error("Error updating model selections:", modelUpdateError);
          throw modelUpdateError;
        }

        console.log("Database updated with model selections. Real-time subscription will update UI.");
        // Note: Removed local state update - real-time subscription will handle UI updates
      }

      return result;
    } catch (error) {
      console.error("Error sending project to model:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Real-time subscription for submissions table
  useEffect(() => {
    let subscription: any = null;
    let isSubscribed = false;

    const setupRealtimeSubscription = async () => {
      // Clean up any existing subscription first
      if (subscriptionRef.current) {
        console.log('Cleaning up existing subscription before setting up new one');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log('No user found, skipping subscription setup');
        return;
      }

      // Get user's project IDs
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id")
        .eq("company_id", user.id);

      if (!projectsData || projectsData.length === 0) {
        console.log('No projects found, skipping subscription setup');
        return;
      }

      const projectIds = projectsData.map(p => p.id);
      console.log('Setting up real-time subscription for project IDs:', projectIds);

      // Subscribe to real-time changes on submissions for user's projects
      subscription = supabase
        .channel(`submissions_${user.id}_${Date.now()}`) // Unique channel name
        .on(
          'postgres_changes' as any,
          {
            event: 'UPDATE', // Only listen to UPDATE events
            schema: 'public',
            table: 'submissions',
            filter: `project_id=in.(${projectIds.join(',')})`
          },
          (payload: any) => {
            console.log('Real-time submission update received:', payload);
            console.log('Event type:', payload.eventType);
            console.log('New data:', payload.new);
            
            // Update local state immediately when database changes
            if (payload.new && payload.new.project_id && payload.new.id !== undefined) {
              setGroups(prevGroups => {
                console.log('Updating groups with real-time data');
                return prevGroups.map(group => {
                  if (group.projectId === payload.new.project_id) {
                    console.log(`Updating candidates for project ${group.projectId}`);
                    return {
                      ...group,
                      candidates: group.candidates.map(candidate => {
                        if (candidate.submissionId === payload.new.id) {
                          console.log(`Updating candidate ${candidate.name} - selected: ${payload.new.selected}`);
                          return {
                            ...candidate,
                            selected: payload.new.selected,
                            status: payload.new.selected ? "Selected" : "Applied"
                          };
                        }
                        return candidate;
                      })
                    };
                  }
                  return group;
                });
              });
            }
          }
        )
        .subscribe((status: string) => {
          console.log('Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to real-time updates');
            isSubscribed = true;
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Subscription error occurred');
            isSubscribed = false;
          } else if (status === 'TIMED_OUT') {
            console.error('Subscription timed out');
            isSubscribed = false;
          } else if (status === 'CLOSED') {
            console.log('Subscription closed');
            isSubscribed = false;
          }
        });

      subscriptionRef.current = subscription;
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      console.log('Cleaning up real-time subscription');
      if (subscription && isSubscribed) {
        supabase.removeChannel(subscription);
      }
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []); // Empty dependency array to prevent re-runs

  const fetchProjects = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("projects")
      .select("id, title, status, percentage")
      .eq("company_id", user.id)
      .order("created_at", { ascending: false });

    setProjects(data || []);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectToDelete);

      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete));
    } catch (err) {
      console.error("Delete project error:", err);
      alert("Failed to delete project.");
    } finally {
      setShowDeleteModal(false);
      setProjectToDelete(null);
    }
  };

  const handleCreateProject = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      if (
        !title.trim() ||
        !description.trim() ||
        !applicationDeadline ||
        !submissionDeadline ||
        totalPay <= 0 ||
        percentage < 0 ||
        percentage > 100
      ) {
        alert(
          "All fields are mandatory and percentage must be between 0 and 100."
        );
        return;
      }

      const appDate = new Date(applicationDeadline);
      const subDate = new Date(submissionDeadline);

      if (appDate >= subDate) {
        alert("Application deadline must be BEFORE submission deadline.");
        return;
      }

      const status = percentage === 100 ? "Completed" : "In Progress";

      const { error } = await supabase.from("projects").insert({
        company_id: user.id,
        title,
        description,
        status,
        total_pay: totalPay,
        percentage,
        application_deadline: applicationDeadline,
        submission_deadline: submissionDeadline,
      });

      if (error) throw error;

      setTitle("");
      setDescription("");
      setTotalPay(0);
      setPercentage(0);
      setApplicationDeadline("");
      setSubmissionDeadline("");
      setShowModal(false);

      fetchProjects();
    } catch (err) {
      console.error("Create project error:", err);
      alert("Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("No user found");
        return;
      }

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, title")
        .eq("company_id", user.id);

      if (projectsError) {
        console.error("Projects error:", projectsError);
        return;
      }

      if (!projectsData || projectsData.length === 0) {
        setGroups([]);
        return;
      }

      const results: SubmissionGroup[] = [];

      for (const project of projectsData) {
        const { data: submissions, error: submissionsError } = await supabase
          .from("submissions")
          .select("*")
          .eq("project_id", project.id);

        if (submissionsError) {
          console.error("Submissions error:", submissionsError);
          continue;
        }

        if (!submissions || submissions.length === 0) {
          continue;
        }

        const candidates: Candidate[] = [];

        for (const sub of submissions) {
          const { data: devData } = await supabase
            .from("developers")
            .select("rating, experience, skills")
            .eq("id", sub.developer_id)
            .maybeSingle();

          const { data: profileData } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("id", sub.developer_id)
            .maybeSingle();

          candidates.push({
            id: sub.developer_id,
            submissionId: sub.id,
            name: profileData?.name || "Unknown",
            status: sub.selected ? "Selected" : "Applied",
            skills: devData?.skills
              ? devData.skills.split(",").map((s: string) => s.trim())
              : [],
            experience: `${devData?.experience || 0} Years`,
            email: profileData?.email || "No email",
            budget: `₹${Number(sub.expected_pay || 0).toLocaleString()}`,
            availability:
              typeof sub.availability === "number" ? sub.availability : null,
            bio: sub.description || "No description",
            rating: devData?.rating || 0,
            resume: sub.link || null,
            selected: sub.selected || false,
            accepted: sub.accepted || false,
          });
        }

        results.push({
          projectId: project.id,
          projectTitle: project.title,
          candidates,
        });
      }

      setGroups(results);
    } catch (err) {
      console.error("Load submissions error:", err);
    }
  };

  const handleAccept = async () => {
    if (!activeCandidate) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("submissions")
        .update({ accepted: true })
        .eq("id", activeCandidate.submissionId);

      if (error) throw error;

      alert("Submission accepted!");
      loadSubmissions();
      setActiveCandidate(null);
    } catch (err) {
      console.error("Accept error:", err);
      alert("Failed to accept submission.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelect = async () => {
    if (!activeCandidate) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("submissions")
        .update({ selected: true })
        .eq("id", activeCandidate.submissionId);

      if (error) throw error;

      alert("Candidate selected!");
      loadSubmissions();
      setActiveCandidate(null);
    } catch (err) {
      console.error("Select error:", err);
      alert("Failed to select candidate.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRate = async () => {
    if (!activeCandidate || newRating < 1 || newRating > 5) {
      alert("Please select a rating between 1 and 5.");
      return;
    }
    setActionLoading(true);

    try {
      // Get current developer data
      const { data: devData } = await supabase
        .from("developers")
        .select("rating, total_jobs")
        .eq("id", activeCandidate.id)
        .maybeSingle();

      if (!devData) throw new Error("Developer not found");

      const currentRating = devData.rating || 0;
      const totalJobs = devData.total_jobs || 0;

      // Calculate new average rating
      const newAvgRating =
        totalJobs > 0
          ? (currentRating * totalJobs + newRating) / (totalJobs + 1)
          : newRating;

      // Update developer rating and total_jobs
      const { error: devError } = await supabase
        .from("developers")
        .update({
          rating: newAvgRating,
          total_jobs: totalJobs + 1,
        })
        .eq("id", activeCandidate.id);

      if (devError) throw devError;

      alert(`Rating submitted! New average: ${newAvgRating.toFixed(1)}/5`);
      setNewRating(0);
      loadSubmissions();
      setActiveCandidate(null);
    } catch (err) {
      console.error("Rate error:", err);
      alert("Failed to submit rating.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!activeCandidate) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to reject this submission?"
    );
    if (!confirmed) return;

    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", activeCandidate.submissionId);

      if (error) throw error;

      alert("Submission rejected and removed.");
      loadSubmissions();
      setActiveCandidate(null);
    } catch (err) {
      console.error("Reject error:", err);
      alert("Failed to reject submission.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSubmissions = () => {
    setShowSubmissionsModal(true);
    loadSubmissions();
  };

  return (
    <div className="p-6 max-h-screen overflow-y-auto overflow-x-hidden">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <button
          onClick={handleOpenSubmissions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Submissions
        </button>
      </div>

      {/* Projects Container - Fixed Size with Vertical Scroll */}
      <div className="h-[32rem] overflow-y-auto overflow-x-hidden space-y-4 mb-4 border rounded-lg p-4 bg-gray-50">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-xl shadow p-4 flex justify-between items-center"
          >
            <div>
              <span className="font-medium block">{project.title}</span>
              <span className="text-xs text-gray-400">
                {project.percentage}% completed
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{project.status}</span>
              <button
                onClick={() => {
                  setProjectToDelete(project.id);
                  setShowDeleteModal(true);
                }}
                className="text-sm text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {projects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No projects yet. Create your first project below.</p>
          </div>
        )}
      </div>

      {/* Create Project Card - Below Container */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-medium">Create New Project</h2>
        <p className="text-gray-500 text-sm mt-1">
          Post a new project to receive developer applications.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="mt-3 px-4 py-2 bg-black text-white rounded-lg"
        >
          + Add Project
        </button>
      </div>

      {/* CREATE PROJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">New Project</h3>

            <div>
              <label className="text-sm text-gray-600">Project Name</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Project Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg"
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Total Payment (₹)
              </label>
              <input
                type="number"
                value={totalPay}
                onChange={(e) => setTotalPay(Number(e.target.value))}
                className="w-full mt-1 p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Completion Percentage
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={percentage}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value > 100 || value < 0) return;
                  setPercentage(value);
                }}
                className="w-full mt-1 p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Application Deadline
              </label>
              <input
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Submission Deadline
              </label>
              <input
                type="date"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleCreateProject}
                className="px-4 py-2 rounded-lg bg-black text-white"
              >
                {loading ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-red-600">
              Delete Project
            </h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this project? This action cannot
              be undone.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSIONS MODAL */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Submissions</h2>
              <button
                onClick={() => {
                  setShowSubmissionsModal(false);
                  setOpenIndex(null);
                  setActiveCandidate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden space-y-6">
              {groups.map((group, index) => {
                const total = group.candidates.length;
                const selected = group.candidates.filter(
                  (c) => c.status === "Selected"
                ).length;
                const percentage = Math.round((selected / total) * 100);

                return (
                  <div
                    key={group.projectId}
                    className="bg-gray-50 rounded-xl p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{group.projectTitle}</p>
                        <p className="text-sm text-gray-500">
                          Applied: {total} • Selected: {selected}
                        </p>
                      </div>
<button
  onClick={async () => {
    if (openIndex === index) {
      setOpenIndex(null);
      return;
    }

    setOpenIndex(index);

    // 🔥 SEND PROJECT ID TO FASTAPI MODEL
    await sendProjectToModel(group.projectId);
  }}
  className="px-3 py-1 text-sm border rounded-md bg-white"
>
  {openIndex === index ? "Hide" : "View"}
</button>


                    </div>

                    <div className="mt-3">
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {percentage}% shortlisted
                      </p>
                    </div>

                    {openIndex === index && (
                      <div className="mt-4 space-y-2">
                        {group.candidates.map((c) => (
                          <div
                            key={c.submissionId}
                            onClick={() => {
                              setActiveCandidate(c);
                              setNewRating(0);
                            }}
                            className="flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-white"
                          >
                            <span className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-gray-400" />
                              {c.name}
                            </span>

                            {c.status === "Selected" && (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                <CheckCircle2 className="w-3 h-3" />
                                Selected
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {groups.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No submissions yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAIL MODAL */}
      {activeCandidate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <div className="bg-white w-full max-w-md rounded-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveCandidate(null)}
              className="absolute top-3 right-3 text-gray-400"
            >
              <X />
            </button>

            <h2 className="text-xl font-semibold">{activeCandidate.name}</h2>
            <p className="text-sm text-gray-500 mb-2">{activeCandidate.bio}</p>

            <p className="text-sm mb-2">
              ⭐ Rating: {activeCandidate.rating.toFixed(1)} / 5
            </p>

            <div className="space-y-1 text-sm mb-3">
              <p>
                <Briefcase className="inline w-4 h-4 mr-1" />
                {activeCandidate.experience}
              </p>
              <p>
                <Mail className="inline w-4 h-4 mr-1" />
                {activeCandidate.email}
              </p>
              <p>
                <DollarSign className="inline w-4 h-4 mr-1" />
                {activeCandidate.budget}
              </p>
              <p>Status: {activeCandidate.status}</p>
              <p>
                Availability: {formatAvailability(activeCandidate.availability)}
              </p>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {activeCandidate.skills.map((skill, i) => (
                <span
                  key={i}
                  className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>

            {activeCandidate.resume && (
              <a
                href={activeCandidate.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 w-full px-3 py-2 border rounded-md text-sm mb-4 hover:bg-gray-50"
              >
                <Download className="w-4 h-4" /> View Resume
              </a>
            )}

            {/* Rating Section */}
            <div className="border-t pt-4 mb-4">
              <label className="text-sm font-medium block mb-2">
                Rate this developer (1-5):
              </label>
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewRating(star)}
                    className={`p-2 rounded ${
                      newRating >= star
                        ? "text-yellow-500"
                        : "text-gray-300"
                    }`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
              <button
                onClick={handleRate}
                disabled={actionLoading || newRating === 0}
                className="w-full px-3 py-2 bg-yellow-500 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Rating..." : "Submit Rating"}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleAccept}
                disabled={actionLoading || activeCandidate.accepted}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeCandidate.accepted ? "Already Accepted" : "Accept"}
              </button>


              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="w-full px-3 py-2 bg-red-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Rejecting..." : "Reject"}
              </button>

<button
  type="button"
  onClick={() => {
    if (!activeCandidate) return;

    // Navigate to company messages and pass developerId
    navigate("/company/messages", {
      state: { developerId: activeCandidate.id },
    });
  }}
  disabled={!activeCandidate}
  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
>
  Message
</button>


            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProjects;
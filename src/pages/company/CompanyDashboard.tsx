import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { InsightBadge } from "../../components/ml/InsightBadge";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../supabaseClient";

/* ------------------ Types ------------------ */

interface Project {
  id: string;
  title: string;
  status: string;
  total_pay: number;
  created_at: string;
}

interface DashboardStats {
  activeProjects: number;
  pendingReviews: number;
  budgetSpent: number;
}

/* ------------------ Component ------------------ */

export function CompanyDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    pendingReviews: 0,
    budgetSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  /* ------------------ Fetch Dashboard ------------------ */

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      /* ---- Fetch Projects ---- */
      const { data: projectData, error: projectError } =
        await supabase
          .from("projects")
          .select(`
            id,
            title,
            status,
            total_pay,
            created_at
          `)
          .eq("company_id", user.id)
          .order("created_at", { ascending: false });

      if (projectError) {
        console.error(projectError);
        setLoading(false);
        return;
      }

      setProjects(projectData ?? []);

      /* ---- Fetch Pending Submissions ---- */
      const { count: pendingReviews } = await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .in(
          "project_id",
          projectData?.map((p) => p.id) || []
        )
        .eq("selected", false);

      /* ---- Compute Stats ---- */
      const activeProjects = projectData.filter(
        (p) => p.status !== "completed"
      ).length;

      const budgetSpent = projectData.reduce(
        (sum, p) => sum + (p.total_pay || 0),
        0
      );

      setStats({
        activeProjects,
        pendingReviews: pendingReviews || 0,
        budgetSpent,
      });

      setLoading(false);
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <p className="text-zinc-500">Loading dashboard...</p>;
  }

  /* ------------------ Render ------------------ */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Dashboard
          </h1>
          <p className="text-zinc-500 mt-1">
            Overview of your projects and hiring pipeline
          </p>
        </div>
        <Button onClick={() => navigate("/company/projects")}>
      Create New Project
    </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-4">
              <span className="text-sm text-zinc-500">
                Active Projects
              </span>
              <Badge variant="secondary">
                {stats.activeProjects}
              </Badge>
            </div>
            <div className="text-3xl font-bold">
              {stats.activeProjects}
            </div>
            <div className="text-xs text-zinc-500 mt-2 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-600" />
              Live engagements
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-4">
              <span className="text-sm text-zinc-500">
                Pending Reviews
              </span>
              <Badge variant="warning">
                Action Required
              </Badge>
            </div>
            <div className="text-3xl font-bold">
              {stats.pendingReviews}
            </div>
            <div className="text-xs text-zinc-500 mt-2">
              Awaiting shortlisting
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <span className="text-sm text-zinc-500">
              Budget Allocated
            </span>
            <div className="text-3xl font-bold mt-2">
              ₹{stats.budgetSpent.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500 mt-2">
              Across all projects
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requires Attention */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          Requires Attention
        </h2>

        <div className="max-h-96 overflow-y-auto space-y-4">
          {projects
            .filter(project => project.status !== "Completed")
            .map((project) => (
              <Card key={project.id} className="w-full">
                <CardContent className="p-6 flex gap-6 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">
                        {project.title}
                      </h3>
                      <Badge variant="outline" className="flex-shrink-0">
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-500">
                      Review submissions to proceed.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <InsightBadge
                      label="Priority"
                      score={85}
                    />
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => navigate(`/company/projects`)}
                    >
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          
          {projects.filter(project => project.status !== "Completed").length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
              <p>No ongoing projects require attention</p>
            </div>
          )}
        </div>
      </section>

          </div>
  );
}

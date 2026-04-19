import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  FileText,
  X,
  Download,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { supabase } from "../../supabaseClient";

/* ------------------ Types ------------------ */

interface SubmissionNotification {
  id: string;
  selected: boolean;
  accepted: boolean;
  expected_pay: number | null;
  created_at: string;
  project: {
    title: string;
    company_id: string;
  };
}

/* ------------------ Component ------------------ */

export default function Certificates() {
  const [items, setItems] = useState<SubmissionNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const [developerName, setDeveloperName] = useState("Developer");
  const [companyName, setCompanyName] = useState("");

  const [selectedItem, setSelectedItem] =
    useState<SubmissionNotification | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    /* Developer name */
    const { data: devProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    if (devProfile?.name) {
      setDeveloperName(devProfile.name);
    }

    /* Submissions */
    const { data, error } = await supabase
      .from("submissions")
      .select(`
        id,
        selected,
        accepted,
        expected_pay,
        created_at,
        project:project_id (
          title,
          company_id
        )
      `)
      .eq("developer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data);
    } else {
      console.error(error);
      setItems([]);
    }

    setLoading(false);
  }

  /* Fetch company name when opening certificate */
  async function openCertificate(item: SubmissionNotification) {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", item.project.company_id)
      .single();

    setCompanyName(data?.name ?? "Company");
    setSelectedItem(item);
  }

  function downloadCertificate() {
    window.print();
  }

  if (loading) {
    return <p className="text-zinc-500">Loading notifications…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Notifications</h1>
        <p className="text-zinc-500 mt-1">
          Updates on your project applications
        </p>
      </div>

      {/* Notifications */}
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No notifications available.
        </p>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6 flex gap-6">
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                  {item.accepted ? (
                    <IndianRupee className="w-5 h-5 text-emerald-600" />
                  ) : item.selected ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.accepted ? (
                      <Badge variant="success">Payment Received</Badge>
                    ) : item.selected ? (
                      <Badge variant="info">Selected</Badge>
                    ) : (
                      <Badge variant="warning">Not Selected</Badge>
                    )}
                  </div>

                  <p className="text-sm text-zinc-600">
                    {item.accepted
                      ? `₹${item.expected_pay ?? 0} credited for "${item.project.title}".`
                      : item.selected
                      ? `You were selected for "${item.project.title}".`
                      : `You were not selected for "${item.project.title}".`}
                  </p>

                  <p className="text-xs text-zinc-400 mt-2">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Action */}
                {item.selected && !item.accepted && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex items-center gap-2"
                    onClick={() => openCertificate(item)}
                  >
                    <FileText className="w-4 h-4" />
                    View Certificate
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Certificate Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-10 rounded-lg max-w-3xl w-full relative certificate-print">
            <Button
              variant="ghost"
              className="absolute top-4 right-4 print:hidden"
              onClick={() => setSelectedItem(null)}
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="text-center space-y-5">
              <h2 className="text-3xl font-bold">
                Certificate of Appreciation
              </h2>

              <p className="text-lg">This is proudly presented to</p>

              <p className="text-2xl font-semibold text-indigo-600">
                {developerName}
              </p>

              <p className="text-lg">
                for being selected and contributing to the project
              </p>

              <p className="text-xl font-medium">
                “{selectedItem.project.title}”
              </p>

              <p className="text-lg">
                under <span className="font-semibold">{companyName}</span>
              </p>

              <p className="text-sm text-zinc-500 mt-8">
                Issued on{" "}
                {new Date(
                  selectedItem.created_at
                ).toLocaleDateString()}
              </p>
            </div>

            <div className="flex justify-center gap-4 mt-10 print:hidden">
              <Button onClick={downloadCertificate}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

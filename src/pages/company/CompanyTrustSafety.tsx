import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

const safetyItems = [
  {
    title: "Spam Application Detected",
    description:
      "One developer application triggered automated fraud-detection systems due to abnormal submission behavior and repeated content patterns.",
    status: "Resolved",
    severity: "High",
    icon: ShieldAlert,
    color: "red",
  },
  {
    title: "Late Submission Warning",
    description:
      "A submission exceeded the defined project submission deadline. Review required to determine eligibility or penalty enforcement.",
    status: "Pending",
    severity: "Medium",
    icon: Clock,
    color: "yellow",
  },
  {
    title: "Profile Verification Required",
    description:
      "A developer has not completed mandatory identity and profile verification checks, limiting their eligibility for selection.",
    status: "In Progress",
    severity: "Low",
    icon: AlertTriangle,
    color: "blue",
  },
];

const statusStyles: Record<string, string> = {
  Resolved: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-blue-100 text-blue-700",
};

const severityStyles: Record<string, string> = {
  High: "text-red-600",
  Medium: "text-yellow-600",
  Low: "text-blue-600",
};

const CompanyTrustSafety = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Trust & Safety Center
        </h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Monitor, investigate, and resolve platform integrity,
          compliance, and risk-related incidents across your
          active projects.
        </p>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Total Alerts</p>
          <p className="text-2xl font-semibold">3</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-semibold text-green-600">
            1
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Action Required</p>
          <p className="text-2xl font-semibold text-yellow-600">
            2
          </p>
        </div>
      </div>

      {/* Safety Items */}
      <div className="space-y-4">
        {safetyItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow p-5 flex justify-between items-start"
            >
              <div className="flex gap-4">
                <div
                  className={`p-2 rounded-lg bg-${item.color}-100`}
                >
                  <Icon
                    className={`w-5 h-5 ${severityStyles[item.severity]}`}
                  />
                </div>

                <div>
                  <p className="font-medium">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 max-w-xl">
                    {item.description}
                  </p>

                  <div className="flex gap-3 mt-3 items-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${statusStyles[item.status]}`}
                    >
                      {item.status}
                    </span>

                    <span
                      className={`text-xs font-medium ${severityStyles[item.severity]}`}
                    >
                      Severity: {item.severity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {item.status !== "Resolved" ? (
                  <button className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50">
                    Review
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Closed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompanyTrustSafety;

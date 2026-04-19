import React from "react";
import { Modal } from "../components/ui/Modal";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { 
  FileText, 
  Link as LinkIcon, 
  Github, 
  Figma, 
  Clock,
  Calendar,
  DollarSign,
  ExternalLink
} from "lucide-react";
import { ApplicationData } from "./ApplyModal";

interface ViewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  company: string;
  status: string;
  appliedDate: string;
  applicationData: ApplicationData;
}

export function ViewDetailsModal({
  isOpen,
  onClose,
  projectTitle,
  company,
  status,
  appliedDate,
  applicationData,
}: ViewDetailsModalProps) {
  const { description, links, estimatedHours, availability, expectedAmount } = applicationData;

  const LinkItem = ({ 
    icon: Icon, 
    label, 
    url 
  }: { 
    icon: React.ElementType; 
    label: string; 
    url: string;
  }) => (
    url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group"
      >
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-zinc-200 group-hover:border-indigo-300">
          <Icon className="w-4 h-4 text-zinc-600 group-hover:text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900">{label}</p>
          <p className="text-xs text-zinc-500 truncate">{url}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 flex-shrink-0" />
      </a>
    ) : null
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <Card className="bg-zinc-50 border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900 mb-1">{projectTitle}</h3>
                <p className="text-sm text-zinc-500">{company}</p>
              </div>
              <Badge
                variant={
                  status === "Shortlisted"
                    ? "success"
                    : status === "Under Review"
                    ? "secondary"
                    : "default"
                }
              >
                {status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Applied {appliedDate}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-zinc-600" />
            <h3 className="text-sm font-semibold text-zinc-900">Solution Description</h3>
          </div>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                {description || "No description provided."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Links Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon className="w-4 h-4 text-zinc-600" />
            <h3 className="text-sm font-semibold text-zinc-900">Portfolio & Links</h3>
          </div>
          <div className="space-y-2">
            {links.figma && (
              <LinkItem icon={Figma} label="Figma Design" url={links.figma} />
            )}
            {links.github && (
              <LinkItem icon={Github} label="GitHub Repository" url={links.github} />
            )}
            {!links.figma && !links.github && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-zinc-500 text-center">No links provided</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {(estimatedHours || availability || expectedAmount) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-zinc-600" />
              <h3 className="text-sm font-semibold text-zinc-900">Additional Information</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {estimatedHours && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-zinc-500 mb-1">Estimated Hours</p>
                    <p className="text-sm font-semibold text-zinc-900">{estimatedHours} hours</p>
                  </CardContent>
                </Card>
              )}
              {availability && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-zinc-500 mb-1">Availability</p>
                    <p className="text-sm font-semibold text-zinc-900">{availability}</p>
                  </CardContent>
                </Card>
              )}
              {expectedAmount && (
                <Card className="md:col-span-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-zinc-500" />
                      <p className="text-xs text-zinc-500">Expected Amount/Salary</p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">{expectedAmount}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end pt-4 border-t border-zinc-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

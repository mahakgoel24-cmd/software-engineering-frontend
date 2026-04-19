import React, { useState } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Github, Figma, DollarSign } from "lucide-react";
import { supabase } from "../supabaseClient";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  company: string;
}

export default function ApplyModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  company,
}: ApplyModalProps) {
  const [description, setDescription] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [figmaLink, setFigmaLink] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [availability, setAvailability] = useState("");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const resetModal = () => {
    setDescription("");
    setGithubLink("");
    setFigmaLink("");
    setEstimatedHours("");
    setAvailability("");
    setExpectedAmount("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to apply.");
      return;
    }

    setLoading(true);

    // Insert submission with proper null handling
    const { error } = await supabase.from("submissions").insert({
      project_id: projectId,
      developer_id: user.id,
      github_link: githubLink || null,
      figma_link: figmaLink || null,
      description: description || null,
      expected_pay: expectedAmount || null,
      estimated_hours: estimatedHours || null,
      availability: availability || null,
      selected: false,
      accepted: false,
    });

    setLoading(false);

    if (error) {
      console.error("Submission error:", error.message);
      alert("Failed to submit application. Try again.");
      return;
    }

    alert("Application submitted successfully!");
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-xl p-6 relative shadow-lg">
        <button
          onClick={() => {
            resetModal();
            onClose();
          }}
          className="absolute top-3 right-3 text-gray-400 text-xl font-bold"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{projectTitle}</h2>
          <p className="text-sm text-gray-500">Company: {company}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Describe your approach and experience..."
              className="w-full px-4 py-2 border rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Links */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Figma className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="url"
                value={figmaLink}
                onChange={(e) => setFigmaLink(e.target.value)}
                placeholder="Figma Link"
                className="w-full pl-10 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="url"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                placeholder="GitHub Link"
                className="w-full pl-10 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="Estimated Hours"
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="Availability"
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Expected Amount */}
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={expectedAmount}
              onChange={(e) => setExpectedAmount(e.target.value)}
              placeholder="Expected Amount"
              className="w-full pl-10 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetModal();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

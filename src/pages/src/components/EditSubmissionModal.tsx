import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { X, Edit3, Github, Figma, DollarSign, Clock } from "lucide-react";
import { supabase } from "../supabaseClient";

interface EditSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: {
    id: string;
    description: string;
    github_link: string;
    figma_link: string;
    expected_pay: number;
    estimated_hours: number;
    availability: number;
  };
  onSuccess: () => void;
}

export default function EditSubmissionModal({
  isOpen,
  onClose,
  submission,
  onSuccess,
}: EditSubmissionModalProps) {
  const [description, setDescription] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [figmaLink, setFigmaLink] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [availability, setAvailability] = useState("");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize form with existing submission data
  useEffect(() => {
    if (submission) {
      setDescription(submission.description || "");
      setGithubLink(submission.github_link || "");
      setFigmaLink(submission.figma_link || "");
      setEstimatedHours(submission.estimated_hours?.toString() || "");
      setAvailability(submission.availability?.toString() || "");
      setExpectedAmount(submission.expected_pay?.toString() || "");
    }
  }, [submission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission.id) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("submissions")
        .update({
          description: description.trim(),
          github_link: githubLink.trim(),
          figma_link: figmaLink.trim(),
          estimated_hours: estimatedHours ? parseInt(estimatedHours) : null,
          availability: availability ? parseInt(availability) : null,
          expected_pay: expectedAmount ? parseFloat(expectedAmount) : null,
        })
        .eq("id", submission.id);

      if (error) {
        console.error("Error updating submission:", error);
        alert("Failed to update submission. Please try again.");
        return;
      }

      onSuccess(); // Refresh the data
      onClose();
      alert("Submission updated successfully!");
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription(submission.description || "");
    setGithubLink(submission.github_link || "");
    setFigmaLink(submission.figma_link || "");
    setEstimatedHours(submission.estimated_hours?.toString() || "");
    setAvailability(submission.availability?.toString() || "");
    setExpectedAmount(submission.expected_pay?.toString() || "");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">
                Update Submission
              </h2>
              <p className="text-sm text-zinc-500">
                Edit your project submission details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Project Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Describe your approach to this project..."
              required
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                <Github className="w-4 h-4 inline mr-1" />
                GitHub Repository
              </label>
              <input
                type="url"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://github.com/username/repo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                <Figma className="w-4 h-4 inline mr-1" />
                Figma Design (Optional)
              </label>
              <input
                type="url"
                value={figmaLink}
                onChange={(e) => setFigmaLink(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://figma.com/file/..."
              />
            </div>
          </div>

          {/* Time and Money */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Estimated Hours
              </label>
              <input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="40"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Availability (hours/week)
              </label>
              <input
                type="number"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="20"
                min="1"
                max="168"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Expected Amount
              </label>
              <input
                type="number"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="1000"
                min="1"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-zinc-200">
            <Button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            >
              Reset to Original
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {loading ? "Updating..." : "Update Submission"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

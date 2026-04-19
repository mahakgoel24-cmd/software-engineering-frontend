import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("skills, experience")
        .eq("id", user.id)
        .single();

      if (data) {
        setSkills(data.skills?.join(", ") || "");
        setExperience(data.experience || "");
      }
    };

    loadProfile();
  }, []);

  const saveProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("profiles").update({
      skills: skills.split(",").map((s) => s.trim()),
      experience,
    }).eq("id", user.id);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Your Profile</h2>

        <div>
          <label className="text-sm text-zinc-600">Skills</label>
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, Node, AI, Figma"
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-600">Experience</label>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            rows={4}
            placeholder="Brief about your experience"
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={saveProfile}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

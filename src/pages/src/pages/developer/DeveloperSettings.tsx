import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  User,
  Mail,
  ShieldCheck,
  Star,
  Briefcase,
  Code,
  Bell,
  Edit3,
  Save,
  X,
} from "lucide-react";

import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

/* ---------------- Types ---------------- */

interface Profile {
  name: string;
  email: string;
}

interface Developer {
  skills: string;
  experience: number;
  rating: number;
  total_jobs: number;
  verify: boolean;
  available_balance?: number;
  total_earned?: number;
}

/* ---------------- Component ---------------- */

const DeveloperSettings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingDeveloper, setEditingDeveloper] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState<Profile>({ name: "", email: "" });
  const [developerForm, setDeveloperForm] = useState<Developer>({
    skills: "",
    experience: 0,
    rating: 0,
    total_jobs: 0,
    verify: false,
    available_balance: 0,
    total_earned: 0,
  });
  // Preferences stored in localStorage since they don't exist in database
  const [preferencesForm, setPreferencesForm] = useState({
    notifications_enabled: true,
    job_visibility: true,
  });

  /* ---------------- Fetch Data ---------------- */

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const [{ data: profileData }, { data: developerData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("name, email")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("developers")
            .select(`
              skills,
              experience,
              rating,
              total_jobs,
              verify,
              available_balance,
              total_earned
            `)
            .eq("id", user.id)
            .maybeSingle(),
        ]);

      setProfile(profileData);
      setDeveloper(developerData);
      
      // Initialize form states
      if (profileData) {
        setProfileForm({ name: profileData.name, email: profileData.email });
      }
      if (developerData) {
        setDeveloperForm(developerData);
        // Load preferences from localStorage since they're not in database
        const notificationsEnabled = localStorage.getItem('dev_notifications_enabled') === 'false' ? false : true;
        const jobVisibility = localStorage.getItem('dev_job_visibility') === 'false' ? false : true;
        
        setPreferencesForm({
          notifications_enabled: notificationsEnabled,
          job_visibility: jobVisibility,
        });
      } else {
        // Fallback to localStorage for all preferences
        const notificationsEnabled = localStorage.getItem('dev_notifications_enabled') === 'false' ? false : true;
        const jobVisibility = localStorage.getItem('dev_job_visibility') === 'false' ? false : true;
        
        setPreferencesForm({
          notifications_enabled: notificationsEnabled,
          job_visibility: jobVisibility,
        });
      }
      
      setLoading(false);
    };

    loadSettings();
  }, []);

  /* ---------------- Handlers ---------------- */
  
  const handleSaveProfile = async () => {
    setSaving(true);
    
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("profiles")
        .update({ name: profileForm.name })
        .eq("id", user.id);
      
      if (error) throw error;
      
      setProfile(profileForm);
      setEditingProfile(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  
  const handleSaveDeveloper = async () => {
    setSaving(true);
    
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("developers")
        .update({ 
          skills: developerForm.skills,
          experience: developerForm.experience
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      setDeveloper(developerForm);
      setEditingDeveloper(false);
      alert("Developer profile updated successfully!");
    } catch (error) {
      console.error("Error updating developer profile:", error);
      alert("Failed to update developer profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  
  const handlePreferenceToggle = (preference: 'notifications_enabled' | 'job_visibility', value: boolean) => {
    // Store preferences in localStorage since they don't exist in database
    localStorage.setItem(`dev_${preference}`, value.toString());
    
    // Update local state
    setPreferencesForm(prev => ({ ...prev, [preference]: value }));
    
    const preferenceName = preference === 'notifications_enabled' ? 'Notifications' : 'Job Visibility';
    const status = value ? 'enabled' : 'disabled';
    console.log(`${preferenceName} ${status} (saved locally)`);
  };
  
  const handleCancelEdit = (section: 'profile' | 'developer') => {
    if (section === 'profile') {
      setProfileForm(profile!);
      setEditingProfile(false);
    } else {
      setDeveloperForm(developer!);
      setEditingDeveloper(false);
    }
  };

  if (loading) {
    return <p className="text-zinc-500">Loading settings...</p>;
  }

  if (!profile || !developer) {
    return <p className="text-zinc-500">Settings unavailable.</p>;
  }

  /* ---------------- Render ---------------- */

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Developer Settings
      </h1>

      <Card>
        <CardContent className="p-6 space-y-8">
          {/* ---------------- Profile ---------------- */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">
                Profile
              </h2>
              {!editingProfile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingProfile(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>

            {editingProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Email (read-only)
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="w-full px-3 py-2 border border-zinc-200 bg-zinc-50 rounded-lg text-zinc-500"
                    placeholder="Your email"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Email cannot be changed</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCancelEdit('profile')}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-zinc-600">
                <p className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <strong>Name:</strong> {profile.name}
                </p>

                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <strong>Email:</strong> {profile.email}
                </p>
              </div>
            )}
          </section>

          {/* ---------------- Developer Info ---------------- */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">
                Developer Profile
              </h2>
              {!editingDeveloper && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingDeveloper(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>

            {editingDeveloper ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Skills
                  </label>
                  <textarea
                    value={developerForm.skills}
                    onChange={(e) => setDeveloperForm({ ...developerForm, skills: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Describe your skills (e.g., React, Node.js, Python...)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    value={developerForm.experience}
                    onChange={(e) => setDeveloperForm({ ...developerForm, experience: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Years of experience"
                    min="0"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveDeveloper}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCancelEdit('developer')}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Code className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium">Skills</span>
                  </div>
                  <p className="text-zinc-600">
                    {developer.skills || "Not specified"}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium">Experience</span>
                  </div>
                  <p className="text-zinc-600">
                    {developer.experience} years
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">Rating</span>
                  </div>
                  <p className="text-zinc-600">
                    {developer.rating} / 5
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Rating cannot be modified</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium">Verification</span>
                  </div>
                  <Badge
                    variant={
                      developer.verify ? "secondary" : "outline"
                    }
                  >
                    {developer.verify
                      ? "Verified"
                      : "Not Verified"}
                  </Badge>
                </div>
              </div>
            )}
          </section>

          {/* ---------------- Preferences ---------------- */}
          <section>
            <h2 className="text-lg font-medium mb-3">
              Preferences
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  <div>
                    <span className="text-sm font-medium block">
                      Notifications
                    </span>
                    <span className="text-xs text-zinc-500">
                      Receive project updates
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handlePreferenceToggle('notifications_enabled', !preferencesForm.notifications_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferencesForm.notifications_enabled
                      ? 'bg-indigo-600'
                      : 'bg-zinc-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferencesForm.notifications_enabled
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-sm font-medium block">
                      Job Visibility
                    </span>
                    <span className="text-xs text-zinc-500">
                      Show profile to companies
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handlePreferenceToggle('job_visibility', !preferencesForm.job_visibility)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferencesForm.job_visibility
                      ? 'bg-emerald-600'
                      : 'bg-zinc-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferencesForm.job_visibility
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-zinc-50 rounded-lg">
              <p className="text-xs text-zinc-600">
                <strong>Note:</strong> Changes to preferences are saved automatically and take effect immediately.
              </p>
            </div>
          </section>

          {/* ---------------- Security ---------------- */}
          <section>
            <h2 className="text-lg font-medium mb-3">
              Security
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-zinc-700" />
                  <span className="text-sm font-medium">
                    Account Status
                  </span>
                </div>
                <Badge variant="secondary">
                  Secure
                </Badge>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeveloperSettings;

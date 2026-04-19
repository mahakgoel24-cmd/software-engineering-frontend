import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Bell, Globe } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

interface Profile {
  name: string;
  email: string;
  location: string;
}

interface CompanyPreferences {
  notifications_enabled: boolean;
  project_visibility: boolean;
}

const CompanySettings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Profile>({
    name: '',
    email: '',
    location: 'India'
  });
  // Preferences stored in localStorage since they don't exist in database
  const [preferencesForm, setPreferencesForm] = useState<CompanyPreferences>({
    notifications_enabled: true,
    project_visibility: true,
  });

  /* ---------------- Fetch Profile ---------------- */

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch failed:", error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          location: 'India'
        });
        // Load preferences from localStorage
        const notificationsEnabled = localStorage.getItem('company_notifications_enabled') === 'false' ? false : true;
        const projectVisibility = localStorage.getItem('company_project_visibility') === 'false' ? false : true;
        
        setPreferencesForm({
          notifications_enabled: notificationsEnabled,
          project_visibility: projectVisibility,
        });
      }
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handlePreferenceToggle = (preference: 'notifications_enabled' | 'project_visibility', value: boolean) => {
    // Store preferences in localStorage
    localStorage.setItem(`company_${preference}`, value.toString());
    
    // Update local state
    setPreferencesForm(prev => ({ ...prev, [preference]: value }));
    
    const preferenceName = preference === 'notifications_enabled' ? 'Notifications' : 'Project Visibility';
    const status = value ? 'enabled' : 'disabled';
    console.log(`${preferenceName} ${status} (saved locally)`);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('You must be logged in to update settings.');
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        name: formData.name,
        email: formData.email,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Update failed:', error.message);
      alert('Failed to update profile. Please try again.');
    } else {
      alert('Profile updated successfully!');
      setProfile(prev => prev ? { ...prev, name: formData.name, email: formData.email, location: formData.location } : null);
    }
    
    setSaving(false);
  };

  if (loading) {
    return <p className="text-zinc-500">Loading settings...</p>;
  }

  if (!profile) {
    return <p className="text-zinc-500">Profile not found.</p>;
  }

  /* ---------------- Render ---------------- */

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Settings
      </h1>

      <Card>
        <CardContent className="p-6 space-y-8">
          {/* ---------------- Company Profile ---------------- */}
          <section>
            <h2 className="text-lg font-medium mb-4">
              Company Profile
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="Enter location"
                />
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </section>

          {/* ---------------- Preferences ---------------- */}
          <section>
            <h2 className="text-lg font-medium mb-4">
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
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-sm font-medium block">
                      Project Visibility
                    </span>
                    <span className="text-xs text-zinc-500">
                      Show projects to developers
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handlePreferenceToggle('project_visibility', !preferencesForm.project_visibility)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferencesForm.project_visibility
                      ? 'bg-emerald-600'
                      : 'bg-zinc-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferencesForm.project_visibility
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

        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySettings;

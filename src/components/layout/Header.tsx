import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Bell, User } from "lucide-react";
import { Button } from "../ui/Button";
import { supabase } from "../../supabaseClient";
import { ProfileModal } from "../profile/ProfileModal";

interface Profile {
  name: string;
  role: "developer" | "company";
  username: string;
}

interface SearchResult {
  id: string;
  title?: string;
  name?: string;
}

export function Header() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("name, role, username")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
    };

    loadProfile();
  }, []);

  /* ---------------- ROLE-BASED SEARCH ---------------- */
  useEffect(() => {
    if (!query || !profile) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);

      if (profile.role === "developer") {
        // 🔍 Developers search PROJECTS
        const { data } = await supabase
          .from("projects")
          .select("id, title")
          .ilike("title", `%${query}%`)
          .limit(5);

        setResults(data || []);
      }

      if (profile.role === "company") {
        // 🔍 Companies search DEVELOPERS by name
        const { data } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("role", "developer")
          .ilike("name", `%${query}%`)
          .limit(5);

        setResults(data || []);
      }

      setLoading(false);
    }, 300); // debounce

    return () => clearTimeout(timeout);
  }, [query, profile]);

  const handleProfileClick = () => {
    if (profile?.role === "developer") {
      navigate("/developer/settings");
    } else if (profile?.role === "company") {
      navigate("/company/settings");
    }
  };

  const handleBellClick = () => {
    if (profile?.role === "developer") {
      navigate("/developer/notifications/certificates");
    } else if (profile?.role === "company") {
      navigate("/company/notifications");
    }
  };

  return (
    <>
      <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20 px-6 flex items-center justify-between">
        {/* SEARCH */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              profile?.role === "developer"
                ? "Search projects..."
                : "Search developers..."
            }
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
          />

          {/* RESULTS */}
          {query && (
            <div className="absolute mt-2 w-full bg-white border rounded-lg shadow-lg z-30">
              {loading && (
                <p className="px-4 py-2 text-sm text-zinc-500">
                  Searching...
                </p>
              )}

              {!loading && results.length === 0 && (
                <p className="px-4 py-2 text-sm text-zinc-500">
                  No results found
                </p>
              )}

              {!loading &&
                results.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-2 text-sm hover:bg-zinc-100 cursor-pointer"
                    onClick={() => {
                      if (profile?.role === "developer") {
                        navigate(`/developer/explore-projects?projectId=${item.id}`);
                      } else {
                        // For companies, navigate to developer profile
                        navigate(`/developer/profile/${item.id}`);
                      }
                    }}
                  >
                    {profile?.role === "developer"
                      ? item.title
                      : item.name}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative"
            onClick={handleBellClick}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          <div className="h-8 w-px bg-zinc-200" />

          <button
            onClick={handleProfileClick}
            className="flex items-center gap-3"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-zinc-900">
                {profile?.name}
              </p>
              <p className="text-xs text-zinc-500 capitalize">
                {profile?.role}
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-zinc-100 border flex items-center justify-center">
              <User className="w-4 h-4 text-zinc-600" />
            </div>
          </button>
        </div>
      </header>

      {/* 🔒 Developer-only modal */}
      {open && profile?.role === "developer" && (
        <ProfileModal onClose={() => setOpen(false)} />
      )}
    </>
  );
}

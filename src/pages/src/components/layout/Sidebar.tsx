import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  Bell,
  Settings,
  Wallet,
  Compass,
  FileText,
  ShieldCheck,
  Users,
  MessageCircle,
  LogOut
} from "lucide-react";

interface SidebarProps {
  role: "company" | "developer";
}

export function Sidebar({ role }: SidebarProps) {
  // Company links
  const companyLinks = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/company", end: true },
    { icon: Briefcase, label: "Projects", to: "/company/projects" },
    { icon: Users, label: "Employee Information", to: "/company/employee-information" },
    { icon: MessageCircle, label: "Messages", to: "/company/messages" },
    { icon: ShieldCheck, label: "Trust & Safety", to: "/company/trust-safety" },
    { icon: Settings, label: "Settings", to: "/company/settings" },
  ];

  // Developer links
  const developerLinks = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/developer", end: true },
    { icon: Compass, label: "Explore Projects", to: "/developer/explore-projects" },
    { icon: FileText, label: "My Applications", to: "/developer/my-applications" },
    { icon: Wallet, label: "Earnings", to: "/developer/earnings" },
    { icon: MessageCircle, label: "Messages", to: "/developer/messages" },
    { icon: Bell, label: "Certificates", to: "/developer/notifications/certificates" },
    { icon: Settings, label: "Settings", to: "/developer/settings" },
  ];

  const links = role === "company" ? companyLinks : developerLinks;

  return (
    <aside className="w-64 border-r border-zinc-200 bg-zinc-50/50 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-30 hidden md:flex">
      {/* Logo */}
      <div className="p-6 h-16 flex items-center border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full" />
          </div>
          <span className="font-bold text-zinc-900 tracking-tight">TalentBridge</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "text-zinc-900 bg-white shadow-sm ring-1 ring-zinc-200"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 w-1 h-5 bg-zinc-900 rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <link.icon className={cn("w-4 h-4", isActive ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-600")} />
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-4 border-t border-zinc-200 space-y-1">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </NavLink>
      </div>
    </aside>
  );
}

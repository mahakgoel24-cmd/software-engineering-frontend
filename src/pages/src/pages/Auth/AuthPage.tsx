// src/pages/Auth/AuthPage.tsx
// Merged: AuthPage UI/design system + Login.tsx & Signup.tsx Supabase logic & fields

import { useState, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Users } from 'lucide-react';
import { supabase } from '../../supabaseClient';

// ── Icons ─────────────────────────────────────────────────────────────────────

const EyeIcon = ({ off }: { off: boolean }) =>
  off ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

// ── Field ─────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  showToggle?: boolean;
  show?: boolean;
  onToggle?: () => void;
}

function Field({ label, type = 'text', placeholder, value, onChange, showToggle, show, onToggle }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold tracking-wide uppercase text-zinc-700">
        {label}
      </label>
      <div className="relative">
        <input
          type={showToggle ? (show ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className="
            w-full box-border
            bg-zinc-50 border border-zinc-200 rounded-lg
            py-2 px-3 text-sm text-zinc-900 outline-none
            placeholder:text-zinc-400
            focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100
            transition-all duration-200
          "
          style={{ paddingRight: showToggle ? 44 : 18 }}
        />
        {showToggle && (
          <button
            onClick={onToggle}
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-zinc-500 p-0 flex hover:text-zinc-700 transition-colors"
          >
            <EyeIcon off={!!show} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Role Selector ─────────────────────────────────────────────────────────────
// Uses "Developer" | "Company" roles from Login.tsx & Signup.tsx

type Role = 'Developer' | 'Company';

interface RoleSelectorProps {
  value: Role;
  onChange: (r: Role) => void;
}

const ROLES: { id: Role; label: string; icon: typeof GraduationCap }[] = [
  { id: 'Developer', label: 'Developer', icon: GraduationCap },
  { id: 'Company',   label: 'Company',   icon: Users },
];

function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold tracking-wide uppercase text-zinc-700">
        Role
      </label>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map(role => {
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onChange(role.id)}
              className={`
                flex items-center justify-center gap-2 py-2 px-3
                rounded-lg cursor-pointer transition-all duration-200
                ${value === role.id
                  ? 'bg-zinc-100 border border-zinc-300 shadow-sm'
                  : 'bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                }
              `}
            >
              <Icon size={14} className="text-zinc-600" />
              <span className={`text-xs font-semibold ${value === role.id ? 'text-zinc-900' : 'text-zinc-600'}`}>
                {role.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Error ─────────────────────────────────────────────────────────────────────

const ErrorMsg = ({ msg }: { msg: string }) =>
  msg ? (
    <p className="text-xs text-red-600 mt-1 text-center bg-red-50 border border-red-200 rounded-lg py-2 px-3">
      {msg}
    </p>
  ) : null;

// ── CTA Button ────────────────────────────────────────────────────────────────

const CtaBtn = ({
  children,
  onClick,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="
      mt-4 w-full py-3 rounded-lg
      bg-zinc-900 text-white
      border-none font-semibold text-sm
      cursor-pointer transition-all duration-200
      shadow-sm hover:bg-zinc-800 hover:shadow-md
      disabled:opacity-60 disabled:cursor-not-allowed
    "
  >
    {children}
  </button>
);

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive initial mode from URL (/signup → signup, else login)
  const getInitialMode = (): 'login' | 'signup' => {
    if (location.pathname === '/signup') return 'signup';
    return 'login';
  };

  const [mode, setMode] = useState<'login' | 'signup'>(getInitialMode());
  const isSignup = mode === 'signup';

  // ── Login state ──────────────────────────────────────────────────────────────
  const [loginEmail,   setLoginEmail]   = useState('');
  const [loginPw,      setLoginPw]      = useState('');
  const [loginRole,    setLoginRole]    = useState<Role>('Developer');
  const [showLoginPw,  setShowLoginPw]  = useState(false);
  const [loginError,   setLoginError]   = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Signup state ─────────────────────────────────────────────────────────────
  const [signupName,     setSignupName]     = useState('');
  const [signupEmail,    setSignupEmail]    = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPw,       setSignupPw]       = useState('');
  const [signupCf,       setSignupCf]       = useState('');
  const [signupRole,     setSignupRole]     = useState<Role>('Developer');
  const [showSignupPw,   setShowSignupPw]   = useState(false);
  const [showSignupCf,   setShowSignupCf]   = useState(false);
  const [signupError,    setSignupError]    = useState('');
  const [signupLoading,  setSignupLoading]  = useState(false);

  // ── Switch mode (clear errors & password visibility) ─────────────────────────
  const switchMode = (next: 'login' | 'signup') => {
    setMode(next);
    setLoginError('');
    setSignupError('');
    setShowLoginPw(false);
    setShowSignupPw(false);
    setShowSignupCf(false);
  };

  // ── Supabase Login (from Login.tsx) ──────────────────────────────────────────
  const handleLogin = async () => {
    setLoginError('');
    if (!loginEmail || !loginPw) {
      setLoginError('Please fill in all fields.');
      return;
    }
    setLoginLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPw,
      });

      if (authError) throw authError;
      if (!data.user) throw new Error('Login failed');

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) throw userError || new Error('Role fetch failed');

      // Role-based navigation (matches both Login.tsx and AuthPage role structure)
      const role: string = userData.role;
      if (role === 'company')   navigate('/company',   { replace: true });
      else                      navigate('/developer', { replace: true });
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Supabase Signup (from Signup.tsx) ────────────────────────────────────────
  const handleSignup = async () => {
    setSignupError('');

    if (!signupName || !signupEmail || !signupUsername || !signupPw || !signupCf) {
      setSignupError('Please fill in all fields.');
      return;
    }
    if (signupPw.length < 8) {
      setSignupError('Password must be at least 8 characters.');
      return;
    }
    if (signupPw !== signupCf) {
      setSignupError('Passwords do not match.');
      return;
    }

    setSignupLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPw,
      });

      if (authError) throw authError;
      if (!data.user) throw new Error('Signup failed');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id:       data.user.id,
          email:    signupEmail,
          name:     signupName,
          username: signupUsername,
          role:     signupRole.toLowerCase(), // 'developer' | 'company'
        });

      if (profileError) throw profileError;

      signupRole === 'Company'
        ? navigate('/company',   { replace: true })
        : navigate('/developer', { replace: true });
    } catch (err: any) {
      setSignupError(err.message || 'Signup failed');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-zinc-50 p-4 relative overflow-hidden"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (isSignup) handleSignup();
          else handleLogin();
        }
      }}
    >
      {/* Background decorative lines */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent"
            style={{ top: `${i * 8.5}%` }}
          />
        ))}
      </div>

      
      {/* Card */}
      <div className="w-full max-w-4xl grid grid-cols-2 rounded-xl overflow-hidden relative z-10 border border-zinc-200 shadow-xl min-h-[580px] bg-white">

        {/* ── Sign Up Form (left panel) ────────────────────────────────────────── */}
        <div
          className={`
            bg-white p-10 box-border flex flex-col justify-center
            transition-all duration-400 ease-in-out z-10
            ${isSignup
              ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto delay-180'
              : 'opacity-0 -translate-x-3 scale-95 pointer-events-none delay-0'
            }
          `}
        >
          <div className="mb-2">
            <p className="text-xs font-bold tracking-wider uppercase text-zinc-500 mb-2">
              Get Started
            </p>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">
              Create Account
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Choose your role and start immediately.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            {/* Role selector — Developer | Company */}
            <RoleSelector value={signupRole} onChange={setSignupRole} />

            {/* Full Name */}
            <Field
              label="Full Name"
              placeholder="Your full name"
              value={signupName}
              onChange={setSignupName}
            />

            {/* Email */}
            <Field
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={signupEmail}
              onChange={setSignupEmail}
            />

            {/* Username */}
            <Field
              label="Username"
              placeholder="yourhandle"
              value={signupUsername}
              onChange={setSignupUsername}
            />

            {/* Password + Confirm side-by-side */}
            <div className="grid grid-cols-2 gap-2">
              <Field
                label="Password"
                showToggle
                show={showSignupPw}
                onToggle={() => setShowSignupPw(v => !v)}
                placeholder="Min 8 chars"
                value={signupPw}
                onChange={setSignupPw}
              />
              <Field
                label="Confirm"
                showToggle
                show={showSignupCf}
                onToggle={() => setShowSignupCf(v => !v)}
                placeholder="Repeat"
                value={signupCf}
                onChange={setSignupCf}
              />
            </div>
          </div>

          <ErrorMsg msg={signupError} />
          <CtaBtn onClick={handleSignup} loading={signupLoading}>
            {signupLoading ? 'Creating account…' : 'Create Account →'}
          </CtaBtn>
        </div>

        {/* ── Log In Form (right panel) ────────────────────────────────────────── */}
        <div
          className={`
            bg-white p-10 box-border flex flex-col justify-center
            transition-all duration-400 ease-in-out z-10
            ${!isSignup
              ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto delay-180'
              : 'opacity-0 translate-x-3 scale-95 pointer-events-none delay-0'
            }
          `}
        >
          <div className="mb-2">
            <p className="text-xs font-bold tracking-wider uppercase text-zinc-500 mb-2">
              Welcome Back
            </p>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">
              Sign In
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Log in to continue to your workspace.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            {/* Role selector shown for context; role is verified from DB after login */}
            <RoleSelector value={loginRole} onChange={setLoginRole} />

            {/* Email */}
            <Field
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={loginEmail}
              onChange={setLoginEmail}
            />

            {/* Password */}
            <Field
              label="Password"
              showToggle
              show={showLoginPw}
              onToggle={() => setShowLoginPw(v => !v)}
              placeholder="••••••••"
              value={loginPw}
              onChange={setLoginPw}
            />
          </div>

          
          <ErrorMsg msg={loginError} />
          <CtaBtn onClick={handleLogin} loading={loginLoading}>
            {loginLoading ? 'Signing in…' : 'Sign In →'}
          </CtaBtn>
        </div>

        {/* ── Sliding overlay panel ────────────────────────────────────────────── */}
        <div
          className={`
            absolute top-0 w-1/2 h-full
            bg-zinc-100
            transition-all duration-550 ease-[cubic-bezier(0.77,0,0.18,1)]
            z-20 flex flex-col items-center justify-center
            p-10 box-border text-center overflow-hidden
            ${isSignup ? 'left-1/2' : 'left-0'}
          `}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-[20%] -right-[20%] w-60 h-60 rounded-full bg-zinc-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-[20%] -left-[15%] w-[200px] h-[200px] rounded-full bg-zinc-300/20 blur-2xl pointer-events-none" />

          {/* Decorative line grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-zinc-300/50"
                style={{ top: `${i * 13}%` }}
              />
            ))}
          </div>

          <div className="relative z-10">
            {/* Logo mark - Talent Bridge branding */}
            <div className="flex items-center justify-center mx-auto mb-6">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full" />
                <span className="text-white font-bold text-lg tracking-tight">TalentBridge</span>
              </div>
            </div>

            
            <h2 className="text-2xl font-bold text-zinc-900 leading-tight mb-3 whitespace-pre-line">
              {isSignup ? 'Already have\nan account?' : 'New here?'}
            </h2>

            <p className="text-sm text-zinc-600 leading-relaxed max-w-xs mx-auto mb-7">
              {isSignup
                ? 'Log in to continue and access your workspace.'
                : 'Create an account as a Developer or Company and get started right away.'}
            </p>

            <button
              onClick={() => switchMode(isSignup ? 'login' : 'signup')}
              className="
                bg-white border-2 border-zinc-300 rounded-lg text-zinc-900
                py-3 px-8 text-sm font-semibold cursor-pointer
                tracking-wide uppercase transition-all duration-200
                hover:bg-zinc-50 hover:border-zinc-400 hover:shadow-md
              "
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>

            <div className="mt-8 pt-6 border-t border-zinc-300">
              <p className="text-xs text-zinc-500 tracking-wide leading-relaxed">
                Build.<br />Ship.<br />Grow.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Global styles */}
      <style>{`
        @media (max-width: 640px) {
          .auth-card { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  Headphones,
  KeyRound,
  UserPen,
  LogOut,
  UserCircle,
  X,
  Send,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

type ActivePanel = "support" | "password" | "username" | null;

interface PasswordFieldProps {
  label: string;
  field: "current" | "new" | "confirm";
  value: string;
  showPassword: boolean;
  onToggleShow: (field: "current" | "new" | "confirm") => void;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function PasswordField({
  label,
  field,
  value,
  showPassword,
  onToggleShow,
  onChange,
  disabled,
}: PasswordFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          required
          disabled={disabled}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-11 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => onToggleShow(field)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function ProfileSidebar() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [supportForm, setSupportForm] = useState<{ phone: string; message: string }>({ 
    phone: "", 
    message: "" 
  });
  
  const [passwordForm, setPasswordForm] = useState<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // Explicitly typed state
  const [usernameForm, setUsernameForm] = useState<{ newUsername: string }>({
    newUsername: user?.name ?? "",
  });

  const [showPassword, setShowPassword] = useState<{
    current: boolean;
    new: boolean;
    confirm: boolean;
  }>({
    current: false,
    new: false,
    confirm: false,
  });

  const toggleShow = (field: "current" | "new" | "confirm"): void =>
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));

  // Explicitly typed updater to fix Vercel's strict 'undefined' error
  useEffect(() => {
    const name: string = user?.name || "";
    if (!name) return;

    setUsernameForm((prev: { newUsername: string }): { newUsername: string } => {
      if (prev.newUsername) return prev;
      return { newUsername: name };
    });
  }, [user?.name]);

  const closePanel = (): void => {
    setActivePanel(null);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPassword({ current: false, new: false, confirm: false });
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to send a support message.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "support",
          phone: supportForm.phone,
          message: supportForm.message,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Support request failed.");
      }

      setSupportForm({ phone: "", message: "" });
      alert("Support ticket submitted successfully!");
      closePanel();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Support request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to update your password.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "password",
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Password update failed.");
      }

      alert("Password updated successfully!");
      closePanel();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Password update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to update your username.");
      return;
    }

    const trimmedUsername: string = usernameForm.newUsername.trim();
    if (!trimmedUsername) {
      alert("Username cannot be empty.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "username",
          newUsername: trimmedUsername,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Username update failed.");
      }

      updateUser({ name: trimmedUsername });
      setUsernameForm({ newUsername: trimmedUsername });
      alert(`Username changed to: ${trimmedUsername}`);
      closePanel();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Username update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <aside className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col lg:w-full">
        <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <UserCircle className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.name || "My Account"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user?.email || "Manage settings"}
            </p>
          </div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1.5">
            <li>
              <button
                type="button"
                onClick={() => setActivePanel("support")}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  activePanel === "support"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Headphones className="h-4 w-4 text-slate-400" />
                  <span>Customer Support</span>
                </div>
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => setActivePanel("password")}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  activePanel === "password"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                  <span>Change Password</span>
                </div>
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => setActivePanel("username")}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  activePanel === "username"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserPen className="h-4 w-4 text-slate-400" />
                  <span>Change Username</span>
                </div>
              </button>
            </li>
          </ul>
        </nav>

        <div className="pt-5 mt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100/70"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {activePanel && (
        <div
          onClick={closePanel}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity"
        />
      )}

      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out ${
          activePanel ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {activePanel === "support" && "Customer Support"}
            {activePanel === "password" && "Change Password"}
            {activePanel === "username" && "Change Username"}
          </h2>
          <button
            type="button"
            onClick={closePanel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6">
          {activePanel === "support" && (
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={supportForm.phone}
                  onChange={(e) =>
                    setSupportForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Message / Issue Details
                </label>
                <textarea
                  rows={5}
                  placeholder="Describe your issue or request here..."
                  required
                  value={supportForm.message}
                  onChange={(e) =>
                    setSupportForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit Request
              </button>
            </form>
          )}

          {activePanel === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <PasswordField
                label="Current Password"
                field="current"
                value={passwordForm.currentPassword}
                showPassword={showPassword.current}
                onToggleShow={toggleShow}
                disabled={isSubmitting}
                onChange={(v) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: v }))
                }
              />

              <PasswordField
                label="New Password"
                field="new"
                value={passwordForm.newPassword}
                showPassword={showPassword.new}
                onToggleShow={toggleShow}
                disabled={isSubmitting}
                onChange={(v) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: v }))
                }
              />

              <PasswordField
                label="Confirm New Password"
                field="confirm"
                value={passwordForm.confirmPassword}
                showPassword={showPassword.confirm}
                onToggleShow={toggleShow}
                disabled={isSubmitting}
                onChange={(v) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: v }))
                }
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Update Password
              </button>
            </form>
          )}

          {activePanel === "username" && (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Username
                </label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="Enter new username"
                  value={usernameForm.newUsername}
                  onChange={(e) =>
                    setUsernameForm({
                      newUsername: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Save Username
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
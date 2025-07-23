"use client";

import { useState, useEffect } from "react";
import { authAPI, settingsAPI, usersAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppDispatch";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import {
  FiUser,
  FiLock,
  FiShield,
  FiBell,
  FiLink,
  FiMonitor,
  FiTrash2,
} from "react-icons/fi";
import { getProfile } from "@/store/slices/authSlice";

const TABS = [
  { label: "Profile", icon: FiUser },
  { label: "Password", icon: FiLock },
  { label: "Privacy", icon: FiShield },
  { label: "Notifications", icon: FiBell },
  { label: "Connected Accounts", icon: FiLink },
  { label: "Theme", icon: FiMonitor },
  { label: "Delete Account", icon: FiTrash2 },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();

  if (!user)
    return (
      <div className="text-center py-8">Please log in to view settings.</div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="p-6 flex justify-center">
        <div className="max-w-5xl w-full flex flex-col md:flex-row gap-8">
          {/* Settings Sidebar styled like DashboardSidebar */}
          <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 pt-0 pb-0 overflow-y-auto border-r border-gray-200 bg-white z-10">
            <div className="flex flex-col items-center justify-center py-4 bg-gray-50 border-b border-gray-200">
              <span className="text-2xl font-bold text-primary-600 tracking-tight">
                Settings
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Manage your account
              </span>
            </div>
            <nav className="mt-6 px-4 space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab.label}
                  className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors gap-3 mb-1
                    ${
                      activeTab === tab.label
                        ? "bg-primary-100 text-primary-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  onClick={() => setActiveTab(tab.label)}
                >
                  <tab.icon
                    className={`h-5 w-5 ${
                      activeTab === tab.label
                        ? "text-primary-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>
          {/* Content */}
          <section className="flex-1 md:ml-64">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
              <h1 className="text-2xl font-bold mb-6">{activeTab}</h1>
              {activeTab === "Profile" && (
                <>
                  <ProfileForm />
                </>
              )}
              {activeTab === "Password" && (
                <>
                  <PasswordForm />
                </>
              )}
              {activeTab === "Privacy" && (
                <>
                  <PrivacyForm userId={user._id} />
                </>
              )}
              {activeTab === "Notifications" && (
                <>
                  <NotificationsForm userId={user._id} />
                </>
              )}
              {activeTab === "Connected Accounts" && (
                <>
                  <ConnectedAccountsForm userId={user._id} />
                </>
              )}
              {activeTab === "Theme" && (
                <>
                  <ThemeForm userId={user._id} />
                </>
              )}
              {activeTab === "Delete Account" && (
                <>
                  <DeleteAccountForm userId={user._id} />
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ProfileForm() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    location: "",
    company: "",
    socialLinks: {
      github: "",
      linkedin: "",
      website: "",
    },
    skills: "", 
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.avatar || ""
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await authAPI.getProfile();
        const user = res.data.data;
        setForm({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          bio: user.bio || "",
          location: user.location || "",
          company: user.company || "",
          socialLinks: {
            github: user.socialLinks?.github || "",
            linkedin: user.socialLinks?.linkedin || "",
            website: user.socialLinks?.website || "",
          },
          skills: user.skills ? user.skills.join(", ") : "",
        });
        setAvatarPreview(user.avatar || "");
      } catch (err) {
        toast.error("Failed to load profile");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("socialLinks.")) {
      setForm({
        ...form,
        socialLinks: {
          ...form.socialLinks,
          [name.split(".")[1]]: value,
        },
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authAPI.updateProfile({
        ...form,
        skills: form.skills
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
      });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    }
    setSubmitting(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarUploading(true);
    try {
      const res = await usersAPI.uploadAvatar(avatarFile);
      setAvatarPreview(res.data.avatar);
      toast.success("Profile picture updated!");
      dispatch(getProfile()); // Refresh user state in Redux
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload avatar");
    }
    setAvatarUploading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Avatar Upload */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Profile Picture
        </label>
        <div className="flex items-center gap-4">
          <img
            src={avatarPreview || "/default-avatar.png"}
            alt="Avatar Preview"
            className="w-16 h-16 rounded-full object-cover border"
          />
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
          <button
            type="button"
            className="bg-primary-600 text-white px-3 py-1 rounded"
            onClick={handleAvatarUpload}
            disabled={avatarUploading || !avatarFile}
          >
            {avatarUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">First Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="text"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Last Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="text"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          disabled
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Bio</label>
        <textarea
          className="w-full border rounded px-3 py-2"
          name="bio"
          rows={3}
          value={form.bio}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="text"
          name="location"
          value={form.location}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Company</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="text"
          name="company"
          value={form.company}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Skills{" "}
          <span className="text-xs text-gray-400">(comma separated)</span>
        </label>
        <input
          className="w-full border rounded px-3 py-2"
          type="text"
          name="skills"
          value={form.skills}
          onChange={handleChange}
          placeholder="e.g. React, Node.js, MongoDB"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">GitHub</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="text"
          name="socialLinks.github"
          value={form.socialLinks.github}
          onChange={handleChange}
          placeholder="https://github.com/username"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">LinkedIn</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="text"
          name="socialLinks.linkedin"
          value={form.socialLinks.linkedin}
          onChange={handleChange}
          placeholder="https://linkedin.com/in/username"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Website</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="text"
          name="socialLinks.website"
          value={form.socialLinks.website}
          onChange={handleChange}
          placeholder="https://yourwebsite.com"
        />
      </div>
      <button
        type="submit"
        className="bg-primary-600 text-white px-4 py-2 rounded"
        disabled={submitting}
      >
        {submitting ? "Updating..." : "Update Profile"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authAPI.changePassword(form);
      toast.success("Password changed!");
      setForm({ currentPassword: "", newPassword: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    }
    setSubmitting(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium mb-1">
          Current Password
        </label>
        <input
          className="w-full border rounded px-3 py-2"
          type="password"
          name="currentPassword"
          value={form.currentPassword}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">New Password</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
        />
      </div>
      <button
        type="submit"
        className="bg-primary-600 text-white px-4 py-2 rounded"
        disabled={submitting}
      >
        {submitting ? "Changing..." : "Change Password"}
      </button>
    </form>
  );
}

function PrivacyForm({ userId }: { userId: string }) {
  const [form, setForm] = useState({
    isPrivate: false,
    allowMessagesFrom: "everyone",
    allowFollowsFrom: "everyone",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPrivacy = async () => {
      setLoading(true);
      try {
        const res = await settingsAPI.getPrivacy(userId);
        setForm({
          isPrivate: res.data.data.isPrivate,
          allowMessagesFrom: res.data.data.allowMessagesFrom,
          allowFollowsFrom: res.data.data.allowFollowsFrom,
        });
      } catch (err) {
        toast.error("Failed to load privacy settings");
      }
      setLoading(false);
    };
    fetchPrivacy();
  }, [userId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      setForm({ ...form, [name]: e.target.checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await settingsAPI.updatePrivacy(userId, form);
      toast.success("Privacy settings updated!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update privacy settings"
      );
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium mb-1">
          Private Account
        </label>
        <input
          type="checkbox"
          name="isPrivate"
          checked={form.isPrivate}
          onChange={handleChange}
        />
        <span className="ml-2">
          Only approved followers can see your posts and profile.
        </span>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Who can message you?
        </label>
        <select
          name="allowMessagesFrom"
          value={form.allowMessagesFrom}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="everyone">Everyone</option>
          <option value="followers">Followers only</option>
          <option value="noone">No one</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Who can follow you?
        </label>
        <select
          name="allowFollowsFrom"
          value={form.allowFollowsFrom}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="everyone">Everyone</option>
          <option value="noone">No one</option>
        </select>
      </div>
      <button
        type="submit"
        className="bg-primary-600 text-white px-4 py-2 rounded"
        disabled={submitting}
      >
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

function NotificationsForm({ userId }: { userId: string }) {
  const [form, setForm] = useState({
    email: true,
    push: true,
    marketing: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await settingsAPI.getNotifications(userId);
        setForm({
          email: res.data.data.email,
          push: res.data.data.push,
          marketing: res.data.data.marketing,
        });
      } catch (err) {
        toast.error("Failed to load notification preferences");
      }
      setLoading(false);
    };
    fetchNotifications();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm({ ...form, [name]: checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await settingsAPI.updateNotifications(userId, form);
      toast.success("Notification preferences updated!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to update notification preferences"
      );
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium mb-1">
          Email Notifications
        </label>
        <input
          type="checkbox"
          name="email"
          checked={form.email}
          onChange={handleChange}
        />
        <span className="ml-2">Receive important updates via email.</span>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Push Notifications
        </label>
        <input
          type="checkbox"
          name="push"
          checked={form.push}
          onChange={handleChange}
        />
        <span className="ml-2">Get real-time push notifications.</span>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Marketing Emails
        </label>
        <input
          type="checkbox"
          name="marketing"
          checked={form.marketing}
          onChange={handleChange}
        />
        <span className="ml-2">Receive news, tips, and offers.</span>
      </div>
      <button
        type="submit"
        className="bg-primary-600 text-white px-4 py-2 rounded"
        disabled={submitting}
      >
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

function ConnectedAccountsForm({ userId }: { userId: string }) {
  const [form, setForm] = useState({
    github: "",
    linkedin: "",
    twitter: "",
    website: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const res = await settingsAPI.getConnectedAccounts(userId);
        setForm({
          github: res.data.data.github || "",
          linkedin: res.data.data.linkedin || "",
          twitter: res.data.data.twitter || "",
          website: res.data.data.website || "",
        });
      } catch (err) {
        toast.error("Failed to load connected accounts");
      }
      setLoading(false);
    };
    fetchAccounts();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await settingsAPI.updateConnectedAccounts(userId, form);
      toast.success("Connected accounts updated!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update connected accounts"
      );
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium mb-1">GitHub</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="text"
          name="github"
          value={form.github}
          onChange={handleChange}
          placeholder="GitHub profile URL or username"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">LinkedIn</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="text"
          name="linkedin"
          value={form.linkedin}
          onChange={handleChange}
          placeholder="LinkedIn profile URL or username"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Twitter</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="text"
          name="twitter"
          value={form.twitter}
          onChange={handleChange}
          placeholder="Twitter profile URL or username"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Website</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="text"
          name="website"
          value={form.website}
          onChange={handleChange}
          placeholder="Personal website URL"
        />
      </div>
      <button
        type="submit"
        className="bg-primary-600 text-white px-4 py-2 rounded"
        disabled={submitting}
      >
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

function ThemeForm({ userId }: { userId: string }) {
  const [theme, setTheme] = useState("system");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTheme = async () => {
      setLoading(true);
      try {
        const res = await settingsAPI.getTheme(userId);
        setTheme(res.data.data);
      } catch (err) {
        toast.error("Failed to load theme setting");
      }
      setLoading(false);
    };
    fetchTheme();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await settingsAPI.updateTheme(userId, { theme });
      toast.success("Theme updated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update theme");
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <select
          name="theme"
          value={theme}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <button
        type="submit"
        className="bg-primary-600 text-white px-4 py-2 rounded"
        disabled={submitting}
      >
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

function DeleteAccountForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    )
      return;
    setLoading(true);
    try {
      await settingsAPI.deleteAccount(userId);
      toast.success("Account deleted. Goodbye!");
      // Clear auth state and localStorage
      localStorage.removeItem("token");
      // Optionally clear userId, etc.
      // localStorage.removeItem('userId')
      // Redirect to homepage or login
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete account");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-red-600 font-medium">
        Warning: Deleting your account is permanent and cannot be undone.
      </p>
      <button
        className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-60"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? "Deleting..." : "Delete My Account"}
      </button>
    </div>
  );
}

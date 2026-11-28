import React, { useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  updateCurrentUserProfile,
  getUserVideoTasks,
  getCustomerPortalUrl,
  useQuery,
} from "wasp/client/operations";
import { routes } from "wasp/client/router";
import type { User, VideoTask } from "wasp/entities";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  MapPin,
  Calendar,
  Plus,
  Sparkles,
  Crown,
  Link as LinkIcon,
  Trash2,
  X,
  ExternalLink,
  Camera,
  Copy,
  Check,
  CreditCard,
  Film,
  Download,
  Loader2,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { logout } from "wasp/client/auth";
import { getUserAvatarUrl, DEFAULT_USER_AVATAR } from "./defaultAvatar";
import { PaymentPlanId, prettyPaymentPlanName } from "../payment/plans";
import { creditCostForResolution } from "../video-studio/taskSync";

interface AccountPageProps {
  user: User;
}

export function AccountPage({ user }: AccountPageProps) {
  const navigate = useNavigate();

  // Real data: tasks and customer portal
  const { data: videoTasks, isLoading: isTasksLoading } = useQuery(getUserVideoTasks);
  const { data: customerPortalUrl } = useQuery(getCustomerPortalUrl);

  // Filter state for video tasks
  const [taskFilter, setTaskFilter] = useState<"all" | "completed" | "processing">("all");

  // Compute clean initial display values from the authenticated user
  const initialDisplayName = useMemo(() => {
    if (user.name?.trim()) return user.name.trim();
    if (user.username?.trim()) return user.username.trim();
    if (user.email?.trim()) return user.email.split("@")[0];
    return "Creator";
  }, [user.name, user.username, user.email]);

  const initialUsername = useMemo(() => {
    if (user.username?.trim()) return user.username.trim();
    if (user.email?.trim())
      return user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
    return "creator";
  }, [user.username, user.email]);

  // Local state initialized from the authenticated user entity
  const [profile, setProfile] = useState({
    name: user.name || initialDisplayName,
    showNamePublicly: user.showNamePublicly ?? true,
    username: user.username || initialUsername,
    avatarUrl: user.avatarUrl || DEFAULT_USER_AVATAR,
    headline: user.headline || "",
    bio: user.bio || "",
    location: user.location || "",
    socialLinks: user.socialLinks || "",
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);

  // Parse social links if present
  const parsedSocials = useMemo(() => {
    try {
      if (!profile.socialLinks) return [];
      const data = JSON.parse(profile.socialLinks);
      return Array.isArray(data) ? data : [];
    } catch {
      return profile.socialLinks
        ? [{ platform: "Website", url: profile.socialLinks }]
        : [];
    }
  }, [profile.socialLinks]);

  // Format member since date
  const memberSinceText = useMemo(() => {
    if (!user.createdAt) return "October 2025";
    const date = new Date(user.createdAt);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [user.createdAt]);

  const planName = useMemo(() => {
    if (user.subscriptionStatus === "active" && user.subscriptionPlan) {
      return prettyPaymentPlanName(user.subscriptionPlan as PaymentPlanId);
    }
    return "Free Tier";
  }, [user.subscriptionPlan, user.subscriptionStatus]);

  const isSubscribed = user.subscriptionStatus === "active";

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!videoTasks) return [];
    if (taskFilter === "completed") {
      return videoTasks.filter(
        (t) => (t.status || "").toUpperCase() === "COMPLETED"
      );
    }
    if (taskFilter === "processing") {
      return videoTasks.filter(
        (t) =>
          (t.status || "").toUpperCase() === "PROCESSING" ||
          (t.status || "").toUpperCase() === "PENDING"
      );
    }
    return videoTasks;
  }, [videoTasks, taskFilter]);

  const completedCount = useMemo(() => {
    return (
      videoTasks?.filter((t) => (t.status || "").toUpperCase() === "COMPLETED")
        .length ?? 0
    );
  }, [videoTasks]);

  const processingCount = useMemo(() => {
    return (
      videoTasks?.filter(
        (t) =>
          (t.status || "").toUpperCase() === "PROCESSING" ||
          (t.status || "").toUpperCase() === "PENDING"
      ).length ?? 0
    );
  }, [videoTasks]);

  const handleProfileSaved = (updated: typeof profile) => {
    setProfile(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("fayaa_user_avatar", updated.avatarUrl);
      } catch {
        // ignore
      }
    }
  };

  const handleCopyProfileLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/account`;
      navigator.clipboard?.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyVideoUrl = (taskId: string, url: string) => {
    if (typeof window !== "undefined" && url) {
      navigator.clipboard?.writeText(url);
      setCopiedTaskId(taskId);
      setTimeout(() => setCopiedTaskId(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090a] text-white flex flex-col font-sans selection:bg-fy-accent selection:text-black">
      {/* 1. Global Dark Header */}
      <header className="h-14 border-b border-[#1c1c22] bg-[#09090a]/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
        {/* Left: Brand + Nav Items */}
        <div className="flex items-center gap-5">
          <Link to="/studio" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-fy-amber via-fy-accent to-fy-rose flex items-center justify-center font-black text-black text-sm shadow-[0_0_15px_rgba(255,91,31,0.3)] transition-transform group-hover:scale-105">
              ⚡
            </div>
            <span className="font-bold tracking-tight text-sm text-white group-hover:text-fy-accent transition-colors">
              FAYAA
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-4 text-xs text-[#8e8e96]">
            <Link
              to="/"
              className="hover:text-white transition-colors"
            >
              Explore
            </Link>
            <Link
              to="/studio"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>Video Studio</span>
              <span className="text-[9px] bg-fy-accent/15 border border-fy-accent/30 text-fy-accent font-bold px-1.5 py-0.5 rounded leading-none">
                Genjutsu
              </span>
            </Link>
            <Link
              to={routes.PricingPageRoute.to}
              className="hover:text-white transition-colors"
            >
              Pricing
            </Link>
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <Link
            to={routes.PricingPageRoute.to}
            className="flex items-center gap-1.5 bg-fy-surface-2 border border-[#2b2b35] hover:border-fy-accent/40 text-fy-accent text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Get Credits</span>
          </Link>

          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-1.5 bg-fy-surface-2 border border-[#2b2b35] hover:border-red-500/40 text-zinc-300 hover:text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            title="Log out of your account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>

          {/* User profile avatar thumbnail */}
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-fy-accent transition-colors focus:outline-none cursor-pointer"
            title="Edit profile"
          >
            <img
              src={profile.avatarUrl || getUserAvatarUrl(user)}
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </header>

      {/* 2. Sub-header: Back link only (no visitor simulation) */}
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/studio");
            }
          }}
          className="flex items-center gap-1 text-xs text-[#8e8e96] hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* 3. Main Account Layout: Left Sidebar + Right Content */}
      <main className="max-w-[1400px] w-full mx-auto px-6 py-4 flex-1 flex flex-col md:flex-row gap-12">
        {/* Left Profile Sidebar (~320px) */}
        <aside className="w-full md:w-[320px] shrink-0 flex flex-col">
          {/* Avatar with diamond badge */}
          <div className="relative w-28 h-28 mb-5 group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#26262e] bg-[#141418] shadow-xl">
              <img
                src={profile.avatarUrl || getUserAvatarUrl(user)}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Level / Points Diamond Badge */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#17171d] border border-[#2b2b36] rounded-full px-2.5 py-0.5 flex items-center gap-1 text-[11px] font-semibold text-white shadow-md">
              <span className="text-[#a1a1aa] text-[9px]">◆</span>
              <span>{user.credits ?? 0}</span>
            </div>

            {/* Quick edit overlay */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              title="Change avatar"
            >
              <Camera className="w-6 h-6 text-white drop-shadow" />
            </button>
          </div>

          {/* Name & Handle */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
              {profile.name || profile.username || "Creator"}
            </h1>
            <p className="text-xs text-[#888892] mt-0.5">@{profile.username}</p>
          </div>

          {/* Real Metrics Row: Tasks, Completed, Processing, Ratio */}
          <div className="grid grid-cols-4 gap-2 py-3 border-y border-[#18181f] text-center my-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">
                {videoTasks?.length ?? 0}
              </span>
              <span className="text-[10px] text-[#71717a]">Tasks</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-emerald-400">
                {completedCount}
              </span>
              <span className="text-[10px] text-[#71717a]">Completed</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-amber-400">
                {processingCount}
              </span>
              <span className="text-[10px] text-[#71717a]">In Flight</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-fy-accent">
                30/$1
              </span>
              <span className="text-[10px] text-[#71717a]">Rate</span>
            </div>
          </div>

          {/* Subscription & Credit Wallet Card */}
          <div className="mt-3 p-4 rounded-2xl bg-gradient-to-b from-[#141419] to-[#0f0f13] border border-[#23232c] shadow-lg">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8e8e96]">
                Plan & Credits
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isSubscribed
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/10 text-[#a1a1aa] border border-white/10"
                }`}
              >
                {isSubscribed ? "Active Member" : "Free Starter"}
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-sm font-bold text-white truncate pr-2">
                {planName}
              </h3>
              <div className="flex items-center gap-1 text-sm font-black text-fy-accent">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{(user.credits ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#71717a] mb-3">
              5s at 720p: Light {creditCostForResolution("720p", "light", 5)} credits • Pro{" "}
              {creditCostForResolution("720p", "pro", 5)} credits
            </p>

            <div className="space-y-2">
              <Link
                to={routes.PricingPageRoute.to}
                className="w-full bg-fy-accent hover:bg-[#d8ff33] text-black text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Top Up / Upgrade Plan</span>
              </Link>

              {customerPortalUrl ? (
                <a
                  href={customerPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#18181f] hover:bg-[#22222b] border border-[#292936] text-[#a1a1aa] hover:text-white text-xs font-medium py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Manage Billing & Invoices</span>
                </a>
              ) : null}
            </div>
          </div>

          {/* Action Buttons: Edit profile + Copy profile link */}
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 bg-[#16161b] hover:bg-[#202027] border border-[#252530] text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>Edit profile</span>
            </button>

            <button
              type="button"
              onClick={handleCopyProfileLink}
              className="p-2.5 rounded-xl border border-[#252530] bg-[#16161b] hover:bg-[#202027] text-[#9e9ea7] hover:text-white transition-all cursor-pointer"
              title={copiedLink ? "Link copied!" : "Copy profile link"}
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-fy-accent" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => void logout()}
              className="p-2.5 rounded-xl border border-red-500/25 bg-[#16161b] hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-3"
              title="Log out of your account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Headline / Bio Snippet */}
          <div className="mt-5">
            {profile.headline ? (
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                {profile.headline}
              </p>
            ) : (
              <p className="text-xs text-[#52525b] italic">
                No headline set. Click "Edit profile" to add one.
              </p>
            )}
            {profile.bio && (
              <p className="text-xs text-[#71717a] mt-2 whitespace-pre-line leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Location & Member Info */}
          <div className="mt-6 space-y-3 text-xs text-[#8e8e96]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 hover:text-white transition-colors text-left w-full group cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#71717a] group-hover:text-fy-accent transition-colors shrink-0" />
              <span>{profile.location || "Add your location"}</span>
            </button>

            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#71717a] shrink-0" />
              <span>Member since {memberSinceText}</span>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="mt-6">
            {parsedSocials.length > 0 ? (
              <div className="space-y-2 mb-3">
                {parsedSocials.map((s: any, idx: number) => (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-xs text-[#a1a1aa] hover:text-fy-accent bg-[#121217] border border-[#1f1f26] rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <span className="truncate">{s.platform || s.url}</span>
                    <ExternalLink className="w-3 h-3 text-[#71717a]" />
                  </a>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setIsSocialModalOpen(true)}
              className="w-full border border-dashed border-[#262632] hover:border-white/30 text-[#8e8e96] hover:text-white text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {parsedSocials.length > 0 ? "Edit links" : "Add Social links"}
              </span>
            </button>
          </div>

          {/* Quick Sign Out Action */}
          <div className="mt-8 pt-4 border-t border-[#1f1f26]">
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full bg-[#141418] hover:bg-red-500/10 border border-[#23232c] hover:border-red-500/30 text-zinc-400 hover:text-red-400 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content Area: My Video Creations */}
        <section className="flex-1 flex flex-col min-w-0">
          {/* Section Header with filter buttons and New Video button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#181820] pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  My Video Creations
                </h2>
                <span className="text-xs bg-[#1a1a22] text-fy-accent font-semibold px-2 py-0.5 rounded-full border border-[#2a2a36]">
                  {videoTasks?.length ?? 0}
                </span>
              </div>
              <p className="text-xs text-[#8e8e96] mt-0.5">
                Motion transfer and video-to-video generations from FAYAA Studio
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {/* Task filters */}
              <div className="flex items-center gap-1 bg-[#121216] border border-[#23232c] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTaskFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    taskFilter === "all"
                      ? "bg-white text-black shadow-sm"
                      : "text-[#8e8e96] hover:text-white"
                  }`}
                >
                  All ({videoTasks?.length ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter("completed")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    taskFilter === "completed"
                      ? "bg-emerald-500 text-black shadow-sm"
                      : "text-[#8e8e96] hover:text-white"
                  }`}
                >
                  Completed ({completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter("processing")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    taskFilter === "processing"
                      ? "bg-amber-400 text-black shadow-sm"
                      : "text-[#8e8e96] hover:text-white"
                  }`}
                >
                  In Flight ({processingCount})
                </button>
              </div>

              <Link
                to="/studio"
                className="bg-fy-accent hover:bg-[#d8ff33] text-black text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>New Video</span>
              </Link>
            </div>
          </div>

          {/* Video Creations Grid / States */}
          {isTasksLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-fy-accent animate-spin mb-3" />
              <p className="text-xs text-[#8e8e96]">Loading your video creations...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-20 px-6 text-center border border-dashed border-[#23232e] rounded-2xl bg-[#0f0f13] flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-[#16161c] border border-[#2b2b36] flex items-center justify-center mb-4 text-[#8e8e96]">
                <Film className="w-7 h-7 text-[#71717a]" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                {taskFilter === "all"
                  ? "No video creations yet"
                  : taskFilter === "completed"
                  ? "No completed videos found"
                  : "No in-flight video tasks"}
              </h3>
              <p className="text-xs text-[#71717a] mt-1.5 max-w-sm">
                {taskFilter === "all"
                  ? "Generate motion transfer animations and portrait videos using Genjutsu Light (6 creds/s) or Genjutsu Pro (12 creds/s)."
                  : "All completed tasks will appear here with direct playback, MP4 download, and shareable links."}
              </p>
              <Link
                to="/studio"
                className="mt-5 inline-flex items-center gap-1.5 bg-fy-accent hover:bg-[#d8ff33] text-black text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch Video Studio</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTasks.map((task: VideoTask) => {
                const status = (task.status || "PENDING").toUpperCase();
                const isCompleted = status === "COMPLETED";
                const isProcessing = status === "PROCESSING" || status === "PENDING";
                const isPro = task.model === "pro";

                return (
                  <div
                    key={task.id}
                    className="bg-[#111116] border border-[#21212a] hover:border-[#32323f] rounded-2xl overflow-hidden flex flex-col transition-all shadow-md group"
                  >
                    {/* Media Display Area */}
                    <div className="relative aspect-[9/16] bg-black overflow-hidden flex items-center justify-center">
                      {isCompleted && task.outputVideoUrl ? (
                        <video
                          src={task.outputVideoUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                      ) : isProcessing ? (
                        <div className="flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                          <Loader2 className="w-8 h-8 text-fy-accent animate-spin mb-3" />
                          <span className="text-xs font-semibold text-white">
                            Synthesizing Motion
                          </span>
                          <span className="text-[11px] text-[#71717a] mt-1">
                            Genjutsu {isPro ? "Pro" : "Light"} in progress
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                          <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                          <span className="text-xs font-semibold text-white">
                            Generation Failed
                          </span>
                          <span className="text-[11px] text-[#71717a] mt-1">
                            Credits refunded if applicable
                          </span>
                        </div>
                      )}

                      {/* Top Overlay Badges */}
                      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-white">
                          {isPro ? "Genjutsu Pro" : "Genjutsu Light"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md border ${
                            isCompleted
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : isProcessing
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>

                    {/* Task Metadata & Actions */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-[#8e8e96] mb-1">
                          <span>{task.resolution || "720p"}</span>
                          <span>
                            {task.createdAt
                              ? new Date(task.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
                          {task.prompt || "Motion transfer video generation"}
                        </p>
                      </div>

                      {/* Card Action Buttons */}
                      {isCompleted && task.outputVideoUrl ? (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-[#1d1d25]">
                          <a
                            href={task.outputVideoUrl}
                            download={`fayaa-${task.id}.mp4`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-[#181820] hover:bg-[#22222d] border border-[#2a2a38] text-white text-[11px] font-semibold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-[#a1a1aa]" />
                            <span>Download MP4</span>
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopyVideoUrl(task.id, task.outputVideoUrl!)
                            }
                            className="p-1.5 rounded-lg border border-[#2a2a38] bg-[#181820] hover:bg-[#22222d] text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
                            title={
                              copiedTaskId === task.id
                                ? "Link copied!"
                                : "Copy video link"
                            }
                          >
                            {copiedTaskId === task.id ? (
                              <Check className="w-3.5 h-3.5 text-fy-accent" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-[#1d1d25] flex items-center justify-between text-[11px] text-[#71717a]">
                          <span>ID: {task.id.slice(0, 8)}...</span>
                          <Link
                            to="/studio"
                            className="text-fy-accent hover:underline"
                          >
                            Open in Studio →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* 5. Edit Profile Modal Dialog */}
      {isEditModalOpen && (
        <EditProfileModal
          initialProfile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleProfileSaved}
        />
      )}

      {/* 6. Social Links Modal Dialog */}
      {isSocialModalOpen && (
        <SocialLinksModal
          initialSocials={parsedSocials}
          onClose={() => setIsSocialModalOpen(false)}
          onSave={(linksString) => {
            setProfile((prev) => ({ ...prev, socialLinks: linksString }));
            setIsSocialModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Edit Profile Modal Component (Matches Screenshot 2)
// -------------------------------------------------------------
interface EditProfileModalProps {
  initialProfile: {
    name: string;
    showNamePublicly: boolean;
    username: string;
    avatarUrl: string;
    headline: string;
    bio: string;
    location: string;
    socialLinks: string;
  };
  onClose: () => void;
  onSave: (updated: EditProfileModalProps["initialProfile"]) => void;
}

function EditProfileModal({
  initialProfile,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(initialProfile.name);
  const [showNamePublicly, setShowNamePublicly] = useState(
    initialProfile.showNamePublicly,
  );
  const [username, setUsername] = useState(initialProfile.username);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [headline, setHeadline] = useState(initialProfile.headline);
  const [bio, setBio] = useState(initialProfile.bio);
  const [location, setLocation] = useState(initialProfile.location);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local image file picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage("Avatar file size must be under 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        setErrorMessage("");
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle image URL prompt
  const handlePromptUrl = () => {
    const url = window.prompt("Enter image URL for your avatar:", avatarUrl);
    if (url && url.trim()) {
      setAvatarUrl(url.trim());
    }
  };

  // Handle reset to default avatar
  const handleResetAvatar = () => {
    setAvatarUrl(DEFAULT_USER_AVATAR);
  };

  // Save operation handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      await updateCurrentUserProfile({
        name,
        showNamePublicly,
        username,
        avatarUrl,
        headline,
        bio,
        location,
        socialLinks: initialProfile.socialLinks,
      });

      onSave({
        name,
        showNamePublicly,
        username,
        avatarUrl,
        headline,
        bio,
        location,
        socialLinks: initialProfile.socialLinks,
      });

      onClose();
    } catch (err: any) {
      console.error("Failed to update profile", err);
      setErrorMessage(
        err?.message ||
          "Failed to save profile. Please check that username is unique.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-[#141418] border border-[#272733] rounded-2xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#202029]">
          <h2 className="text-base font-semibold text-white">Edit profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#71717a] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-5">
          {/* 1. Profile Picture Row */}
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-2">
              Profile picture
            </label>
            <div className="flex items-center gap-3">
              {/* Avatar thumbnail with camera hover */}
              <div
                className="relative w-14 h-14 rounded-full overflow-hidden border border-[#2f2f3d] bg-[#1a1a22] shrink-0 cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  src={avatarUrl || DEFAULT_USER_AVATAR}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Action buttons: Link + Trash */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePromptUrl}
                  className="p-2.5 rounded-xl bg-[#1d1d24] hover:bg-[#272733] border border-[#2b2b3a] text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
                  title="Paste Image URL"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleResetAvatar}
                  className="p-2.5 rounded-xl bg-[#1d1d24] hover:bg-rose-950/30 border border-[#2b2b3a] text-[#a1a1aa] hover:text-rose-400 transition-colors cursor-pointer"
                  title="Reset to default avatar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Name + Show Publicly toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="edit-name"
                className="text-xs font-medium text-[#a1a1aa]"
              >
                Name
              </label>

              {/* Toggle switch for show publicly */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8e8e96]">Show publicly</span>
                <button
                  type="button"
                  onClick={() => setShowNamePublicly(!showNamePublicly)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    showNamePublicly ? "bg-fy-accent" : "bg-[#272733]"
                  }`}
                >
                  <div
                    className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      showNamePublicly ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-[#1b1b22] border border-[#2b2b3a] focus:border-white/30 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none transition-colors"
            />

            <p className="text-[11px] text-[#71717a] mt-1.5">
              {showNamePublicly
                ? "Visible. Visitors will see your real name."
                : `Hidden. Visitors see @${username || "username"} instead`}
            </p>
          </div>

          {/* 3. Username */}
          <div>
            <label
              htmlFor="edit-username"
              className="block text-xs font-medium text-[#a1a1aa] mb-1.5"
            >
              Username
            </label>
            <input
              id="edit-username"
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              placeholder="username"
              className="w-full bg-[#1b1b22] border border-[#2b2b3a] focus:border-white/30 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none transition-colors font-mono"
            />
          </div>

          {/* 4. Headline */}
          <div>
            <label
              htmlFor="edit-headline"
              className="block text-xs font-medium text-[#a1a1aa] mb-1.5"
            >
              Headline
            </label>
            <input
              id="edit-headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Examples: Film Director, Film Creator"
              className="w-full bg-[#1b1b22] border border-[#2b2b3a] focus:border-white/30 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none transition-colors"
            />
            <p className="text-[11px] text-[#71717a] mt-1.5">
              Examples: Film Director, Film Creator
            </p>
          </div>

          {/* 5. Bio */}
          <div>
            <label
              htmlFor="edit-bio"
              className="block text-xs font-medium text-[#a1a1aa] mb-1.5"
            >
              Bio
            </label>
            <textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 300))}
              rows={4}
              placeholder="Type bio text here"
              className="w-full bg-[#1b1b22] border border-[#2b2b3a] focus:border-white/30 text-white text-sm rounded-xl p-3 outline-none transition-colors resize-none"
            />
            <p className="text-[11px] text-[#71717a] mt-1 text-right">
              {bio.length} / 300
            </p>
          </div>

          {/* 6. Location */}
          <div>
            <label
              htmlFor="edit-location"
              className="block text-xs font-medium text-[#a1a1aa] mb-1.5"
            >
              Location
            </label>
            <input
              id="edit-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you based?"
              className="w-full bg-[#1b1b22] border border-[#2b2b3a] focus:border-white/30 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none transition-colors"
            />
          </div>

          {/* Action Buttons: Cancel and Save */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#202029]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="bg-[#1f1f26] hover:bg-[#2a2a35] text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#d4d4d8] hover:bg-white text-black text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Social Links Modal Component
// -------------------------------------------------------------
interface SocialLinksModalProps {
  initialSocials: Array<{ platform: string; url: string }>;
  onClose: () => void;
  onSave: (linksJson: string) => void;
}

function SocialLinksModal({
  initialSocials,
  onClose,
  onSave,
}: SocialLinksModalProps) {
  const [links, setLinks] = useState(
    initialSocials.length > 0
      ? initialSocials
      : [
          { platform: "X (Twitter)", url: "" },
          { platform: "Instagram", url: "" },
          { platform: "YouTube", url: "" },
          { platform: "Website", url: "" },
        ],
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = (idx: number, url: string) => {
    setLinks((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, url } : item)),
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const validLinks = links.filter((l) => l.url.trim().length > 0);
    const jsonString = JSON.stringify(validLinks);

    try {
      await updateCurrentUserProfile({ socialLinks: jsonString });
      onSave(jsonString);
    } catch (err) {
      console.error("Failed to save social links", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#141418] border border-[#272733] rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between pb-3 border-b border-[#202029]">
          <h2 className="text-base font-semibold text-white">
            Add social links
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#71717a] hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-3.5">
          {links.map((link, idx) => (
            <div key={idx}>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                {link.platform}
              </label>
              <input
                type="url"
                value={link.url}
                onChange={(e) => handleUpdate(idx, e.target.value)}
                placeholder={`https://${link.platform.toLowerCase().replace(/[^a-z]/g, "")}.com/...`}
                className="w-full bg-[#1b1b22] border border-[#2b2b3a] focus:border-white/30 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none"
              />
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#202029]">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#1f1f26] text-white text-xs px-4 py-2 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-fy-accent text-black text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Links"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { User, Car, LogOut, ChevronRight, UserCircle } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function NavAuth() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (!isLoaded) {
    return (
      <div className="ml-2 md:ml-4 border-l border-gray-200 pl-4 md:pl-6 flex items-center">
        <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="ml-2 md:ml-4 border-l border-gray-200 pl-4 md:pl-6 flex items-center">
      {!isSignedIn ? (
        <Link
          href="/auth"
          className="flex items-center gap-2 text-gray-500 hover:text-[#0553BA] transition-colors cursor-pointer group p-2"
        >
          <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold hidden md:block">Sign In</span>
        </Link>
      ) : (
        <div ref={menuRef} className="relative">
          {/* Avatar trigger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[#0553BA]/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0553BA]/20 focus:ring-offset-2"
            aria-label="Profile menu"
            id="profile-menu-trigger"
          >
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName || "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0553BA] to-[#033B85] flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {(user?.firstName?.[0] || "U").toUpperCase()}
                </span>
              </div>
            )}
          </button>

          {/* Dropdown menu */}
          {open && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              style={{
                animation: "profileDropIn 0.2s ease-out",
              }}
            >
              {/* User header */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#0553BA]/10">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.fullName || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0553BA] to-[#033B85] flex items-center justify-center">
                        <span className="text-white font-bold text-base">
                          {(user?.firstName?.[0] || "U").toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-[#054752] truncate">
                      {user?.fullName || "User"}
                    </p>
                    <p className="text-xs text-[#708C91] truncate">
                      {user?.primaryEmailAddress?.emailAddress || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <ProfileMenuItem
                  href="/dashboard"
                  icon={<Car className="w-5 h-5" />}
                  label="Your rides"
                  onClick={() => setOpen(false)}
                />
                <ProfileMenuItem
                  href="/profile"
                  icon={<UserCircle className="w-5 h-5" />}
                  label="Profile"
                  onClick={() => setOpen(false)}
                />
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 pt-1">
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut({ redirectUrl: "/" });
                  }}
                  className="w-full flex items-center gap-3.5 px-5 py-3 text-left hover:bg-red-50/60 transition-colors cursor-pointer group"
                  id="profile-menu-logout"
                >
                  <LogOut className="w-5 h-5 text-[#708C91] group-hover:text-red-500 transition-colors" />
                  <span className="text-[15px] font-semibold text-[#054752] group-hover:text-red-600 transition-colors flex-1">
                    Log out
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-400 transition-colors" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dropdown animation keyframes */}
      <style jsx global>{`
        @keyframes profileDropIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Menu Item Component ─── */
function ProfileMenuItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3.5 px-5 py-3 hover:bg-[#F0F7FF]/60 transition-colors cursor-pointer group"
    >
      <span className="text-[#708C91] group-hover:text-[#0553BA] transition-colors">
        {icon}
      </span>
      <span className="text-[15px] font-semibold text-[#054752] flex-1">
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0553BA] transition-colors" />
    </Link>
  );
}

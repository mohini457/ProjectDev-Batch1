"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, PlusCircle } from "lucide-react";
import NavAuth from "@/components/ui/nav-auth";

export default function Navbar() {
  const pathname = usePathname();

  // Hide navbar on auth and publish pages
  if (pathname.startsWith("/auth") || pathname.startsWith("/publish")) return null;

  return (
    <>
      <header className="flex justify-center items-center h-20 w-full bg-white z-50 fixed top-0 left-0 right-0 border-b border-gray-100">
        <div className="w-full max-w-7xl flex justify-between items-center px-4 lg:px-8">
          <div className="flex items-center">
            <Link href="/">
              <Image src="/logo.jpeg" alt="Carvaan Go" width={400} height={120} className="h-[60px] w-auto object-contain" priority />
            </Link>
          </div>

          <nav className="flex items-center gap-2 md:gap-6">
            <Link href="/search" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-gray-500 hover:text-brand transition-colors cursor-pointer group p-2">
              <Search className="w-5 h-5 text-brand group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold hidden md:block">Search</span>
            </Link>
            
            <Link href="/publish" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-gray-500 hover:text-brand transition-colors cursor-pointer group p-2">
              <PlusCircle className="w-5 h-5 text-brand group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold hidden md:block">Publish a ride</span>
            </Link>

            <NavAuth />
          </nav>
        </div>
      </header>
      {/* Spacer to push content down because header is fixed */}
      <div className="h-20 w-full shrink-0" />
    </>
  );
}

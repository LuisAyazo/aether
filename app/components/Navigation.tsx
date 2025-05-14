'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  
  // Only show navigation on public pages
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register';
  
  if (!isPublicPage) return null;
  
  return (
    <nav className="fixed w-full bg-background/80 backdrop-blur-md z-50 py-4 px-6 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <a href="/" className="text-xl font-bold">Aether</a>
        <div className="hidden md:flex gap-8">
          <a href="#features" className="hover:text-gray-600 dark:hover:text-gray-300">Features</a>
          <a href="#" className="hover:text-gray-600 dark:hover:text-gray-300">Docs</a>
          <a href="#" className="hover:text-gray-600 dark:hover:text-gray-300">About</a>
          <a href="#" className="hover:text-gray-600 dark:hover:text-gray-300">Blog</a>
        </div>
        <div className="flex gap-4 items-center">
          <Link 
            href="/login" 
            className="hover:text-gray-600 dark:hover:text-gray-300"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors px-4 py-2 text-sm hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
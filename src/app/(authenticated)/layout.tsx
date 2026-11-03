'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemePanel } from '@/components/layout/ThemePanel';
import { Footer } from '@/components/layout/Footer';
import { JitsiCallWidget } from '@/components/layout/JitsiCallWidget';
import { MLWebSocketManager } from '@/components/layout/MLWebSocketManager';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isChatPage = pathname.startsWith('/chats');
  const { isSidebarOpen, mode, primaryColor, density } = useStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(mode);
    }
  }, [mode]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primaryColor);
  }, [primaryColor]);

  // Handle routing on client side once mounted
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isMounted, isAuthenticated, router]);

  if (!isMounted) {
    return null; // Don't render layout components during hydration to avoid mismatch
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TooltipProvider>
      <MLWebSocketManager />
      <div className={cn(
        "h-screen overflow-hidden print:h-auto print:overflow-visible print:block bg-background font-sans antialiased flex flex-col",
        density === 'compact' ? 'space-tight' : 'space-comfortable'
      )}>
        <div className="print:hidden">
          <Header />
          <Sidebar />
          <ThemePanel />
        </div>

        <main className={cn(
          "flex flex-col flex-1 min-h-0 pt-16 print:pt-0 print:pl-0 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "md:pl-[260px]" : "md:pl-[80px]"
        )}>
          <div className={cn(
            "flex-1 print:overflow-visible print:p-0",
            isChatPage
              ? "overflow-hidden flex flex-col h-full w-full"
              : "overflow-y-auto p-6 md:p-8"
          )}>
            {children}
          </div>
          {!isChatPage && (
            <div className="print:hidden">
              <Footer />
            </div>
          )}
        </main>
        <Toaster position="top-right" closeButton richColors />
        <JitsiCallWidget />
      </div>
    </TooltipProvider>
  );
}

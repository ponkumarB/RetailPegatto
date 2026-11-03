'use client';

import { 
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'motion/react';
import React from 'react';
import { Navigation } from './Navigation';

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? 260 : 80 }}
      className={cn(
        "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300 ease-in-out hidden md:block"
      )}
    >
      <div className="flex h-full flex-col py-4">
        <ScrollArea className="h-full px-3">
          <React.Suspense fallback={<div className="h-10 w-full animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>}>
            <Navigation collapsed={!isSidebarOpen} />
          </React.Suspense>
        </ScrollArea>

        <div className="px-4 pt-4 border-t mt-auto">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-slate-500 hover:text-primary transition-colors"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Collapse View</span>
              </>
            ) : (
              <ChevronRight className="h-5 w-5 mx-auto" />
            )}
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}


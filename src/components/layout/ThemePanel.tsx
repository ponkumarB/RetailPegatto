'use client';

import { X, Sun, Moon, Monitor, Layout, Maximize } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const colors = [
  { name: 'Blue', value: '#0565FD' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rose', value: '#0565FD' },
  { name: 'Zinc', value: '#71717a' },
];

export function ThemePanel() {
  const { 
    isRightPanelOpen, 
    toggleRightPanel, 
    mode, 
    setMode, 
    primaryColor, 
    setPrimaryColor,
    density,
    setDensity
  } = useStore();

  return (
    <AnimatePresence>
      {isRightPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
            onClick={toggleRightPanel}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-[320px] bg-background border-l shadow-xl"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Theme Customizer</h2>
                <Button variant="ghost" size="icon" onClick={toggleRightPanel}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 p-6 space-y-8 overflow-y-auto min-h-0">
                <section className="space-y-4">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Color Mode</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={mode === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('light')}
                      className="gap-2"
                    >
                      <Sun className="h-4 w-4" /> Light
                    </Button>
                    <Button
                      variant={mode === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('dark')}
                      className="gap-2"
                    >
                      <Moon className="h-4 w-4" /> Dark
                    </Button>
                    <Button
                      variant={mode === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('system')}
                      className="gap-2"
                    >
                      <Monitor className="h-4 w-4" /> Sys
                    </Button>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Primary Color</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setPrimaryColor(color.value)}
                        className={cn(
                          "h-10 w-10 rounded-full border-2 transition-transform hover:scale-110",
                          primaryColor === color.value ? "border-foreground" : "border-transparent"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Density</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={density === 'comfortable' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDensity('comfortable')}
                      className="gap-2"
                    >
                      <Maximize className="h-4 w-4" /> Comfortable
                    </Button>
                    <Button
                      variant={density === 'compact' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDensity('compact')}
                      className="gap-2"
                    >
                      <Layout className="h-4 w-4" /> Compact
                    </Button>
                  </div>
                </section>
                
                <Separator />
                
                <div className="bg-muted p-4 rounded-lg text-xs space-y-2 text-muted-foreground">
                  <p>Changes are applied globally to all components using the color system.</p>
                  <p>Density settings adjust padding and margins for better information density.</p>
                </div>
              </div>

              <div className="p-4 border-t bg-muted/30">
                <Button className="w-full" onClick={toggleRightPanel}>Close Customizer</Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

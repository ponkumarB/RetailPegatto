'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '@/app/(authenticated)/chats/store';
import { KnowlarityProvider } from '@/store/KnowlarityContext';
import { useStore } from '@/store/useStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrateUserProfile = useStore((state) => state.hydrateUserProfile);

  useEffect(() => {
    hydrateUserProfile();
  }, [hydrateUserProfile]);

  // Create a QueryClient instance on client-side state to avoid sharing cache across SSR requests
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes fresh time for caching
        gcTime: 10 * 60 * 1000, // 10 minutes cache retention
        refetchOnWindowFocus: false, // disable refetching on window focus
        refetchOnMount: false, // serve cached data when navigating back to visited pages
        retry: 1, // limit retry to 1 attempt to avoid request spam
      },
    },
  }));

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <KnowlarityProvider>
          {children}
        </KnowlarityProvider>
      </QueryClientProvider>
    </Provider>
  );
}

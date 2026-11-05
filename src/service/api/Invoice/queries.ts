import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTallyReportInvoices,
  syncInvoiceToTally,
  syncMultipleInvoicesToTally,
  invalidateTallyInvoicesCache,
} from '@/api/transactions';

export const TALLY_INVOICES_QUERY_KEY = ['tally-report-invoices'];

/**
 * TanStack Query Hook to fetch and cache Tally Report Invoices.
 * Deduplicates in-flight requests and caches results for 60 seconds.
 */
export function useTallyReportInvoices(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: TALLY_INVOICES_QUERY_KEY,
    queryFn: () => fetchTallyReportInvoices(undefined, false),
    staleTime: 60 * 1000, // 1 minute fresh time
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection retention
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options,
  });
}

/**
 * Mutation hook to sync single or multiple invoices to Tally Prime.
 * Automatically invalidates the Tally invoices query cache on success.
 */
export function useSyncInvoiceToTally() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceOrId: any) => syncInvoiceToTally(invoiceOrId),
    onSuccess: () => {
      invalidateTallyInvoicesCache();
      queryClient.invalidateQueries({ queryKey: TALLY_INVOICES_QUERY_KEY });
    },
  });
}


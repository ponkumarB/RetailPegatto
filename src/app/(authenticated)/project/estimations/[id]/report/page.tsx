"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchSoftwareEstimationById } from "@/service/api/SoftwareEstimation/api";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { FPAReportUI } from "@/components/estimation/FPAReportUI";

export default function FPAReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["softwareEstimation", id],
    queryFn: () => fetchSoftwareEstimationById(id),
    enabled: !!id,
  });

  const [estData, setEstData] = useState<any>(null);

  useEffect(() => {
    if (data && data.data) {
      setEstData(data.data);
    } else if (data && !data.data) {
      setEstData(data);
    }
  }, [data]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading Report...</div>;
  }

  if (error || !estData) {
    return <div className="flex h-screen items-center justify-center text-red-500">Failed to load estimation report.</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 print:min-h-0 print:bg-white print:p-0 print:block">
      <div className="max-w-[1200px] mx-auto p-4 print:p-0">

        {/* Actions Bar (Hidden on print) */}
        <div className="flex justify-between items-center mb-4 print:hidden">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Estimations
          </Button>
          <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="h-4 w-4" /> Download
          </Button>
        </div>

        {/* Report Container */}
        <FPAReportUI estData={estData} />
      </div>
    </div>
  );
}

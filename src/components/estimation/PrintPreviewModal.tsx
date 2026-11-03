// src/components/estimation/PrintPreviewModal.tsx
'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { EstimationPrintPreview } from './EstimationPrintPreview';

interface PrintPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    onPrint: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
    isOpen,
    onClose,
    data,
    onPrint,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        Print Preview
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <EstimationPrintPreview data={data} />
                </div>
                <DialogFooter className="flex items-center justify-between">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={onPrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, X, Settings2, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodePrintDialogProps {
  open: boolean;
  onClose: () => void;
  products: any[];
  selectedProduct?: any;
}

export function BarcodePrintDialog({ open, onClose, products, selectedProduct }: BarcodePrintDialogProps) {
  const [printSettings, setPrintSettings] = useState({
    columns: 4,
    rows: 10,
    labelWidth: 50,
    labelHeight: 30,
    showProductName: true,
    showPrice: true,
    showProductCode: true,
    barcodeSize: 100,
    fontSize: 10,
  });

  const [printProducts, setPrintProducts] = useState<any[]>([]);
  const [quantityMap, setQuantityMap] = useState<Record<string, number>>({});
  const [activePreset, setActivePreset] = useState('standard');

  useEffect(() => {
    if (selectedProduct) {
      setPrintProducts([selectedProduct]);
      setQuantityMap({ [selectedProduct.id]: 1 });
    } else if (products && products.length > 0) {
      setPrintProducts(products);
      const initialMap: Record<string, number> = {};
      products.forEach((p) => {
        initialMap[p.id] = 1;
      });
      setQuantityMap(initialMap);
    } else {
      setPrintProducts([]);
      setQuantityMap({});
    }
  }, [selectedProduct, products, open]);

  const handleQuantityChange = (productId: string, change: number) => {
    setQuantityMap((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + change),
    }));
  };

  const presets: Record<string, any> = {
    small: { columns: 5, rows: 12, labelWidth: 40, labelHeight: 25, barcodeSize: 80 },
    standard: { columns: 4, rows: 10, labelWidth: 50, labelHeight: 30, barcodeSize: 100 },
    large: { columns: 3, rows: 8, labelWidth: 65, labelHeight: 40, barcodeSize: 130 },
    extraLarge: { columns: 2, rows: 6, labelWidth: 95, labelHeight: 55, barcodeSize: 160 },
  };

  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    setPrintSettings((prev) => ({
      ...prev,
      ...presets[preset],
    }));
  };

  const formatIndianNumber = (num: number) => {
    if (!num) return '0.00';
    return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    const allBarcodeItems: any[] = [];
    printProducts.forEach((product) => {
      const quantity = quantityMap[product.id] || 1;
      for (let i = 0; i < quantity; i++) {
        allBarcodeItems.push(product);
      }
    });

    if (allBarcodeItems.length === 0) {
      toast.error("No items to print");
      return;
    }

    const { columns, rows, showProductName, showPrice, showProductCode, barcodeSize, fontSize } = printSettings;
    const itemsPerPage = columns * rows;
    const totalPages = Math.ceil(allBarcodeItems.length / itemsPerPage);

    let allPagesHTML = "";

    for (let page = 0; page < totalPages; page++) {
      const pageItems = allBarcodeItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

      allPagesHTML += `
        <div class="print-page">
          <div class="barcode-grid" style="grid-template-columns: repeat(${columns}, 1fr);">
            ${pageItems.map((item) => `
              <div class="barcode-cell">
                <div class="barcode-container">
                  ${item.Bar_Code ? `
                    <img src="data:image/png;base64,${item.Bar_Code}" alt="Barcode" style="width: ${barcodeSize}px; height: auto;" />
                  ` : `
                    <div class="no-barcode">No Barcode</div>
                  `}
                  ${showProductName && item.Product_Name ? `
                    <div class="product-name" style="font-size: ${fontSize}px;">${item.Product_Name}</div>
                  ` : ""}
                  ${showProductCode && item.Product_Code ? `
                    <div class="product-code" style="font-size: ${fontSize - 2}px;">${item.Product_Code}</div>
                  ` : ""}
                  ${showPrice && item.Price ? `
                    <div class="product-price" style="font-size: ${fontSize}px;">₹ ${formatIndianNumber(item.Price)}</div>
                  ` : ""}
                </div>
              </div>
            `).join("")}
            ${Array(itemsPerPage - pageItems.length).fill(0).map(() => `
              <div class="barcode-cell empty"></div>
            `).join("")}
          </div>
        </div>
      `;
    }

    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Barcodes</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; background: #fff; padding: 10px; }
          .print-page { page-break-after: always; margin-bottom: 20px; }
          .print-page:last-child { page-break-after: auto; }
          .barcode-grid { display: grid; gap: 8px; width: 100%; }
          .barcode-cell { border: 1px dashed #ccc; padding: 4px; display: flex; align-items: center; justify-content: center; min-height: 90px; page-break-inside: avoid; }
          .barcode-cell.empty { border: 1px dashed #eee; background: #fafafa; }
          .barcode-container { text-align: center; width: 100%; }
          .barcode-container img { display: block; margin: 0 auto; }
          .product-name { font-weight: bold; margin-top: 6px; word-break: break-word; }
          .product-code { color: #666; margin-top: 2px; word-break: break-word; }
          .product-price { font-weight: bold; color: #2e7d32; margin-top: 4px; }
          .no-barcode { padding: 20px; background: #f5f5f5; color: #999; font-size: 12px; text-align: center; }
          @media print {
            body { padding: 0; margin: 0; }
            .barcode-cell { border: none; }
            .print-page { margin-bottom: 0; }
          }
          @page { size: A4; margin: 10mm; }
        </style>
      </head>
      <body>
        ${allPagesHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=800,height=600,toolbar=yes,scrollbars=yes");
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
      toast.success(`Printing ${allBarcodeItems.length} barcode labels on ${totalPages} page(s)`);
    } else {
      toast.error("Please allow popups to print barcodes");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 border-none shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Printer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Print Barcode Labels</DialogTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure and print product barcodes</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4 text-slate-500" />
          </Button>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[65vh] custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Selected Products ({printProducts.length})</h3>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
              {printProducts.map((p) => (
                <div key={p.id} className="p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.Product_Name}</div>
                    <div className="text-[10px] text-slate-500">{p.Product_Code}</div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
                    <button onClick={() => handleQuantityChange(p.id, -1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"><Minus className="h-3 w-3" /></button>
                    <span className="text-xs font-bold w-6 text-center">{quantityMap[p.id] || 1}</span>
                    <button onClick={() => handleQuantityChange(p.id, 1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
              {printProducts.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs">No products selected</div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Print Settings</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {Object.keys(presets).map((preset) => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activePreset === preset ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
                >
                  {preset.charAt(0).toUpperCase() + preset.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Columns</Label>
                <Input type="number" min="1" max="8" value={printSettings.columns} onChange={(e) => setPrintSettings({ ...printSettings, columns: parseInt(e.target.value) || 1 })} className="h-9 text-xs bg-white dark:bg-slate-900 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rows per Page</Label>
                <Input type="number" min="1" max="20" value={printSettings.rows} onChange={(e) => setPrintSettings({ ...printSettings, rows: parseInt(e.target.value) || 1 })} className="h-9 text-xs bg-white dark:bg-slate-900 rounded-xl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Barcode Size (px): {printSettings.barcodeSize}</Label>
              <input type="range" min="60" max="200" step="5" value={printSettings.barcodeSize} onChange={(e) => setPrintSettings({ ...printSettings, barcodeSize: parseInt(e.target.value) })} className="w-full accent-blue-600" />
            </div>

            <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
               <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-3">Display Elements</Label>
               <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-2">
                   <Checkbox id="showName" checked={printSettings.showProductName} onCheckedChange={(c) => setPrintSettings({ ...printSettings, showProductName: !!c })} />
                   <Label htmlFor="showName" className="text-xs">Product Name</Label>
                 </div>
                 <div className="flex items-center gap-2">
                   <Checkbox id="showCode" checked={printSettings.showProductCode} onCheckedChange={(c) => setPrintSettings({ ...printSettings, showProductCode: !!c })} />
                   <Label htmlFor="showCode" className="text-xs">Product Code</Label>
                 </div>
                 <div className="flex items-center gap-2">
                   <Checkbox id="showPrice" checked={printSettings.showPrice} onCheckedChange={(c) => setPrintSettings({ ...printSettings, showPrice: !!c })} />
                   <Label htmlFor="showPrice" className="text-xs">Price</Label>
                 </div>
               </div>
            </div>

          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 sticky bottom-0 z-10">
          <Button variant="outline" onClick={onClose} className="rounded-xl h-10 px-5 text-xs font-bold">Cancel</Button>
          <Button onClick={handlePrint} className="rounded-xl h-10 px-6 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 gap-2">
            <Printer className="h-4 w-4" /> Print Labels
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Country, State, City } from 'country-state-city';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StoreCustomForm({
  formData,
  setFormData,
  isEdit,
  productRows,
  setProductRows,
  productList = []
}: {
  formData: any;
  setFormData: (data: any) => void;
  isEdit: boolean;
  productRows: any[];
  setProductRows: (rows: any[]) => void;
  productList?: any[];
}) {
  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => {
    const selectedCountry = countries.find(c => c.name === formData.Country);
    if (!selectedCountry) return [];
    return State.getStatesOfCountry(selectedCountry.isoCode);
  }, [formData.Country, countries]);
  
  const cities = useMemo(() => {
    const selectedCountry = countries.find(c => c.name === formData.Country);
    const selectedState = states.find(s => s.name === formData.State);
    if (!selectedCountry || !selectedState) return [];
    return City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
  }, [formData.Country, formData.State, countries, states]);

  const handleAddProductRow = () => {
    setProductRows([...productRows, { Product_Id: '', Product_Name: '', UOM: '', Opening_Balance: '', Reorder_Level: '', Min_Stock_Level: '' }]);
  };

  const handleRemoveProductRow = (index: number) => {
    const newRows = [...productRows];
    newRows.splice(index, 1);
    setProductRows(newRows);
  };

  const handleProductRowChange = (index: number, field: string, value: any) => {
    const newRows = [...productRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setProductRows(newRows);
  };

  const handleSelectProductForRow = (index: number, productId: string | null) => {
    if (!productId) return;
    const prod = productList.find(p => String(p.id || p.Product_Id) === productId);
    if (prod) {
      handleProductRowChange(index, 'Product_Id', String(prod.id || prod.Product_Id));
      handleProductRowChange(index, 'Product_Name', prod.Product_Name || prod.name || '');
      handleProductRowChange(index, 'UOM', prod.Uom || prod.UOM || '');
    }
  };

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 relative">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Store Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-6">
          <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Store Name <span className="text-rose-500">*</span></Label>
          <Input required placeholder="e.g. Downtown Flagship" value={formData.Store_Name || ''} onChange={(e) => setFormData({ ...formData, Store_Name: e.target.value })} className="h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-950" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Store Manager</Label>
          <Input placeholder="Manager Name" value={formData.Store_Inchange || ''} onChange={(e) => setFormData({ ...formData, Store_Inchange: e.target.value })} className="h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-950" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Building Name</Label>
          <Input placeholder="Building or Complex Name" value={formData.Building_Name || ''} onChange={(e) => setFormData({ ...formData, Building_Name: e.target.value })} className="h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-950" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Country</Label>
          <Select value={formData.Country || ''} onValueChange={(val) => setFormData({ ...formData, Country: val, State: '', City: '' })}>
            <SelectTrigger className="h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-950">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map(c => <SelectItem key={c.isoCode} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">State</Label>
          <Select disabled={!formData.Country} value={formData.State || ''} onValueChange={(val) => setFormData({ ...formData, State: val, City: '' })}>
            <SelectTrigger className="h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-950">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              {states.map(s => <SelectItem key={s.isoCode} value={s.name}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">City</Label>
          <Select disabled={!formData.State} value={formData.City || ''} onValueChange={(val) => setFormData({ ...formData, City: val })}>
            <SelectTrigger className="h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-950">
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              {cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 relative">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Store Products & Stock Parameters</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Configure initial product stock levels, opening balance, reorder, and minimum thresholds for this store.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddProductRow} className="h-8 gap-1.5 rounded-xl text-xs font-semibold text-blue-600 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> Add Product
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider min-w-[170px]">Product Name</th>
                <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider min-w-[100px]">Product Id</th>
                <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider min-w-[80px]">Uom</th>
                <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider min-w-[120px] text-right">Opening Balance</th>
                <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider min-w-[120px] text-right">Reorder Level</th>
                <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider min-w-[130px] text-right">Min Stock Level</th>
                <th className="p-3 font-extrabold text-slate-500 uppercase tracking-wider w-[60px] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {productRows.map((pRow, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                  <td className="p-3">
                    <Select value={pRow.Product_Id ? String(pRow.Product_Id) : ''} onValueChange={(val) => handleSelectProductForRow(idx, val)}>
                      <SelectTrigger className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900"><SelectValue placeholder="Select Product" /></SelectTrigger>
                      <SelectContent className="max-h-56">
                        {productList.map((prod: any) => (
                          <SelectItem key={prod.id || prod.Product_Id} value={String(prod.id || prod.Product_Id)}>
                            {prod.Product_Name || prod.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input readOnly placeholder="Product Id" value={pRow.Product_Id || ''} className="h-9 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono" />
                  </td>
                  <td className="p-2">
                    <Input placeholder="UOM" value={pRow.UOM || ''} onChange={(e) => handleProductRowChange(idx, 'UOM', e.target.value)} className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900" />
                  </td>
                  <td className="p-2">
                    <Input type="number" placeholder="Opening Balance" value={pRow.Opening_Balance ?? ''} onChange={(e) => handleProductRowChange(idx, 'Opening_Balance', e.target.value)} className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900" />
                  </td>
                  <td className="p-2">
                    <Input type="number" placeholder="Reorder Level" value={pRow.Reorder_Level ?? ''} onChange={(e) => handleProductRowChange(idx, 'Reorder_Level', e.target.value)} className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900" />
                  </td>
                  <td className="p-2">
                    <Input type="number" placeholder="Min Stock Level" value={pRow.Min_Stock_Level ?? ''} onChange={(e) => handleProductRowChange(idx, 'Min_Stock_Level', e.target.value)} className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900" />
                  </td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={() => handleRemoveProductRow(idx)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer" title="Remove row">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

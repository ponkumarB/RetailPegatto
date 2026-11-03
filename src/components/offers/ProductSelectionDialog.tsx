'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Search,
  Package,
  Layers,
  Store,
  RefreshCw,
  X,
  Check,
  Building2,
  Tag,
  GripVertical,
  ArrowUpDown
} from 'lucide-react';
import {
  fetchStoresList,
  fetchProductsByStore,
  StoreItem,
  ProductItem
} from '@/service/api/offers/api';
import { toast } from 'sonner';

interface ProductSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  selectedProducts: Array<{ id: string | number; name: string; Product_Id?: string | number }>;
  selectedCategories: Array<string | { id?: string | number; name: string }>;
  selectedStores?: Array<{ id: string | number; name: string }>;
  onSave: (
    products: Array<{ id: string | number; name: string; Product_Id?: string | number }>,
    categories: string[],
    stores: Array<{ id: string | number; name: string }>
  ) => void;
}

export function ProductSelectionDialog({
  open,
  onClose,
  selectedProducts,
  selectedCategories,
  selectedStores = [],
  onSave
}: ProductSelectionDialogProps) {
  // Remote data state
  const [storesList, setStoresList] = useState<StoreItem[]>([]);
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<Array<{ id: number; name: string; count: number }>>([]);
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  // Filters & selection state
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Working state during dialog session
  const [tempProducts, setTempProducts] = useState<
    Array<{ id: string | number; name: string; Product_Id?: string | number }>
  >([]);
  const [tempCategories, setTempCategories] = useState<string[]>([]);
  const [tempStores, setTempStores] = useState<Array<{ id: string | number; name: string }>>([]);

  // Fetch stores on dialog open
  const loadStores = useCallback(async () => {
    setIsLoadingStores(true);
    try {
      const stores = await fetchStoresList();
      setStoresList(stores);
    } catch (err) {
      console.error('Failed to load stores from API:', err);
    } finally {
      setIsLoadingStores(false);
    }
  }, []);

  // Fetch products by chosen store
  const loadProducts = useCallback(async (storeId: string) => {
    setIsLoadingProducts(true);
    try {
      const storeIds = storeId && storeId !== 'all' ? [storeId] : [];
      const products = await fetchProductsByStore(storeIds);
      setProductsList(products);

      // Derive unique categories from products matching old project behavior
      const catCountMap: Record<string, number> = {};
      products.forEach((p) => {
        const cat = p.category || p.ProductCategry_Name || 'General';
        catCountMap[cat] = (catCountMap[cat] || 0) + 1;
      });

      const derivedCats = Object.entries(catCountMap).map(([catName, count], idx) => ({
        id: idx + 1,
        name: catName,
        count
      }));
      setCategoriesList(derivedCats);
    } catch (err) {
      console.error('Failed to load products from API:', err);
      toast.error('Failed to load products from API');
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Sync initial selection on dialog open
  useEffect(() => {
    if (open) {
      loadStores();
      loadProducts('all');

      // Normalize selected products
      const normalizedProds = (selectedProducts || []).map((p) => ({
        id: p.id || p.Product_Id || '',
        name: p.name || (p as any).Product_Name || '',
        Product_Id: p.Product_Id || p.id
      }));
      setTempProducts(normalizedProds);

      // Normalize selected categories
      const normalizedCats = (selectedCategories || []).map((c) =>
        typeof c === 'string' ? c : c?.name || ''
      ).filter(Boolean);
      setTempCategories(normalizedCats);

      // Normalize selected stores
      setTempStores(selectedStores || []);
      setSelectedStoreId(selectedStores.length === 1 ? String(selectedStores[0].id) : 'all');
      setSelectedCategoryTab('all');
      setSearch('');
    }
  }, [open, selectedProducts, selectedCategories, selectedStores, loadStores, loadProducts]);

  // Handle store change
  const handleStoreChange = (newStoreId: string) => {
    setSelectedStoreId(newStoreId);
    if (newStoreId === 'all') {
      setTempStores([]);
    } else {
      const found = storesList.find((s) => String(s.id) === String(newStoreId));
      if (found) {
        setTempStores([{ id: found.id, name: found.Store_Name || found.name || `Store #${found.id}` }]);
      }
    }
    loadProducts(newStoreId);
  };

  // Filtered products based on search and category tab
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      const q = search.toLowerCase();
      const pName = (p.Product_Name || p.name || '').toLowerCase();
      const pSku = (p.SKU_Code || p.sku || '').toLowerCase();
      const pCat = (p.ProductCategry_Name || p.category || '').toLowerCase();

      const matchesSearch = !q || pName.includes(q) || pSku.includes(q) || pCat.includes(q);
      const matchesCategory =
        selectedCategoryTab === 'all' ||
        (p.category && p.category.toLowerCase() === selectedCategoryTab.toLowerCase()) ||
        (p.ProductCategry_Name && p.ProductCategry_Name.toLowerCase() === selectedCategoryTab.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [productsList, search, selectedCategoryTab]);

  const toggleProduct = (item: ProductItem) => {
    const itemId = String(item.id || item.Product_Id);
    setTempProducts((prev) => {
      const exists = prev.some((p) => String(p.id) === itemId || String(p.Product_Id) === itemId);
      if (exists) {
        return prev.filter((p) => String(p.id) !== itemId && String(p.Product_Id) !== itemId);
      } else {
        return [
          ...prev,
          {
            id: item.id || item.Product_Id || itemId,
            Product_Id: item.Product_Id || item.id || itemId,
            name: item.Product_Name || item.name || 'Product'
          }
        ];
      }
    });
  };

  const toggleCategory = (catName: string) => {
    setTempCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  const selectAllInCurrentView = () => {
    const newItems = [...tempProducts];
    filteredProducts.forEach((p) => {
      const pid = String(p.id || p.Product_Id);
      if (!newItems.some((item) => String(item.id) === pid || String(item.Product_Id) === pid)) {
        newItems.push({
          id: p.id || p.Product_Id || pid,
          Product_Id: p.Product_Id || p.id || pid,
          name: p.Product_Name || p.name || 'Product'
        });
      }
    });
    setTempProducts(newItems);
  };

  const clearSelection = () => {
    setTempProducts([]);
    setTempCategories([]);
  };

  const handleApply = () => {
    onSave(tempProducts, tempCategories, tempStores);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-4xl p-6 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#2A7D5B] dark:text-emerald-400">
                <Package className="h-5 w-5 text-[#2A7D5B]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Select Target Products & Categories
                </DialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Fetch live products and stores from backend inventory to configure offer applicability.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  loadStores();
                  loadProducts(selectedStoreId);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Refresh Products from API"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingProducts ? 'animate-spin text-[#2A7D5B]' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2 border-b border-slate-100 dark:border-slate-800 text-xs">
          {/* Store selector (Backend API) */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Building2 className="h-3 w-3 text-slate-400" /> Target Store
            </label>
            <div className="relative">
              <select
                value={selectedStoreId}
                onChange={(e) => handleStoreChange(e.target.value)}
                disabled={isLoadingStores}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
              >
                <option value="all">All Retail Stores</option>
                {storesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.Store_Name || s.name || `Store #${s.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Tag className="h-3 w-3 text-slate-400" /> Filter by Category
            </label>
            <div className="relative">
              <select
                value={selectedCategoryTab}
                onChange={(e) => setSelectedCategoryTab(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
              >
                <option value="all">All Categories ({productsList.length})</option>
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Search className="h-3 w-3 text-slate-400" /> Search Products
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, SKU..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Categories Quick Select Bar from API */}
        {categoriesList.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-500 shrink-0 text-[11px] mr-1">Include Category:</span>
            {categoriesList.map((cat) => {
              const isSelected = tempCategories.includes(cat.name);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.name)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap border cursor-pointer ${
                    isSelected
                      ? 'bg-[#2A7D5B] text-white border-[#2A7D5B]'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {cat.name} ({cat.count}) {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        )}

        {/* Live Product Table Container */}
        <div className="flex-1 overflow-y-auto max-h-[380px] border border-slate-200 dark:border-slate-800 rounded-lg relative">
          {isLoadingProducts && (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 z-20 flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <RefreshCw className="h-4 w-4 animate-spin text-[#2A7D5B]" />
              Fetching products from API...
            </div>
          )}

          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredProducts.length > 0 &&
                      filteredProducts.every((p) =>
                        tempProducts.some(
                          (item) =>
                            String(item.id) === String(p.id) ||
                            String(item.Product_Id) === String(p.Product_Id || p.id)
                        )
                      )
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAllInCurrentView();
                      } else {
                        const currentIds = new Set(
                          filteredProducts.map((p) => String(p.id || p.Product_Id))
                        );
                        setTempProducts((prev) =>
                          prev.filter(
                            (p) =>
                              !currentIds.has(String(p.id)) &&
                              !currentIds.has(String(p.Product_Id))
                          )
                        );
                      }
                    }}
                    className="rounded accent-[#2A7D5B]"
                  />
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#335384] dark:text-slate-200 uppercase tracking-wider whitespace-nowrap">
                    <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Product Name</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-80 shrink-0" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#335384] dark:text-slate-200 uppercase tracking-wider whitespace-nowrap">
                    <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>SKU Code</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-80 shrink-0" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#335384] dark:text-slate-200 uppercase tracking-wider whitespace-nowrap">
                    <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Category</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-80 shrink-0" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#335384] dark:text-slate-200 uppercase tracking-wider whitespace-nowrap">
                    <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Selling Price</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-80 shrink-0" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#335384] dark:text-slate-200 uppercase tracking-wider whitespace-nowrap">
                    <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Available Stock</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-80 shrink-0" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    {isLoadingProducts ? 'Loading inventory items...' : 'No products found matching the criteria.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const itemId = String(p.id || p.Product_Id);
                  const isSelected = tempProducts.some(
                    (item) => String(item.id) === itemId || String(item.Product_Id) === itemId
                  );
                  return (
                    <tr
                      key={p.id || p.Product_Id}
                      onClick={() => toggleProduct(p)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProduct(p)}
                          className="rounded accent-[#2A7D5B]"
                        />
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                        {p.Product_Name || p.name}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                        {p.SKU_Code || p.sku}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                        <span className="inline-block px-2 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {p.ProductCategry_Name || p.category || 'General'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                        ₹{Number(p.Price || p.price || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                        {Number(p.Opening_Balance || p.stock || 0)} {p.UOM || p.uom || 'units'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between sm:justify-between">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Selected:{' '}
            <span className="font-bold text-[#2A7D5B]">{tempProducts.length}</span> Products,{' '}
            <span className="font-bold text-[#2A7D5B]">{tempCategories.length}</span> Categories
            {tempStores.length > 0 && (
              <span className="ml-1 text-slate-500">
                ({tempStores.map((s) => s.name).join(', ')})
              </span>
            )}
            {(tempProducts.length > 0 || tempCategories.length > 0) && (
              <button
                type="button"
                onClick={clearSelection}
                className="ml-3 text-[11px] text-slate-400 hover:text-red-600 underline cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleApply}
              className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-5 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Check className="h-4 w-4" />
              Apply Selection
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-5 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

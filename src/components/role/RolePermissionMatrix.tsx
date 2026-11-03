'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Shield,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface RolePermissionMatrixProps {
  menuTree: any[];
  selectedPermissions: Record<string, any>;
  onSelectionChange: (updated: Record<string, any>) => void;
  title?: string;
}

const ACTION_COLUMNS: ('Create' | 'Edit' | 'Delete' | 'Overview' | 'Import' | 'Export')[] = [
  'Create',
  'Edit',
  'Delete',
  'Overview',
  'Import',
  'Export',
];

export interface PermissionActionItem {
  key: string;
  name: string;
  actionType: 'Create' | 'Edit' | 'Delete' | 'Overview' | 'Import' | 'Export';
}

export interface MatrixTreeNode {
  id: string;
  name: string;
  code: string;
  level: number;
  isGroup: boolean;
  actions: Record<string, PermissionActionItem>;
  allKeys: string[];
  children: MatrixTreeNode[];
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Switch({ checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function RolePermissionMatrix({
  menuTree,
  selectedPermissions,
  onSelectionChange,
  title = 'Module & Form Permissions',
}: RolePermissionMatrixProps) {
  // Track selected module ID in the left sidebar
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  // Track collapsed group node IDs inside the right panel
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleNodeCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const isNodeExpanded = (nodeId: string) => {
    return !collapsedNodes[nodeId]; // Default expanded
  };

  // 1. Recursively build Matrix Tree from API menuTree payload
  const matrixTree = useMemo<MatrixTreeNode[]>(() => {
    const buildTree = (nodes: any[], level = 0): MatrixTreeNode[] => {
      if (!Array.isArray(nodes)) return [];

      const result: MatrixTreeNode[] = [];

      nodes.forEach((node, idx) => {
        const name = node.name || node.code || '';
        const code = node.code || node.FormId || name;
        const children = Array.isArray(node.children) ? node.children : [];

        // Check if children are action permission nodes (e.g. Lead.Create, Lead.Edit)
        const hasLeafActionChildren =
          children.length > 0 &&
          children.every((child: any) => {
            const childName = child.name || child.code || '';
            return (
              childName.includes('.') ||
              child.menu_type === 'action' ||
              !Array.isArray(child.children) ||
              child.children.length === 0
            );
          });

        if (hasLeafActionChildren) {
          // Form row with horizontal action mappings
          const actions: Record<string, PermissionActionItem> = {};
          const allKeys: string[] = [];

          children.forEach((child: any) => {
            const childName = child.name || child.code || '';
            const childCode = child.code || child.FormId || childName;
            const lower = childName.toLowerCase();

            let actionType: 'Create' | 'Edit' | 'Delete' | 'Overview' | 'Import' | 'Export' = 'Overview';
            if (lower.includes('create') || lower.includes('add') || lower.includes('new')) actionType = 'Create';
            else if (lower.includes('edit') || lower.includes('update') || lower.includes('modify')) actionType = 'Edit';
            else if (lower.includes('delete') || lower.includes('remove')) actionType = 'Delete';
            else if (lower.includes('overview') || lower.includes('view') || lower.includes('read')) actionType = 'Overview';
            else if (lower.includes('import')) actionType = 'Import';
            else if (lower.includes('export')) actionType = 'Export';

            actions[actionType] = { key: childCode, name: childName, actionType };
            allKeys.push(childCode);
          });

          result.push({
            id: `form_${code}_${level}_${idx}`,
            name,
            code,
            level,
            isGroup: false,
            actions,
            allKeys,
            children: [],
          });
        } else if (children.length > 0) {
          // Parent Module / Sub-module category row
          const childTree = buildTree(children, level + 1);
          const allKeys: string[] = [];
          childTree.forEach((c) => allKeys.push(...c.allKeys));

          result.push({
            id: `group_${code}_${level}_${idx}`,
            name,
            code,
            level,
            isGroup: true,
            actions: {},
            allKeys,
            children: childTree,
          });
        } else {
          // Single Form node without children
          const actions: Record<string, PermissionActionItem> = {};
          const allKeys: string[] = [];

          ACTION_COLUMNS.forEach((actionType) => {
            const key = `${code}.${actionType.toLowerCase()}`;
            actions[actionType] = { key, name: `${name}.${actionType}`, actionType };
            allKeys.push(key);
          });

          result.push({
            id: `form_${code}_${level}_${idx}`,
            name,
            code,
            level,
            isGroup: false,
            actions,
            allKeys,
            children: [],
          });
        }
      });

      return result;
    };

    return buildTree(menuTree || []);
  }, [menuTree]);

  // Active module calculation
  const activeModule = useMemo(() => {
    if (matrixTree.length === 0) return null;
    return matrixTree.find((m) => m.id === activeModuleId) || matrixTree[0];
  }, [matrixTree, activeModuleId]);

  // 2. Flatten all system permission keys across tree
  const allSystemKeys = useMemo(() => {
    const collectKeys = (nodes: MatrixTreeNode[]): string[] => {
      const keys: string[] = [];
      nodes.forEach((n) => {
        keys.push(...n.allKeys);
        if (n.children.length > 0) {
          keys.push(...collectKeys(n.children));
        }
      });
      return Array.from(new Set(keys));
    };
    return collectKeys(matrixTree);
  }, [matrixTree]);

  // Check if a permission key is selected
  const isKeySelected = (key: string): boolean => {
    if (!key) return false;
    const lowerKey = key.toLowerCase();
    return (
      !!selectedPermissions[key] ||
      !!selectedPermissions[lowerKey] ||
      !!selectedPermissions[`${key}.view`] ||
      !!selectedPermissions[`${lowerKey}.view`]
    );
  };

  // Toggle single key with automatic cascading rules
  const toggleKey = (actionItem: PermissionActionItem, node: MatrixTreeNode) => {
    const next = { ...selectedPermissions };
    const key = actionItem.key;
    const isCurrentlySelected = isKeySelected(key);

    if (isCurrentlySelected) {
      // Unselecting the key
      delete next[key];
      delete next[`${key}.view`];
      delete next[key.toLowerCase()];
      delete next[`${key.toLowerCase()}.view`];

      // If the unselected key is Overview, unselect all other actions for this node
      if (actionItem.actionType === 'Overview') {
        node.allKeys.forEach((k) => {
          delete next[k];
          delete next[`${k}.view`];
          delete next[k.toLowerCase()];
          delete next[`${k.toLowerCase()}.view`];
        });
      }
    } else {
      // Selecting the key
      next[key] = {
        FormId: key,
        ModuleName: node.name,
        FormName: node.name,
        PermissionName: { view: true },
      };

      // If selecting any other action than Overview, automatically select Overview
      if (actionItem.actionType !== 'Overview') {
        const overviewItem = node.actions['Overview'];
        if (overviewItem) {
          const overviewKey = overviewItem.key;
          next[overviewKey] = {
            FormId: overviewKey,
            ModuleName: node.name,
            FormName: node.name,
            PermissionName: { view: true },
          };
        }
      }
    }
    onSelectionChange(next);
  };

  // Batch toggle keys
  const batchToggleKeys = (keys: string[], targetState?: boolean) => {
    const next = { ...selectedPermissions };
    const shouldSelect =
      targetState !== undefined ? targetState : !keys.every((k) => isKeySelected(k));

    keys.forEach((key) => {
      if (shouldSelect) {
        next[key] = {
          FormId: key,
          ModuleName: key,
          FormName: key,
          PermissionName: { view: true },
        };
      } else {
        delete next[key];
        delete next[`${key}.view` ];
        delete next[key.toLowerCase()];
        delete next[`${key.toLowerCase()}.view` ];
      }
    });
    onSelectionChange(next);
  };

  // Master Presets
  const handleFullAccess = () => {
    batchToggleKeys(allSystemKeys, true);
  };

  const handleClearAll = () => {
    onSelectionChange({});
  };

  // Recursive renderer for submodule / page tree rows
  const renderSubmoduleRows = (nodes: MatrixTreeNode[]): React.ReactNode => {
    return nodes.map((node) => {
      const isExpanded = isNodeExpanded(node.id);
      const nodeSelectedCount = node.allKeys.filter((k) => isKeySelected(k)).length;
      const isNodeAllSelected =
        node.allKeys.length > 0 && nodeSelectedCount === node.allKeys.length;

      const totalKeys = node.allKeys.length;
      let dotColor = 'bg-slate-300 dark:bg-slate-750';
      if (nodeSelectedCount === totalKeys && totalKeys > 0) {
        dotColor = 'bg-emerald-500';
      } else if (nodeSelectedCount > 0) {
        dotColor = 'bg-amber-500';
      }

      // Indent based on depth relative to active module.
      const indentLevel = Math.max(0, node.level - 1);
      const paddingLeftStyle = { paddingLeft: `${indentLevel * 24 + 16}px` };

      return (
        <React.Fragment key={node.id}>
          <tr className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
            {/* Module / Form Name Column with indentation */}
            <td className="py-2.5 pr-4 text-xs font-semibold text-slate-850 dark:text-slate-200" style={paddingLeftStyle}>
              <div className="flex items-center gap-2">
                {/* Chevron icon for Sub-module Category Groups */}
                {node.isGroup ? (
                  <button
                    type="button"
                    onClick={() => toggleNodeCollapse(node.id)}
                    className="h-5 w-5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  /* Form row master indicator colored status dot if nested page */
                  <span className={`h-2 w-2 rounded-full ${dotColor} ml-1.5 mr-2 shrink-0`} />
                )}

                {/* Name */}
                <span
                  className={`text-xs ${
                    node.isGroup
                      ? 'font-bold text-slate-900 dark:text-white cursor-pointer'
                      : 'font-semibold text-slate-700 dark:text-slate-350'
                  }`}
                  onClick={() => node.isGroup && toggleNodeCollapse(node.id)}
                >
                  {node.name}
                </span>

                {/* If it's a group submodule, show the status dot next to name */}
                {node.isGroup && (
                  <span className={`h-2 w-2 rounded-full ${dotColor} shrink-0 ml-1.5`} />
                )}
              </div>
            </td>

            {/* All Column Switch */}
            <td className="text-center py-2 px-2">
              <Switch
                checked={isNodeAllSelected}
                onChange={() => batchToggleKeys(node.allKeys, !isNodeAllSelected)}
              />
            </td>

            {/* Individual Action Columns */}
            {ACTION_COLUMNS.map((actionCol) => {
              if (node.isGroup) {
                /* Parent Group rows render faint dashes across action columns */
                return (
                  <td key={actionCol} className="text-center py-2 px-2">
                    <span className="text-slate-300 dark:text-slate-700 font-light select-none">
                      -
                    </span>
                  </td>
                );
              }

              const actionItem = node.actions[actionCol];
              if (!actionItem) {
                return (
                  <td key={actionCol} className="text-center py-2 px-2">
                    <span className="text-slate-200 dark:text-slate-800/80 font-light select-none">
                      -
                    </span>
                  </td>
                );
              }

              const checked = isKeySelected(actionItem.key);

              return (
                <td key={actionCol} className="text-center py-2 px-2">
                  <Switch
                    checked={checked}
                    onChange={() => toggleKey(actionItem, node)}
                  />
                </td>
              );
            })}
          </tr>

          {/* Render Children when expanded */}
          {node.isGroup && isExpanded && renderSubmoduleRows(node.children)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all text-left">
      {/* 1. Header Bar */}
      <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-900 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Configure granular module access and form execution rules.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFullAccess}
            className="h-8 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="h-8 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      {/* 2. Two-Column Workspace Layout */}
      <div className="flex flex-col md:flex-row h-[600px]">
        {/* Left Sidebar - Module Navigation */}
        <div className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-955/20 p-4 space-y-1 shrink-0 overflow-y-auto">
          <div className="px-3 mb-3">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Modules
            </h4>
          </div>
          <div className="space-y-1">
            {matrixTree.map((mod) => {
              const isActive = activeModule?.id === mod.id;
              const hasSubmenu = mod.isGroup && mod.children.length > 0;

              const totalKeys = mod.allKeys.length;
              const selectedCount = mod.allKeys.filter((k) => isKeySelected(k)).length;
              let dotColor = 'bg-slate-300 dark:bg-slate-700';
              if (selectedCount === totalKeys && totalKeys > 0) {
                dotColor = 'bg-emerald-500';
              } else if (selectedCount > 0) {
                dotColor = 'bg-amber-500';
              }

              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModuleId(mod.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dotColor} shrink-0`} />
                    <span>{mod.name}</span>
                  </span>
                  {!isActive && hasSubmenu && (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content - Submodules & Permissions Switchboard */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeModule ? (
            <div className="space-y-6">
              {/* Header inside settings panel */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {activeModule.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Configure granular module access and form execution rules.
                </p>
              </div>

              {/* Table / Grid */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 select-none">
                        <th className="font-extrabold uppercase text-[10px] tracking-wider text-slate-400 py-3.5 px-4 w-[32%] min-w-[180px]">
                          Module / Form Name
                        </th>
                        <th className="font-extrabold uppercase text-[10px] tracking-wider text-slate-400 py-3.5 px-2 text-center min-w-[64px]">
                          All
                        </th>
                        {ACTION_COLUMNS.map((actionCol) => (
                          <th
                            key={actionCol}
                            className="font-extrabold uppercase text-[10px] tracking-wider text-slate-400 py-3.5 px-2 text-center min-w-[64px]"
                          >
                            {actionCol}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                      {activeModule.children.length === 0 && !activeModule.isGroup ? (
                        /* The active module itself is a single page without children */
                        renderSubmoduleRows([activeModule])
                      ) : activeModule.children.length === 0 ? (
                        <tr>
                          <td colSpan={ACTION_COLUMNS.length + 2} className="py-8 text-center text-slate-400 font-medium">
                            No modules or forms available
                          </td>
                        </tr>
                      ) : (
                        /* Render children recursively (submodules, sub-categories, pages) */
                        renderSubmoduleRows(activeModule.children)
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 font-medium">
              Select a module from the left sidebar to configure its permissions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

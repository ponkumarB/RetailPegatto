/**
 * Persistent Storage Helper for Offline / Local-first Sync
 * Guarantees that saved data is never lost upon browser refresh
 * and prevents deleted items from resurrecting from backend lists.
 */

export function getLocalData<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(`[persistentStorage] Error reading ${key}:`, e);
    return [];
  }
}

export function saveLocalData<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[persistentStorage] Error writing ${key}:`, e);
  }
}

function getDeletedSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(`${key}_deleted`);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr.map(s => String(s).trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function saveDeletedSet(key: string, deletedSet: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${key}_deleted`, JSON.stringify(Array.from(deletedSet)));
  } catch (e) {
    console.error(`[persistentStorage] Error saving deleted set for ${key}:`, e);
  }
}

export function upsertLocalItem<T extends Record<string, any>>(
  key: string,
  item: T,
  primaryKeys: (keyof T | string)[] = ['id']
): T[] {
  // Remove from deleted set if previously deleted
  const deletedSet = getDeletedSet(key);
  let changedDeleted = false;
  primaryKeys.forEach(pk => {
    const val = item[pk as keyof T];
    if (val !== undefined && val !== null) {
      const sVal = String(val).trim();
      if (deletedSet.has(sVal)) {
        deletedSet.delete(sVal);
        changedDeleted = true;
      }
    }
  });
  if (changedDeleted) {
    saveDeletedSet(key, deletedSet);
  }

  const list = getLocalData<T>(key);
  // Find any existing record that matches on any primary key
  const matchedExisting = list.find(existing =>
    primaryKeys.some(pk => {
      const existVal = existing[pk as keyof T];
      const itemVal = item[pk as keyof T];
      return (
        existVal !== undefined &&
        itemVal !== undefined &&
        existVal !== null &&
        itemVal !== null &&
        String(existVal).trim() !== '' &&
        String(existVal).trim().toLowerCase() === String(itemVal).trim().toLowerCase()
      );
    })
  );

  // Filter out any occurrences that match any primary key to eliminate duplicates
  const filteredList = list.filter(existing =>
    !primaryKeys.some(pk => {
      const existVal = existing[pk as keyof T];
      const itemVal = item[pk as keyof T];
      return (
        existVal !== undefined &&
        itemVal !== undefined &&
        existVal !== null &&
        itemVal !== null &&
        String(existVal).trim() !== '' &&
        String(existVal).trim().toLowerCase() === String(itemVal).trim().toLowerCase()
      );
    })
  );

  const mergedItem = matchedExisting ? { ...matchedExisting, ...item } : item;
  const updatedList = [mergedItem, ...filteredList];

  saveLocalData(key, updatedList);
  return updatedList;
}

export function deleteLocalItem<T extends Record<string, any>>(
  key: string,
  id: any,
  primaryKeys: (keyof T | string)[] = ['id']
): T[] {
  const deletedSet = getDeletedSet(key);
  if (id !== undefined && id !== null && String(id).trim() !== '') {
    deletedSet.add(String(id).trim());
  }

  const list = getLocalData<T>(key);
  // Also collect all primary key values from matched existing items to add to deleted set
  list.forEach(existing => {
    const matches = primaryKeys.some(pk => {
      const val = existing[pk as keyof T];
      return (
        val !== undefined &&
        val !== null &&
        String(val).trim() !== '' &&
        String(val).trim().toLowerCase() === String(id).trim().toLowerCase()
      );
    });
    if (matches) {
      primaryKeys.forEach(pk => {
        const pkVal = existing[pk as keyof T];
        if (pkVal !== undefined && pkVal !== null && String(pkVal).trim() !== '') {
          deletedSet.add(String(pkVal).trim());
        }
      });
    }
  });

  saveDeletedSet(key, deletedSet);

  const updatedList = list.filter(existing =>
    !primaryKeys.some(pk => {
      const val = existing[pk as keyof T];
      return (
        val !== undefined &&
        val !== null &&
        String(val).trim() !== '' &&
        (String(val).trim().toLowerCase() === String(id).trim().toLowerCase() || deletedSet.has(String(val).trim()))
      );
    })
  );

  saveLocalData(key, updatedList);
  return updatedList;
}

/**
 * Merges backend records with locally stored records.
 * - Preserves any locally created or updated items that might not have landed on backend yet.
 * - Filters out items that the user explicitly deleted so they do not resurrect.
 * - Deep merges matching items so local products/items aren't wiped out by partial backend list summaries.
 * - Guarantees strict deduplication so no item is ever returned twice.
 * - Always keeps the latest merged set saved to localStorage.
 */
export function mergeWithLocalData<T extends Record<string, any>>(
  key: string,
  backendList: T[],
  primaryKeys: (keyof T | string)[] = ['id']
): T[] {
  const deletedSet = getDeletedSet(key);

  // Filter out any backend items that were deleted locally
  const validBackendList = (backendList || []).filter(backendItem =>
    !primaryKeys.some(pk => {
      const val = backendItem[pk as keyof T];
      return val !== undefined && val !== null && deletedSet.has(String(val).trim());
    })
  );

  const localList = getLocalData<T>(key).filter(localItem =>
    !primaryKeys.some(pk => {
      const val = localItem[pk as keyof T];
      return val !== undefined && val !== null && deletedSet.has(String(val).trim());
    })
  );

  if (!localList || localList.length === 0) {
    if (validBackendList.length > 0) {
      saveLocalData(key, validBackendList);
    }
    return validBackendList;
  }

  // Map backend items, merging fields from matching local item if found
  const mergedBackendList = validBackendList.map(backendItem => {
    const matchedLocal = localList.find(localItem =>
      primaryKeys.some(pk => {
        const localVal = localItem[pk as keyof T];
        const backendVal = backendItem[pk as keyof T];
        return (
          localVal !== undefined &&
          backendVal !== undefined &&
          localVal !== null &&
          backendVal !== null &&
          String(localVal).trim() !== '' &&
          String(localVal).trim().toLowerCase() === String(backendVal).trim().toLowerCase()
        );
      })
    );

    if (!matchedLocal) return backendItem;

    // Merge: backend takes precedence, BUT preserve local arrays/details if backend list item is empty
    const mergedItem: Record<string, any> = { ...matchedLocal, ...backendItem };

    const detailProps = [
      'products',
      'items',
      'Invoice_Details',
      'ProductOffer_Details',
      'ProductEnquiry_Details',
      'Sales_Details',
      'Schedule_Details',
      'Product_Details',
      'SalesShipment_Details'
    ];

    for (const prop of detailProps) {
      const localArr = matchedLocal[prop];
      const backendArr = backendItem[prop as keyof T];
      if (
        (!Array.isArray(backendArr) || backendArr.length === 0) &&
        Array.isArray(localArr) &&
        localArr.length > 0
      ) {
        mergedItem[prop] = localArr;
      }
    }

    // Preserve non-empty local fields if backend returned empty string / null / undefined
    for (const k of Object.keys(matchedLocal)) {
      const bVal = backendItem[k as keyof T];
      const lVal = matchedLocal[k];
      if (
        (bVal === undefined || bVal === null || bVal === '') &&
        lVal !== undefined &&
        lVal !== null &&
        lVal !== ''
      ) {
        mergedItem[k] = lVal;
      }
    }

    return mergedItem as T;
  });

  // Local items that are NOT present in validBackendList
  const uniqueLocalItems = localList.filter(localItem =>
    !validBackendList.some(backendItem =>
      primaryKeys.some(pk => {
        const localVal = localItem[pk as keyof T];
        const backendVal = backendItem[pk as keyof T];
        return (
          localVal !== undefined &&
          backendVal !== undefined &&
          localVal !== null &&
          backendVal !== null &&
          String(localVal).trim() !== '' &&
          String(localVal).trim().toLowerCase() === String(backendVal).trim().toLowerCase()
        );
      })
    )
  );

  // Strict deduplication across both local and backend lists
  const seenPrimaryKeys = new Set<string>();
  const deduplicatedList: T[] = [];

  for (const item of [...uniqueLocalItems, ...mergedBackendList]) {
    const keys = primaryKeys
      .map(pk => {
        const val = item[pk as keyof T];
        return val !== undefined && val !== null && String(val).trim() !== ''
          ? String(val).trim().toLowerCase()
          : null;
      })
      .filter(Boolean) as string[];

    const isDuplicate = keys.some(k => seenPrimaryKeys.has(k));
    if (!isDuplicate) {
      keys.forEach(k => seenPrimaryKeys.add(k));
      deduplicatedList.push(item);
    }
  }

  saveLocalData(key, deduplicatedList);
  return deduplicatedList;
}

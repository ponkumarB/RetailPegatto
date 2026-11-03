export const parseDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.trim().split(' ');
  if (parts.length !== 3) return '';
  const day = parts[0].padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = months.indexOf(parts[1]);
  if (monthIdx === -1) return '';
  const month = String(monthIdx + 1).padStart(2, '0');
  const year = parts[2];
  return `${year}-${month}-${day}`;
};

export const getXAxisTitle = (categories: any[], period?: string): string => {
  if (!categories || categories.length === 0) {
    if (period) {
      const p = period.toLowerCase();
      if (p.includes('today') || p.includes('yesterday')) return 'Hour';
      if (p.includes('week')) return 'Day';
      if (p.includes('month') || p.includes('quarter')) return 'Date';
      if (p.includes('year')) return 'Month';
    }
    return 'Date';
  }

  const cats = categories.map(c => String(c).trim());

  // 1. Check if they are all 4-digit years (e.g. 2024)
  const allYears = cats.every(c => /^\d{4}$/.test(c));
  if (allYears) {
    return 'Year';
  }

  // 2. Check if they are hours (e.g. 12:00, 10 AM, 12 PM, etc.)
  const anyHour = cats.some(c => 
    /\b\d{1,2}:\d{2}\b/.test(c) || 
    /\b\d{1,2}\s*(am|pm|AM|PM)\b/.test(c)
  );
  if (anyHour) {
    return 'Hour';
  }

  // 3. Check if they are days of the week (e.g. Mon, Tue, Monday, Tuesday)
  const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const anyDay = cats.some(c => dayNames.includes(c.toLowerCase()));
  if (anyDay) {
    return 'Day';
  }

  // 4. Check if they are full dates (e.g. 2024-06-24, 24 Jun, Jun 24)
  const anyDate = cats.some(c => 
    /^\d{4}-\d{2}-\d{2}$/.test(c) || 
    /^\d{1,2}\s+[a-zA-Z]+/.test(c) || 
    /[a-zA-Z]+\s+\d{1,2}/.test(c)
  );
  if (anyDate) {
    return 'Date';
  }

  // 5. Check if they are months (e.g. Jan, Feb, January, formats like "Jun 24" as June 2024)
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const anyMonth = cats.some(c => {
    const val = c.toLowerCase();
    if (monthNames.includes(val)) return true;
    if (monthNames.some(m => val.startsWith(m))) return true;
    if (/^\d{4}-\d{2}$/.test(c)) return true;
    return false;
  });
  if (anyMonth) {
    return 'Month';
  }

  return 'Date';
};

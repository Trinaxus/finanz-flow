export const formatDate = (date: Date): string => {
  if (!isValidDate(date)) {
    return 'Ungültiges Datum';
  }
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const formatMonth = (month: number, year: number): string => {
  const date = new Date(year, month);
  if (!isValidDate(date)) {
    return 'Ungültiger Monat';
  }
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long'
  }).format(date);
};

export const getMonthYear = (date: Date) => {
  if (!isValidDate(date)) {
    const now = new Date();
    return {
      month: now.getMonth(),
      year: now.getFullYear()
    };
  }
  return {
    month: date.getMonth(),
    year: date.getFullYear()
  };
};

export const getCurrentMonthYear = () => getMonthYear(new Date());

export const getPreviousMonths = (count: number) => {
  const today = new Date();
  const months = [];
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    if (isValidDate(date)) {
      months.push(getMonthYear(date));
    }
  }
  
  return months;
};

// Helper function to validate dates
export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Parse German date format (e.g., "15. Januar 2024")
export const parseGermanDate = (dateStr: string): Date | null => {
  try {
    const germanMonths: { [key: string]: number } = {
      'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 'Mai': 4, 'Juni': 5,
      'Juli': 6, 'August': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
    };

    // Remove any extra whitespace and split
    const parts = dateStr.trim().split(' ');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0].replace('.', ''));
    const month = germanMonths[parts[1]];
    const year = parseInt(parts[2]);

    if (isNaN(day) || month === undefined || isNaN(year)) return null;

    const date = new Date(year, month, day);
    return isValidDate(date) ? date : null;
  } catch {
    return null;
  }
};
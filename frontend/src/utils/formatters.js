export const BOOK_CATEGORIES = [
  'Fiction',
  'Science',
  'History',
  'Technology',
  'Biography',
  'Other',
];

export const ISBN_REGEX = /^(?:\d{10}|\d{13})$/;

export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateDueDateString = (issueDateStr, days = 14) => {
  if (!issueDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(issueDateStr)) return '';
  const [y, m, d] = issueDateStr.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
};

export const formatDisplayDate = (dateValue) => {
  if (!dateValue) return '—';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatCurrencyINR = (amount) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};

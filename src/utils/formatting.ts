export function formatRuntime(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return 'N/A';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'TBA';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatYear(dateString?: string | null): string {
  if (!dateString) return '';
  return dateString.substring(0, 4);
}

export function formatCurrency(amount?: number | null): string {
  if (!amount || amount <= 0) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRating(rating?: number | null): string {
  if (rating === undefined || rating === null || rating === 0) return 'NR';
  return rating.toFixed(1);
}

export function truncateText(text?: string | null, maxLength: number = 150): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}


export const parseUTCDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    
    return !dateStr.includes('Z') && !dateStr.includes('+') ? new Date(dateStr + 'Z') : new Date(dateStr);
};

export const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? parseUTCDate(date) : date;
    if (!d || isNaN(d.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(d).replace(',', '');
};



export const formatAction = (action: string | null | undefined): string => {
    if (!action) return 'Action performed';

    if (action.startsWith('{') && action.endsWith('}')) {
        try {
            const parsed = JSON.parse(action);

            if (parsed.action_description) return parsed.action_description;
            if (parsed.recreation_prompt) return parsed.recreation_prompt;
            if (parsed.intent) return parsed.intent;
            if (parsed.description) return parsed.description;

            if (parsed.action_type === 'click' || parsed.button) {
                return `Clicking element...`;
            }
            if (parsed.action_type === 'type' || parsed.text) {
                return `Typing "${parsed.text}"...`;
            }
            if (parsed.action_type === 'wait' || parsed.timeout) {
                return `Waiting...`;
            }
            if (parsed.action_type === 'navigate') {
                return `Navigating to ${parsed.url}`;
            }

            return action;
        } catch (e) {
            return action;
        }
    }

    return action;
};


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


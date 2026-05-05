/**
 * Formats a raw LLM action (often a JSON string) into a human-readable description.
 */
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

/**
 * Parses a naive datetime string from the backend (which is in UTC) into a proper Date object in the user's local timezone.
 */
export const parseUTCDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    // If the string doesn't already have a timezone indicator, append 'Z' to treat it as UTC
    return !dateStr.includes('Z') && !dateStr.includes('+') ? new Date(dateStr + 'Z') : new Date(dateStr);
};

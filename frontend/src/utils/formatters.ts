/**
 * Formats a raw LLM action (often a JSON string) into a human-readable description.
 */
export const formatAction = (action: string | null | undefined): string => {
    if (!action) return 'Action performed';
    
    // Check if it's JSON
    if (action.startsWith('{') && action.endsWith('}')) {
        try {
            const parsed = JSON.parse(action);
            
            // Handle common action types from the backend
            if (parsed.action_type === 'click' || parsed.button) {
                return `Click on element ${parsed.target_id || ''}`;
            }
            if (parsed.action_type === 'type' || parsed.text) {
                return `Type "${parsed.text}" into element ${parsed.target_id || ''}`;
            }
            if (parsed.action_type === 'wait' || parsed.timeout) {
                return `Wait for ${parsed.timeout || 1000}ms`;
            }
            if (parsed.action_type === 'navigate') {
                return `Navigate to ${parsed.url}`;
            }
            
            // Fallback for unknown JSON structure
            return parsed.description || action;
        } catch (e) {
            // Not valid JSON, return as is
            return action;
        }
    }
    
    return action;
};

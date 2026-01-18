
/**
 * Robustly converts any error-like object into a readable string.
 * Specifically designed to handle:
 * 1. Native JS Errors (which JSON.stringify as {})
 * 2. Supabase/Postgrest errors (nested message/details)
 * 3. Strings
 * 4. Deeply nested error objects
 */
export const serializeError = (err: any): string => {
  if (!err) return 'Unknown error occurred';
  if (typeof err === 'string') return err;
  
  // 1. Check for standard message properties in common error objects
  // We prioritize 'message' but look for other common keys used by different libraries
  const getMessageFromObj = (obj: any): string | null => {
    if (!obj || typeof obj !== 'object') return null;
    
    const candidate = obj.message || obj.error_description || obj.error || obj.msg || obj.hint;
    
    if (typeof candidate === 'string') {
      let result = candidate;
      if (obj.details && typeof obj.details === 'string') result += ` - ${obj.details}`;
      if (obj.code) result += ` [Code: ${obj.code}]`;
      return result;
    }
    
    // Recurse if 'error' is an object containing a message
    if (candidate && typeof candidate === 'object') {
      return getMessageFromObj(candidate);
    }
    
    return null;
  };

  const extracted = getMessageFromObj(err);
  if (extracted) return extracted;

  // 2. Handle native Error objects specifically because JSON.stringify(new Error('...')) is '{}'
  if (err instanceof Error || (err.message && err.stack)) {
    return err.message || 'An unexpected internal error occurred';
  }

  // 3. Fallback to JSON stringify
  try {
    const stringified = JSON.stringify(err);
    if (stringified === '{}') {
      // If stringify failed to produce details, use the native toString representation
      const str = String(err);
      return str === '[object Object]' ? 'Unspecified object error' : str;
    }
    return stringified;
  } catch {
    // 4. Ultimate fallback
    return String(err);
  }
};

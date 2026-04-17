
/**
 * A more robust JSON repair utility that handles common errors like:
 * - Trailing commas
 * - Missing closing braces/brackets
 * - Missing commas between properties
 * - Unclosed strings
 */
export function robustJSONRepair(str: string): any {
  if (!str) return null;
  let repaired = str.trim();
  
  // 1. Basic JSON.parse attempt
  try {
    return JSON.parse(repaired);
  } catch (e) {
    // Continue to repair
  }

  // 2. Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,\s*([\]}])/g, '$1');

  // 3. Fix missing commas between properties/elements
  // Pattern: value followed by a quote (start of next key or string)
  // e.g., "val" "key" -> "val", "key"
  // e.g., 123 "key" -> 123, "key"
  repaired = repaired.replace(/("|\d|true|false|null)\s+(")/g, '$1, $2');

  // 4. Balance braces and brackets
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  
  let result = "";
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    
    if (char === '"' && !escaped) {
      inString = !inString;
    }
    
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '{') {
          stack.pop();
        } else {
          // Skip unexpected closing brace
          continue;
        }
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === '[') {
          stack.pop();
        } else {
          // Skip unexpected closing bracket
          continue;
        }
      }
    }
    
    result += char;
    escaped = char === '\\' && !escaped;
  }

  repaired = result;

  // Close unclosed strings
  if (inString) {
    repaired += '"';
  }

  // Close unclosed braces/brackets in reverse order
  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '{') repaired += '}';
    else if (last === '[') repaired += ']';
  }

  // Final attempt
  try {
    return JSON.parse(repaired);
  } catch (e) {
    // If it still fails, try one last aggressive fix: 
    // If it's truncated in the middle of a key/value, try to find the last valid object/array element
    try {
        // Find last valid closing brace or bracket
        const lastBrace = repaired.lastIndexOf('}');
        const lastBracket = repaired.lastIndexOf(']');
        const lastValid = Math.max(lastBrace, lastBracket);
        if (lastValid > 0) {
            const truncated = repaired.substring(0, lastValid + 1);
            // Re-balance the truncated version
            return robustJSONRepair(truncated);
        }
    } catch (innerE) {
        // Fallback
    }
    throw e;
  }
}

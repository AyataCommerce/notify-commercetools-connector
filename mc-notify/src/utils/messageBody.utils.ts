export const validateTemplate = (template: string): string[] => {
    const errors: string[] = [];
    
    // Check if the entire template is empty
    if (!template.trim()) {
        errors.push("The template cannot be empty.");
        return errors;
    }

    const placeholderRegex = /{{(.*?)}}/g;
    let match;

    while ((match = placeholderRegex.exec(template)) !== null) {
        const placeholder = match[0];
        const path = match[1].trim();

        // Detect empty placeholders like {{}}
        if (!path) {
            errors.push(`Empty placeholder detected: "${placeholder}"`);
            continue;
        }

        // Check for strings that are too short
        if (path.length < 2) {
            errors.push(`Placeholder string too short: "${placeholder}". Must be at least 2 characters long.`);
            continue;
        }

        // Check for invalid placeholder formats
        if (/^\[\d+\]$/.test(path) || /^\[\*\]$/.test(path)) {
            errors.push(`Invalid placeholder format: "${placeholder}". Placeholders cannot be purely array indices.`);
            continue;
        }

        // Check if the placeholder is just a wildcard
        if (path === '*') {
            errors.push(`Invalid placeholder: "${placeholder}". Wildcard "*" must be part of a valid string expression.`);
            continue;
        }

        // Check if the placeholder is a single character
        if (/^[a-zA-Z]$/.test(path)) {
            errors.push(`Invalid placeholder: "${placeholder}". Single character placeholders are not allowed.`);
            continue;
        }

        // Check for incomplete paths, invalid characters, unmatched brackets, and array indexing in one pass
        const invalidCharacters = /[^a-zA-Z0-9.[\]*]/;
        const hasUnclosedBracket = path.includes('[') && !path.includes(']');
        const hasUnopenedBracket = path.includes(']') && !path.includes('[');
        const unmatchedCurlyBraces = (placeholder.match(/{/g)?.length ?? 0) !== (placeholder.match(/}/g)?.length ?? 0);
        const arrayIndexPattern = /^\[\d+\]$|^\[\*\]$/;

        if (path.endsWith('.')) {
            errors.push(`Incomplete path detected: "${placeholder}" (ends with a dot)`);
        }

        if (invalidCharacters.test(path)) {
            errors.push(`Invalid characters in placeholder path: "${placeholder}"`);
        }

        if (hasUnclosedBracket || hasUnopenedBracket) {
            errors.push(`Unmatched square brackets in placeholder: "${placeholder}"`);
        } else {
            // Check for nested square brackets
            if (/\[\[.*?\]\]/.test(path)) {
                errors.push(`Nested square brackets not allowed in placeholder: "${placeholder}"`);
            }

            // Check for single-level array indexing and validate allowed characters within brackets
            const allBrackets = path.match(/\[.*?\]/g) || [];
            if (allBrackets.length > 1) {
                errors.push(`Multi-dimensional array indexing not allowed in placeholder: "${placeholder}"`);
            } else {
                allBrackets.forEach((segment) => {
                    if (!arrayIndexPattern.test(segment)) {
                        errors.push(`Invalid array indexing in placeholder: "${placeholder}". Only single-level indexing with numbers or '*' is allowed.`);
                    }
                });
            }
        }

        if (unmatchedCurlyBraces) {
            errors.push(`Unmatched curly braces in placeholder: "${placeholder}"`);
        }
    }

    // Final check for any placeholders found
    // if (errors.length === 0 && !placeholderRegex.test(template)) {
    //     errors.push("No valid placeholders detected in the template.");
    // }

    return errors;
};
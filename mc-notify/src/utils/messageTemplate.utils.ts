// Generate custom messageBody
export const generateMessage = (data: object, template: string): string => {
    const extractValues = (obj: object, pathString: string): any[] => {
        const segments: string[] = [];
        const wildcardPositions: (boolean | number)[] = [];

        // Parse the path string into segments and track array positions
        pathString.split('.').forEach((segment: string) => {
            const arrayMatch = segment.match(/(.*)\[(\*|\d+)\]/);
            if (arrayMatch) {
                const [, key, index] = arrayMatch;
                segments.push(key);
                wildcardPositions.push(index === '*' ? true : parseInt(index, 10));
            } else {
                segments.push(segment);
                wildcardPositions.push(false);
            }
        });

        // Navigate through the object structure
        let current: any[] = [obj];

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const isWildcard = wildcardPositions[i];

            current = current.flatMap((item: any) => {
                const value = item[segment];

                if (isWildcard === true) {
                    // Handle wildcard array access
                    return Array.isArray(value) ? value : [];
                } else if (typeof isWildcard === 'number') {
                    // Handle specific index array access
                    return Array.isArray(value) && value[isWildcard] ? [value[isWildcard]] : [];
                } else {
                    // Handle regular property access
                    return value !== undefined && value !== null ? [value] : [];
                }
            });

            if (current.length === 0) break;
        }

        return current;
    };

    // Replace template placeholders with actual values
    return template.replace(/{{(.*?)}}/g, (match: string, path: string): string => {
        try {
            const values = extractValues(data, path.trim());
            if (values.length === 0) {
                throw new Error(path.trim());
            }
            return values.join(', ');
        } catch (error) {
            throw error;
        }
    });
};

export const formatUserInput = (input: string) => {
    return input.replace(/\n/g, '\\n');
}
export const formatEditedInput = (input: string) => {
    return input.replace(/\n/g, '\n\n');
}

// Version 2.0.0

export function flattenObject(obj: any, prefix = ''): string[] {
    return Object.keys(obj).reduce((acc: string[], key) => {
        const pre = prefix.length ? `${prefix}.` : '';
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (Array.isArray(obj[key])) {
                return [...acc, `${pre}${key}[*]`, ...flattenObject(obj[key][0] || {}, `${pre}${key}[0]`)];
            }
            return [...acc, ...flattenObject(obj[key], `${pre}${key}`)];
        }
        return [...acc, `${pre}${key}`];
    }, []);
}



// new parser


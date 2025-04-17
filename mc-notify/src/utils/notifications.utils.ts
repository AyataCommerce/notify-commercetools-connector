export const filterRows = (rows: any[], searchTerm: string, filterValue: string, filterField: string) => {
    return rows.filter(row => {
        const searchTermLower = searchTerm.toLowerCase();
        const filterValueLower = filterValue.toLowerCase();

        if (filterField === 'all') {
            return Object.values(row).some(value =>
                String(value).toLowerCase().includes(searchTermLower)
            );
        }

        return String(row[filterField as keyof typeof row])
            .toLowerCase()
            .includes(filterValueLower);
    });
}

export const toSentenceCase = (str: string): string => {
    if (!str) return str;
    
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
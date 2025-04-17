import React from 'react';
import styles from './filterDropdown.module.css';

type FilterDropdownProps = {
    options: string[];
    selectedValue: string | null;
    onSelect: (value: string | null) => void;
    placeholder?: string;
};

const FilterDropdown = ({
    options,
    selectedValue,
    onSelect,
    placeholder = "Filter..."
}: FilterDropdownProps) => {
    return (
        <select
            value={selectedValue || ''}
            onChange={(e) => onSelect(e.target.value || null)}
            className={styles.filterDropdown}
        >
            <option value="">{placeholder}</option>
            {options.map(option => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
};

export default FilterDropdown;
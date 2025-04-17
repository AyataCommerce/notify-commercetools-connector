import { useState, useEffect, useRef } from 'react';
import styles from './PlaceholderSearch.module.css';
import { flattenObject } from '../../../utils/messageTemplate.utils';

interface PlaceholderSearchProps {
    templateData: any;
    onSelect: (placeholder: string) => void;
    placeholder?: string;
    curretnValue?: string;
}

const PlaceholderSearch = ({ curretnValue, templateData, onSelect, placeholder = "Search placeholders..." }: PlaceholderSearchProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPlaceholders, setFilteredPlaceholders] = useState<string[]>([]);
    const [allPlaceholders, setAllPlaceholders] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Flatten the template data to get all placeholders
    useEffect(() => {
        if (templateData && Object.keys(templateData).length > 0) {
            const paths = flattenObject(templateData);
            setAllPlaceholders(paths);
            setFilteredPlaceholders(paths);
        }
    }, [templateData]);

    // Filter placeholders based on search term
    useEffect(() => {
        if (!searchTerm) {
            setFilteredPlaceholders(allPlaceholders);
            return;
        }

        const filtered = allPlaceholders.filter(ph =>
            ph.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPlaceholders(filtered);
        setSelectedIndex(-1); // Reset selection when filtering
    }, [searchTerm, allPlaceholders]);


    const handleSelect = (placeholder: string) => {
        onSelect(placeholder);
        setSearchTerm(placeholder)
        setIsDropdownOpen(false);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev =>
                prev < filteredPlaceholders.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelect(filteredPlaceholders[selectedIndex]);
        } else if (e.key === 'Escape') {
            setIsDropdownOpen(false);
        }
    };


    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={styles.searchContainer}>
            <div className={styles.searchInputContainer}>
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm || curretnValue}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={styles.searchInput}
                />
                <button
                    className={styles.clearButton}
                    onClick={() => {
                        setSearchTerm('');
                        searchInputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                >
                    ×
                </button>
            </div>

            {isDropdownOpen && filteredPlaceholders.length > 0 && (
                <div ref={dropdownRef} className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <span>{filteredPlaceholders.length} variables found</span>
                        <span className={styles.hint}>↑↓ to navigate, ↵ to select</span>
                    </div>
                    <ul className={styles.dropdownList}>
                        {filteredPlaceholders.map((placeholder, index) => (
                            <li
                                key={index}
                                className={`${styles.dropdownItem} ${index === selectedIndex ? styles.selected : ''}`}
                                onClick={() => handleSelect(placeholder)}
                            >
                                <span className={styles.placeholderText}>{placeholder}</span>
                                {placeholder.includes('[*]') && (
                                    <span className={styles.arrayBadge}>array</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};



export default PlaceholderSearch;
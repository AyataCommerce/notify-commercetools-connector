import React from 'react';
import styles from './searchBar.module.css';

type SearchBarProps = {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    placeholder?: string;
};

const SearchBar = ({ searchTerm, onSearchChange, placeholder = "Search..." }: SearchBarProps) => {
    return (
        <div className={styles.searchContainer}>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={placeholder}
                className={styles.searchInput}
            />
            {searchTerm && (
                <button
                    onClick={() => onSearchChange('')}
                    className={styles.clearButton}
                >
                    ×
                </button>
            )}
        </div>
    );
};

export default SearchBar;
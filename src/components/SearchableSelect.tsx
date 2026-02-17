import React, { useState, useRef, useEffect } from 'react';

interface SearchableSelectProps {
    options: Array<{ id: string; name: string }>;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    name?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Pilih...',
    required = false,
    name,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Get selected option name
    const selectedOption = options.find(opt => opt.id === value);
    const displayValue = selectedOption?.name || '';

    // Filter options based on search term
    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll highlighted option into view
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    const handleInputClick = () => {
        setIsOpen(true);
        setSearchTerm('');
        inputRef.current?.focus();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setHighlightedIndex(-1);
        if (!isOpen) setIsOpen(true);
    };

    const handleSelectOption = (optionId: string) => {
        onChange(optionId);
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleSelectOption(filteredOptions[highlightedIndex].id);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
                break;
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Hidden input for form validation */}
            <input
                type="hidden"
                name={name}
                value={value}
                required={required}
            />

            {/* Visible Input Field */}
            <div
                className={`w-full rounded-lg border h-11 flex items-center cursor-pointer transition-all ${isOpen
                        ? 'border-primary ring-4 ring-primary/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                onClick={handleInputClick}
            >
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 h-full px-4 bg-transparent outline-none text-sm placeholder:text-slate-400"
                    placeholder={value ? displayValue : placeholder}
                    value={isOpen ? searchTerm : displayValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    readOnly={!isOpen}
                />

                {/* Clear button */}
                {value && !isOpen && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                )}

                {/* Dropdown arrow */}
                <span className="material-symbols-outlined text-slate-400 pr-3 pointer-events-none">
                    {isOpen ? 'expand_less' : 'expand_more'}
                </span>
            </div>

            {/* Dropdown List */}
            {isOpen && (
                <ul
                    ref={listRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                    {filteredOptions.length === 0 ? (
                        <li className="px-4 py-3 text-sm text-slate-400 text-center">
                            Tidak ada hasil untuk "{searchTerm}"
                        </li>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <li
                                key={option.id}
                                className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 ${index === highlightedIndex
                                        ? 'bg-primary/10 text-primary'
                                        : option.id === value
                                            ? 'bg-slate-50 text-slate-900 font-medium'
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                onClick={() => handleSelectOption(option.id)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                {option.id === value && (
                                    <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                                )}
                                <span className={option.id === value ? '' : 'pl-6'}>{option.name}</span>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default SearchableSelect;

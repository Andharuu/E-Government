import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { FontAwesome } from './FontAwesome';

export interface CustomSelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Tampilkan kotak pencarian di dalam popover (berguna untuk daftar panjang) */
  searchable?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  className = '',
  disabled = false,
  searchable,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectId = useId();

  const selectedOption = options.find((opt) => opt.value === value);
  const showSearch = searchable ?? options.length > 10;

  const visibleOptions = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && showSearch) {
      const t = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [isOpen, showSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (e.key === 'ArrowDown') {
        const idx = visibleOptions.findIndex((opt) => opt.value === value);
        const next = idx < visibleOptions.length - 1 ? idx + 1 : 0;
        if (visibleOptions[next]) onChange(visibleOptions[next].value);
      }
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const idx = visibleOptions.findIndex((opt) => opt.value === value);
      const prev = idx > 0 ? idx - 1 : visibleOptions.length - 1;
      if (visibleOptions[prev]) onChange(visibleOptions[prev].value);
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      setQuery('');
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`input flex items-center justify-between text-left select-none ${
          isOpen ? 'border-accent ring-2 ring-accent/15' : ''
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`truncate ${selectedOption ? 'text-ink' : 'text-ink-3'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FontAwesome
          name="chevron-down"
          className={`text-[10px] text-ink-3 transition-transform duration-150 shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          aria-labelledby={selectId}
          className="absolute z-50 left-0 right-0 mt-1.5 bg-surface border border-line rounded-lg shadow-lg overflow-hidden"
        >
          {showSearch && (
            <div className="p-2 border-b border-line">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari..."
                className="input h-8 text-[12.5px]"
              />
            </div>
          )}

          <div className="overflow-y-auto max-h-60 p-1">
            {visibleOptions.length === 0 ? (
              <p className="px-3 py-4 text-[12.5px] text-ink-3 text-center">Tidak ada hasil</p>
            ) : (
              visibleOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-[13px] cursor-pointer select-none transition-colors ${
                      isSelected
                        ? 'bg-accent-soft text-accent-text font-medium'
                        : 'text-ink-2 hover:bg-surface-3 hover:text-ink'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <FontAwesome name="check-pure" className="text-[10px] shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

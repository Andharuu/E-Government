import React, { useState, useRef, useEffect, useId } from 'react';
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
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (e.key === 'ArrowDown') {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        onChange(options[nextIndex].value);
      }
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex((opt) => opt.value === value);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
      onChange(options[prevIndex].value);
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
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
        className={`w-full h-11 px-4 text-sm bg-[#101828] border rounded-xl outline-none transition-all duration-150 flex items-center justify-between text-left cursor-pointer select-none ${
          isOpen
            ? 'border-[#7BBDE8] ring-4 ring-[#7BBDE8]/15 text-white'
            : 'border-[#243048] hover:border-[#7BBDE8]/60 text-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`truncate text-sm font-medium ${selectedOption ? 'text-white' : 'text-[#6EA2B3]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FontAwesome
          name="chevron-down"
          className={`text-[11px] text-[#6EA2B3] transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-[#7BBDE8]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={selectId}
          className="absolute z-50 left-0 right-0 mt-1.5 p-1.5 bg-[#101828] border border-[#243048] rounded-xl shadow-2xl overflow-y-auto max-h-60 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm cursor-pointer transition-colors duration-100 select-none ${
                  isSelected
                    ? 'bg-[#7BBDE8]/15 text-[#7BBDE8] font-semibold'
                    : 'text-slate-200 hover:bg-[#171F2F] hover:text-white'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <FontAwesome name="check" className="text-xs text-[#7BBDE8] shrink-0 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

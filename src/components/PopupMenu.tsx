import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface PopupMenuProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const PopupMenu: React.FC<PopupMenuProps> = ({ options, value, onChange, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-field w-full flex items-center justify-between text-left"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder || 'Select...'}</span>
        <ChevronDown size={16} className="ml-2 opacity-50" />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-brand-gray border border-black/10 dark:border-white/10 rounded-lg shadow-xl overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                option.value === value ? 'bg-brand-red/10 text-brand-red font-semibold' : ''
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

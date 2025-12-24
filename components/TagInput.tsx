import React, { useState, useEffect, useRef } from 'react';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  category: 'restriction' | 'like' | 'dislike';
}

export const TagInput: React.FC<Props> = ({ tags, onChange, placeholder, category }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce fetch suggestions
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (input.trim().length > 1) {
        try {
          const res = await fetch(`/api/tags?category=${category}&q=${encodeURIComponent(input)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.filter((s: string) => !tags.includes(s)));
          }
        } catch (e) {
          console.error("Failed to fetch suggestions", e);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [input, category, tags]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
      setSuggestions([]);
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="relative">
      <div
        className={`flex flex-wrap gap-2 p-2 rounded-xl border bg-white min-h-[46px] transition-all cursor-text ${isFocused ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'}`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span key={i} className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            {tag}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="hover:text-rose-600 focus:outline-none"
            >
              <i className="fas fa-times"></i>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delayed blur to allow clicking suggestions
            setTimeout(() => {
              setIsFocused(false);
              if (input) addTag(input); // Add raw text on blur? Optional.
            }, 200);
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 outline-none text-sm min-w-[120px] bg-transparent"
        />
      </div>

      {/* Autocomplete Dropdown */}
      {isFocused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                addTag(s);
              }}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 block transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

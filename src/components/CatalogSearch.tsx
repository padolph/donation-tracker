'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { searchItems } from '@/app/actions/itemActions';

interface Item {
  id: number;
  description: string;
  category: {
    name: string;
  };
  defaultHigh: number | null;
  defaultMedium: number | null;
}

interface Props {
  onSelectItem: (item: Item) => void;
  className?: string;
}

export default function CatalogSearch({ onSelectItem, className }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setHighlightedIndex(-1);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const items = await searchItems(query);
        setResults(items as unknown as Item[]);
        setHighlightedIndex(-1);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        const item = results.at(highlightedIndex);
        if (item) {
          selectItem(item);
        }
      }
    } else if (e.key === 'Escape') {
      setResults([]);
      setHighlightedIndex(-1);
    }
  };

  const selectItem = (item: Item) => {
    onSelectItem(item);
    setQuery('');
    setResults([]);
    setHighlightedIndex(-1);
  };

  const hasNoResults = query.length >= 2 && results.length === 0 && !isPending;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-2 bg-[#1e1e21] border border-[#2d2d30] rounded-lg focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none text-sm pr-10"
          placeholder="e.g. Men's Suit"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-3 top-2.5 text-white/40">
          {isPending ? (
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="text-lg">🔍</span>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <ul
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-[#1e1e21] border border-[#2d2d30] rounded-lg shadow-2xl max-h-60 overflow-auto divide-y divide-white/5"
        >
          {results.map((item, index) => (
            <li
              key={item.id}
              className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors ${
                index === highlightedIndex ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              onClick={() => selectItem(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex-1 min-w-0 pr-4">
                <span className={`font-medium text-sm block truncate ${index === highlightedIndex ? 'text-accent' : ''}`}>
                  {item.description}
                </span>
                <span className="text-[10px] text-white/40 uppercase tracking-wider truncate block">
                  {item.category?.name || 'General'}
                </span>
              </div>
              <div className="text-xs text-accent font-bold whitespace-nowrap">
                ${(item.defaultHigh || 0).toFixed(2)} / ${(item.defaultMedium || 0).toFixed(2)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasNoResults && (
        <div className="absolute z-50 w-full mt-2 bg-[#1e1e21] border border-[#2d2d30] rounded-lg shadow-2xl p-4 text-center">
          <p className="text-sm text-white/40 italic">No matching items found.</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { getCategories, getItemsByCategory } from '@/app/actions/itemActions';

interface Item {
  id: number;
  description: string;
  category: {
    name: string;
  };
  defaultHigh: number | null;
  defaultMedium: number | null;
}

interface Category {
  id: number;
  name: string;
}

interface Props {
  onSelectItem: (item: Item) => void;
  className?: string;
}

interface HierarchyNode {
  name: string;
  subcategories: Map<string, HierarchyNode>;
  items: Item[];
}

export default function CatalogBrowse({ onSelectItem, className }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [hierarchy, setHierarchy] = useState<HierarchyNode | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getCategories();
      setCategories(data);
      setIsLoading(false);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId !== null) {
      const loadItems = async () => {
        setIsLoading(true);
        const data = await getItemsByCategory(selectedCategoryId);
        
        // Build hierarchy
        const root: HierarchyNode = { name: 'root', subcategories: new Map(), items: [] };
        data.forEach((item) => {
          const parts = item.description.split(':').map(p => p.trim());
          let current = root;
          
          const categoryName = item.category.name;
          const startIdx = parts.at(0) === categoryName ? 1 : 0;
          
          for (let i = startIdx; i < parts.length - 1; i++) {
            const part = parts.at(i)!;
            let next = current.subcategories.get(part);
            if (!next) {
              next = { name: part, subcategories: new Map(), items: [] };
              current.subcategories.set(part, next);
            }
            current = next;
          }
          current.items.push(item as unknown as Item);
        });
        
        setHierarchy(root);
        setIsLoading(false);
      };
      loadItems();
    }
  }, [selectedCategoryId]);

  const getCurrentNode = () => {
    if (!hierarchy) return null;
    let current = hierarchy;
    for (const part of path) {
      const next = current.subcategories.get(part);
      if (next) {
        current = next;
      } else {
        break;
      }
    }
    return current;
  };

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setPath([]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setSelectedCategoryId(null);
      setPath([]);
      setHierarchy(null);
    } else if (index === 0) {
      setPath([]);
    } else {
      setPath(path.slice(0, index));
    }
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/40 italic">Loading catalog...</p>
      </div>
    );
  }

  const currentNode = getCurrentNode();
  const currentCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className={`bg-[#1e1e21] border border-[#2d2d30] rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Breadcrumbs */}
      <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button 
          onClick={() => handleBreadcrumbClick(-1)}
          className="text-xs font-bold uppercase tracking-wider text-white/40 hover:text-white transition-colors"
        >
          Categories
        </button>
        {currentCategory && (
          <>
            <span className="text-white/20 text-xs">/</span>
            <button 
              onClick={() => handleBreadcrumbClick(0)}
              className={`text-xs font-bold uppercase tracking-wider transition-colors ${path.length === 0 ? 'text-accent' : 'text-white/40 hover:text-white'}`}
            >
              {currentCategory.name}
            </button>
          </>
        )}
        {path.map((part, i) => (
          <div key={part} className="flex items-center gap-2">
            <span className="text-white/20 text-xs">/</span>
            <button 
              onClick={() => handleBreadcrumbClick(i + 1)}
              className={`text-xs font-bold uppercase tracking-wider transition-colors ${i === path.length - 1 ? 'text-accent' : 'text-white/40 hover:text-white'}`}
            >
              {part}
            </button>
          </div>
        ))}
      </div>

      <div className="p-2 max-h-96 overflow-y-auto">
        {isLoading && selectedCategoryId !== null && (
           <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          </div>
        )}

        {!isLoading && !selectedCategoryId && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/5 text-left transition-colors group"
              >
                <span className="text-sm font-medium group-hover:text-accent">{cat.name}</span>
                <span className="text-white/20 group-hover:text-white/40">→</span>
              </button>
            ))}
          </div>
        )}

        {!isLoading && currentNode && (
          <div className="space-y-1">
            {/* Subcategories */}
            {Array.from(currentNode.subcategories.keys()).sort().map((name) => (
              <button
                key={name}
                onClick={() => setPath([...path, name])}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/5 text-left transition-colors group"
              >
                <span className="text-sm font-medium group-hover:text-accent">{name}</span>
                <span className="text-white/20 group-hover:text-white/40">→</span>
              </button>
            ))}

            {/* Items */}
            {currentNode.items.map((item) => {
              const parts = item.description.split(':').map(p => p.trim());
              const displayName = parts[parts.length - 1];
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="w-full flex flex-col px-4 py-3 rounded-lg hover:bg-white/10 text-left transition-colors border border-transparent hover:border-white/10 group"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-bold group-hover:text-accent">{displayName}</span>
                    <span className="text-xs text-accent font-black">
                      ${(item.defaultHigh || 0).toFixed(2)} / ${(item.defaultMedium || 0).toFixed(2)}
                    </span>
                  </div>
                </button>
              );
            })}

            {currentNode.subcategories.size === 0 && currentNode.items.length === 0 && (
              <div className="p-8 text-center text-white/40 italic text-sm">
                No items found in this section.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

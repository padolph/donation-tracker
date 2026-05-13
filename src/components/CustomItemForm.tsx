'use client';

import { useState } from 'react';
import { createCustomItem } from '@/app/actions/itemActions';

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
  onItemCreated: (item: Item) => void;
  onCancel: () => void;
}

export default function CustomItemForm({ onItemCreated, onCancel }: Props) {
  const [description, setDescription] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [highValue, setHighValue] = useState('');
  const [mediumValue, setMediumValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newItem = await createCustomItem({
        description,
        categoryName,
        defaultHigh: parseFloat(highValue) || 0,
        defaultMedium: parseFloat(mediumValue) || 0,
      });
      onItemCreated(newItem as unknown as Item);
    } catch (error) {
      console.error('Failed to create custom item', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 border border-accent rounded-xl bg-white/5 space-y-6 animate-in zoom-in-95 duration-200">
      <h3 className="text-xl font-bold">Add Custom Item</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-white/40">Item Description</label>
          <input
            id="description"
            required
            className="w-full px-4 py-3 rounded-lg"
            placeholder="e.g. Designer Sunglasses"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-white/40">Category</label>
          <input
            id="category"
            required
            className="w-full px-4 py-3 rounded-lg"
            placeholder="e.g. Accessories"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="highValue" className="text-[10px] font-black uppercase tracking-widest text-white/40">High Value ($)</label>
          <input
            id="highValue"
            type="number"
            step="0.01"
            required
            className="w-full px-4 py-3 rounded-lg"
            placeholder="0.00"
            value={highValue}
            onChange={(e) => setHighValue(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="mediumValue" className="text-[10px] font-black uppercase tracking-widest text-white/40">Medium Value ($)</label>
          <input
            id="mediumValue"
            type="number"
            step="0.01"
            required
            className="w-full px-4 py-3 rounded-lg"
            placeholder="0.00"
            value={mediumValue}
            onChange={(e) => setMediumValue(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-accent text-black font-black py-4 rounded-xl hover:bg-yellow-500 disabled:opacity-50 transition-colors uppercase tracking-widest text-sm"
        >
          {isSubmitting ? 'Saving...' : 'Save Custom Item'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-4 border border-white/10 rounded-xl hover:bg-white/5 transition-colors uppercase tracking-widest text-sm font-bold text-white/60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

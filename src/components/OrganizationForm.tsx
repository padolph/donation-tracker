'use client';

import React, { useState } from 'react';
import { createOrganization, updateOrganization } from '@/app/actions/organizationActions';

interface OrganizationFormProps {
  initialData?: {
    id: number;
    name: string;
    address?: string | null;
    taxId?: string | null;
  };
  onSave: (organization: any) => void;
  onCancel: () => void;
}

export default function OrganizationForm({ initialData, onSave, onCancel }: OrganizationFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [taxId, setTaxId] = useState(initialData?.taxId || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Name is required');
      return;
    }

    setIsSaving(true);
    
    const data = { name, address, taxId };
    
    try {
      let result;
      if (initialData?.id) {
        result = await updateOrganization(initialData.id, data);
      } else {
        result = await createOrganization(data);
      }

      if (result.success) {
        onSave(result.organization);
      } else {
        alert(result.error || 'An error occurred while saving.');
      }
    } catch (error) {
      alert('An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const isEdit = !!initialData?.id;

  return (
    <div className="bg-[#1c1c1f] rounded-2xl border border-white/10 p-6 md:p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold">{isEdit ? 'Edit Organization' : 'Add Organization'}</h2>
        <button 
          onClick={onCancel}
          className="text-white/40 hover:text-white transition-colors"
          type="button"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="org-name" className="text-[10px] font-black uppercase tracking-widest text-white/40">Name *</label>
          <input
            id="org-name"
            type="text"
            required
            placeholder="e.g. Goodwill"
            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="org-address" className="text-[10px] font-black uppercase tracking-widest text-white/40">Address</label>
          <input
            id="org-address"
            type="text"
            placeholder="123 Main St, City, State"
            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="org-taxId" className="text-[10px] font-black uppercase tracking-widest text-white/40">Tax ID / EIN</label>
          <input
            id="org-taxId"
            type="text"
            placeholder="XX-XXXXXXX"
            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
          />
        </div>

        <div className="flex gap-4 pt-4 mt-6 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-sm font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="flex-1 py-3 px-4 bg-accent text-black rounded-xl hover:bg-yellow-500 transition-colors text-sm font-black uppercase tracking-widest disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

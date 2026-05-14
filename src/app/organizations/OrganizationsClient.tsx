'use client';

import React, { useState } from 'react';
import OrganizationForm from '@/components/OrganizationForm';
import { deleteOrganization } from '@/app/actions/organizationActions';

type Organization = {
  id: number;
  name: string;
  address?: string | null;
  taxId?: string | null;
  totalDonated: number;
};

export default function OrganizationsClient({ initialOrganizations }: { initialOrganizations: Organization[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  const handleAddNew = () => {
    setEditingOrg(null);
    setIsModalOpen(true);
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      const result = await deleteOrganization(id);
      if (!result.success) {
        alert(result.error || 'Failed to delete organization.');
      }
    }
  };

  const handleSave = () => {
    setIsModalOpen(false);
    setEditingOrg(null);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-1">Organizations</h1>
          <p className="text-white/50 text-sm">Manage your directory of charitable organizations</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-accent text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-yellow-500 transition-colors"
        >
          Add New
        </button>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Organization</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Address / Location</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40">Tax ID</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40 text-right">Total Donated</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialOrganizations.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/40">
                  No organizations found. Click &quot;Add New&quot; to get started.
                </td>
              </tr>
            ) : (
              initialOrganizations.map((org) => (
                <tr key={org.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold">{org.name}</td>
                  <td className="p-4 text-sm text-white/60">{org.address || '-'}</td>
                  <td className="p-4 text-sm text-white/60">{org.taxId || '-'}</td>
                  <td className="p-4 text-right font-black text-accent">
                    ${org.totalDonated.toFixed(2)}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(org)}
                      className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white px-3 py-1 bg-white/5 rounded-lg transition-colors"
                      aria-label={`Edit ${org.name}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(org.id, org.name)}
                      className="text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/20 px-3 py-1 bg-red-500/10 rounded-lg transition-colors"
                      aria-label={`Delete ${org.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <OrganizationForm
            initialData={editingOrg || undefined}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

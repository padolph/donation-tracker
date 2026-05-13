'use client';

import { useState, useEffect } from 'react';
import CatalogSearch from '@/components/CatalogSearch';
import CustomItemForm from '@/components/CustomItemForm';
import { saveDonation } from '@/app/actions/donationActions';
import { savePhoto } from '@/app/actions/photoActions';
import { useRouter } from 'next/navigation';

interface Item {
  id: number;
  description: string;
  category: {
    name: string;
  };
  defaultHigh: number | null;
  defaultMedium: number | null;
}

interface StagedItem {
  itemId: number;
  description: string;
  quantity: number;
  condition: 'High' | 'Medium' | 'Good';
  value: number;
  totalValue: number;
}

const donationTypes = [
  { id: 'items', title: 'Items', description: 'Clothing, furniture, etc.', icon: '👕' },
  { id: 'assets', title: 'Stock/Asset', description: 'Stock shares', icon: '📈' },
  { id: 'cash', title: 'Cash', description: 'Money donation', icon: '💰' },
];

function AttachmentPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const isPDF = file.type === 'application/pdf';

  return (
    <div className="group relative w-24 h-24 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden hover:border-white/20 transition-all shadow-lg">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={file.name} className="w-full h-full object-cover" />
      ) : isPDF ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl">📄</span>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">PDF</span>
        </div>
      ) : (
        <span className="text-[8px] text-white/40 p-2 text-center break-all">{file.name}</span>
      )}
      <button 
        onClick={onRemove}
        className="absolute inset-0 bg-red-900/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center font-bold text-xs gap-1"
      >
        <span className="text-lg">🗑️</span>
        <span>Remove</span>
      </button>
    </div>
  );
}

export default function DonationBuilder() {
  const router = useRouter();
  const [activeType, setActiveType] = useState('items');
  const [organization, setOrganization] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<'High' | 'Medium' | 'Good'>('Good');
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [assetTicker, setAssetTicker] = useState<string>('');
  const [assetShares, setAssetShares] = useState<string>('');
  const [assetValue, setAssetValue] = useState<string>('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setQuantity(1);
    setCondition('Good');
  };

  const handleAddToDonation = () => {
    if (!selectedItem) return;

    // Mapping Good to High for now based on previous logic, or just use defaults
    const value = condition === 'High' ? selectedItem.defaultHigh || 0 : selectedItem.defaultMedium || 0;
    const newStagedItem: StagedItem = {
      itemId: selectedItem.id,
      description: selectedItem.description,
      quantity,
      condition,
      value,
      totalValue: value * quantity,
    };

    setStagedItems([...stagedItems, newStagedItem]);
    setSelectedItem(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB

      for (const file of newFiles) {
        if (file.size > MAX_SIZE) {
          alert(`File "${file.name}" is too large. Max size is 10MB.`);
          return;
        }
      }

      setPhotos([...photos, ...newFiles]);
    }
  };

  const handleSaveDonation = async () => {
    if (!organization) return;
    setIsSaving(true);
    try {
      // 1. Save photos first (will throw if any fails)
      const photoPaths = await Promise.all(photos.map(savePhoto));

      const typeMap: Record<string, string> = {
        items: 'ITEMS',
        cash: 'CASH',
        assets: 'ASSETS'
      };

      // 2. Save donation
      const result = await saveDonation({
        organization,
        date: new Date(date),
        type: typeMap[activeType] || 'ITEMS',
        notes: notes + (address ? `\nAddress: ${address}` : ''),
        items: activeType === 'items' ? stagedItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          condition: item.condition === 'Good' ? 'Medium' : item.condition,
          lockedValue: item.value,
        })) : [],
        cashAmount: activeType === 'cash' ? parseFloat(cashAmount) || undefined : activeType === 'assets' ? parseFloat(assetValue) || undefined : undefined,
        assetTicker: activeType === 'assets' ? assetTicker : undefined,
        assetShares: activeType === 'assets' ? parseFloat(assetShares) || undefined : undefined,
        photos: photoPaths,
      });

      if (result.success) {
        router.push('/donations');
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Failed to save donation', error);
      alert(error instanceof Error ? error.message : 'A critical error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalDonationValue = activeType === 'items' 
    ? stagedItems.reduce((acc, item) => acc + item.totalValue, 0)
    : activeType === 'cash' 
      ? parseFloat(cashAmount) || 0
      : parseFloat(assetValue) || 0;

  const isSaveDisabled = isSaving || !organization || (
    activeType === 'items' ? stagedItems.length === 0 :
    activeType === 'cash' ? (parseFloat(cashAmount) || 0) <= 0 :
    activeType === 'assets' ? (!assetTicker || (parseFloat(assetShares) || 0) <= 0 || (parseFloat(assetValue) || 0) <= 0) : true
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-1">Add New Donation</h1>
        <p className="text-white/50 text-sm">Record a new charitable contribution</p>
      </header>

      <div className="space-y-8">
        {/* Donation Type */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Donation Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {donationTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`p-6 rounded-xl border text-left transition-all ${
                  activeType === type.id
                    ? 'bg-accent/5 border-accent ring-1 ring-accent'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-2xl mb-2">{type.icon}</span>
                  <span className={`font-bold ${activeType === type.id ? 'text-accent' : 'text-white'}`}>
                    {type.title}
                  </span>
                  <span className="text-xs text-white/40">{type.description}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="date" className="text-xs font-bold uppercase tracking-widest text-white/40">Donation Date</label>
            <input
              id="date"
              type="date"
              className="w-full px-4 py-3 rounded-xl"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="organization" className="text-xs font-bold uppercase tracking-widest text-white/40">Organization Name</label>
            <input
              id="organization"
              type="text"
              placeholder="e.g. Goodwill Industries"
              className="w-full px-4 py-3 rounded-xl"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-2">
          <label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-white/40">Organization Address</label>
          <input
            id="address"
            type="text"
            placeholder="123 Main St, City, State ZIP"
            className="w-full px-4 py-3 rounded-xl"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </section>

        {activeType === 'items' && (
          /* Donated Items Section */
          <section className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold">Donated Items</h2>
              <button
                onClick={() => setIsAddingCustom(true)}
                data-testid="add-item-button"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                <span>➕</span> Add Item
              </button>
            </div>

            {isAddingCustom && (
              <div className="mb-6">
                <CustomItemForm
                  onItemCreated={(item) => {
                    handleSelectItem(item);
                    setIsAddingCustom(false);
                  }}
                  onCancel={() => setIsAddingCustom(false)}
                />
              </div>
            )}

            {/* Staged Items List */}
            <div className="space-y-4">
              {stagedItems.map((item, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-6 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Item {index + 1}</h4>
                    <div className="flex items-baseline gap-4">
                      <span className="text-lg font-bold">{item.description}</span>
                      <span className="text-sm text-white/50">{item.condition} · Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-accent">
                    ${item.totalValue.toFixed(2)}
                  </div>
                </div>
              ))}

              {/* Current Item Entry (if selected) */}
              {selectedItem && (
                <div className="bg-white/5 border border-accent rounded-xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold">Add Item to Donation</h3>
                    <button onClick={() => setSelectedItem(null)} className="text-white/40 hover:text-white">✕</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Item Name</label>
                      <div className="px-4 py-2 bg-[#1e1e21] border border-[#2d2d30] rounded-lg text-sm text-white font-medium">
                        {selectedItem.description}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="item-condition" className="text-[10px] font-black uppercase tracking-widest text-white/40">Condition</label>
                      <select
                        id="item-condition"
                        className="w-full px-4 py-2 rounded-lg"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value as 'High' | 'Medium' | 'Good')}
                      >
                        <option value="Good">Good</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="item-quantity" className="text-[10px] font-black uppercase tracking-widest text-white/40">Quantity</label>
                      <input
                        id="item-quantity"
                        type="number"
                        min="1"
                        className="w-full px-4 py-2 rounded-lg"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Fair Market Value ($)</label>
                      <div className="w-full px-4 py-2 bg-[#121214] border border-[#2d2d30] rounded-lg text-white font-bold">
                        ${((condition === 'High' ? selectedItem.defaultHigh || 0 : selectedItem.defaultMedium || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToDonation}
                    className="w-full bg-accent text-black font-black py-4 rounded-xl hover:bg-yellow-500 transition-colors uppercase tracking-widest text-sm"
                  >
                    Confirm Item
                  </button>
                </div>
              )}

              {/* Empty State / Initial Search Trigger */}
              {!selectedItem && stagedItems.length === 0 && !isAddingCustom && (
                <div className="p-12 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="text-4xl mb-4 text-white/20">📦</div>
                  <h3 className="font-bold text-white/80 mb-2">No items added yet</h3>
                  <p className="text-sm text-white/40 mb-6">Search for an item or add a custom one to begin.</p>
                  <CatalogSearch onSelectItem={handleSelectItem} className="w-full max-w-sm" />
                </div>
              )}
            </div>
          </section>
        )}

        {activeType === 'cash' && (
          <section className="space-y-6">
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold">Cash Details</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-6 animate-in fade-in slide-in-from-top-2">
               <div className="space-y-2 max-w-sm">
                <label htmlFor="cashAmount" className="text-[10px] font-black uppercase tracking-widest text-white/40">Cash Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-white/50">$</span>
                  <input
                    id="cashAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl text-lg font-bold"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {activeType === 'assets' && (
           <section className="space-y-6">
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold">Asset Details</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-6 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="assetTicker" className="text-[10px] font-black uppercase tracking-widest text-white/40">Asset Ticker/Symbol</label>
                  <input
                    id="assetTicker"
                    type="text"
                    placeholder="e.g. AAPL"
                    className="w-full px-4 py-3 rounded-xl"
                    value={assetTicker}
                    onChange={(e) => setAssetTicker(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="assetShares" className="text-[10px] font-black uppercase tracking-widest text-white/40">Number of Shares</label>
                  <input
                    id="assetShares"
                    type="number"
                    min="0.0001"
                    step="any"
                    placeholder="e.g. 10.5"
                    className="w-full px-4 py-3 rounded-xl"
                    value={assetShares}
                    onChange={(e) => setAssetShares(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="assetValue" className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Value on Date ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-white/50">$</span>
                    <input
                      id="assetValue"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl font-bold"
                      value={assetValue}
                      onChange={(e) => setAssetValue(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Total and Save */}
        <section className="pt-10 border-t border-white/10">
          <div className="flex justify-between items-center mb-10">
            <span className="text-lg text-white/50">Total Value:</span>
            <span className="text-5xl font-black text-accent tracking-tighter">
              ${totalDonationValue.toFixed(2)}
            </span>
          </div>

          <div className="space-y-4">
            <label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest text-white/40">Notes (optional)</label>
            <textarea
              id="notes"
              placeholder="Any additional notes about this donation..."
              className="w-full px-4 py-4 rounded-xl h-32"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <section className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Attachments</h3>
            <div className="flex flex-wrap gap-4">
              {photos.map((photo, i) => (
                <AttachmentPreview 
                  key={i} 
                  file={photo} 
                  onRemove={() => setPhotos(photos.filter((_, index) => index !== i))} 
                />
              ))}
              <label className="w-24 h-24 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:text-accent transition-all text-white/20 group">
                <input 
                  type="file" 
                  multiple 
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden" 
                  onChange={handlePhotoUpload} 
                />
                <span className="text-4xl mb-1 group-hover:scale-110 transition-transform">+</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">Add File</span>
              </label>
            </div>
          </section>

          <button
            onClick={handleSaveDonation}
            disabled={isSaveDisabled}
            className="w-full mt-10 bg-accent text-black font-black py-5 rounded-xl hover:bg-yellow-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest"
          >
            {isSaving ? 'Processing...' : activeType === 'items' && stagedItems.length === 0 ? 'Add Items to Continue' : !organization ? 'Enter Organization' : 'Add Donation'}
          </button>
        </section>
      </div>
    </div>
  );
}

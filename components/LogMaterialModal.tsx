import React, { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { useGemini } from '../hooks/useGemini';
import { setPhoto } from '../utils/db';
import { CameraIcon } from './icons/Icons';

interface LogMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

interface ExtractedItem {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]); // return only base64 part
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


const LogMaterialModal: React.FC<LogMaterialModalProps> = ({ isOpen, onClose, projectId }) => {
  const { inventory, logMaterialUsage, logMaterialsFromReceipt } = useData();
  const { extractReceiptData, isProcessingReceipt, receiptError } = useGemini();
  
  // Common state
  const [mode, setMode] = useState<'manual' | 'receipt'>('manual');

  // Manual mode state
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState('');
  
  // Receipt mode state
  const [receiptImage, setReceiptImage] = useState<{ file: File, base64: string, previewUrl: string } | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  
  const selectedItem = useMemo(() => {
    return inventory.find(i => i.id === selectedItemId);
  }, [inventory, selectedItemId]);
  
  // Reset state when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
        setMode('manual');
        setSelectedItemId('');
        setQuantity('');
        setReceiptImage(null);
        setExtractedItems([]);
    }
  }, [isOpen]);
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !quantity) {
      alert('Please select an item and enter a quantity.');
      return;
    }
    const qty = Number(quantity);
    if (selectedItem && qty > selectedItem.quantity) {
        alert(`Cannot use ${qty} ${selectedItem.unit}. Only ${selectedItem.quantity} in stock.`);
        return;
    }
    logMaterialUsage(projectId, Number(selectedItemId), qty);
    onClose();
  };

  const handleReceiptFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExtractedItems([]);
    const previewUrl = URL.createObjectURL(file);
    const base64 = await fileToBase64(file);
    setReceiptImage({ file, base64, previewUrl });

    const result = await extractReceiptData(base64);
    if (result?.items) {
        setExtractedItems(result.items);
    }
  };

  const handleLogReceiptItems = async () => {
    if (!receiptImage || extractedItems.length === 0) return;

    try {
        const photoId = `receipt-${projectId}-${Date.now()}`;
        await setPhoto(photoId, `data:${receiptImage.file.type};base64,${receiptImage.base64}`);
        logMaterialsFromReceipt(projectId, extractedItems, photoId);
        onClose();
    } catch (error) {
        console.error("Error saving receipt photo:", error);
        alert("Could not save the receipt image. Please try again.");
    }
  };


  const renderManualMode = () => (
    <form onSubmit={handleManualSubmit} className="space-y-4">
        <div>
          <label htmlFor="inventoryItem" className="block text-sm font-medium text-gray-700">Inventory Item</label>
          <select
            id="inventoryItem"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            <option value="" disabled>Select an item...</option>
            {inventory.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.quantity} {item.unit} in stock)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="quantityUsed" className="block text-sm font-medium text-gray-700">Quantity Used</label>
          <input
            type="number"
            id="quantityUsed"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder={`e.g., 10 ${selectedItem?.unit || ''}`}
            min="0.01"
            step="0.01"
            required
            />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Log Material</Button>
        </div>
      </form>
  );

  const renderReceiptMode = () => (
    <div className="space-y-4">
        {!receiptImage && (
             <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <CameraIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload a receipt</span></p>
                    <p className="text-xs text-gray-500">PNG, JPG, or GIF</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleReceiptFileChange} />
            </label>
        )}
        
        {isProcessingReceipt && (
            <div className="text-center py-8">
                <p className="font-semibold">Analyzing receipt...</p>
                <p className="text-sm text-gray-500">This may take a moment.</p>
            </div>
        )}

        {receiptError && !isProcessingReceipt && (
            <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50 text-center" role="alert">
                <p className="font-bold">Error</p>
                <p>{receiptError}</p>
                <Button onClick={() => setReceiptImage(null)} variant="secondary" className="mt-2 text-xs">Try Again</Button>
            </div>
        )}

        {extractedItems.length > 0 && !isProcessingReceipt && (
            <div>
                <h3 className="font-bold text-lg mb-2">Extracted Items</h3>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-2 text-left font-semibold">Description</th>
                                <th className="p-2 text-right font-semibold">Qty</th>
                                <th className="p-2 text-right font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                        {extractedItems.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-2">{item.description}</td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right font-semibold">${item.totalPrice.toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleLogReceiptItems} disabled={isProcessingReceipt || extractedItems.length === 0}>
                Log {extractedItems.length} Items
            </Button>
        </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Material Usage">
      <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <button 
                onClick={() => setMode('manual')}
                className={`${mode === 'manual' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
              >
                  From Inventory
              </button>
              <button 
                onClick={() => setMode('receipt')}
                className={`${mode === 'receipt' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
              >
                  Scan Receipt
              </button>
          </nav>
      </div>
      {mode === 'manual' ? renderManualMode() : renderReceiptMode()}
    </Modal>
  );
};

export default LogMaterialModal;
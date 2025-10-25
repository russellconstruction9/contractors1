import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { useGemini } from '../hooks/useGemini';
import { setPhoto } from '../utils/db';
import { CameraIcon } from './icons/Icons';

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({ isOpen, onClose }) => {
  const { projects, logMaterialsFromReceipt } = useData();
  const { extractReceiptData, isProcessingReceipt, receiptError } = useGemini();
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [receiptImage, setReceiptImage] = useState<{ file: File, base64: string, previewUrl: string } | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
        setSelectedProjectId('');
        setReceiptImage(null);
        setExtractedItems([]);
    }
  }, [isOpen]);

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
    if (!receiptImage || extractedItems.length === 0 || !selectedProjectId) {
        alert("Please ensure a project is selected and receipt items are extracted.");
        return;
    }

    try {
        const photoId = `receipt-${selectedProjectId}-${Date.now()}`;
        await setPhoto(photoId, `data:${receiptImage.file.type};base64,${receiptImage.base64}`);
        logMaterialsFromReceipt(Number(selectedProjectId), extractedItems, photoId);
        onClose();
    } catch (error) {
        console.error("Error saving receipt photo:", error);
        alert("Could not save the receipt image. Please try again.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Receipt and Log Materials">
      <div className="space-y-4">
        <div>
          <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700">Assign to Project</label>
          <select
            id="projectSelect"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
            disabled={!!receiptImage} // Disable after uploading to prevent changing project mid-process
          >
            <option value="" disabled>Select a project...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProjectId && !receiptImage && (
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
            <Button onClick={handleLogReceiptItems} disabled={isProcessingReceipt || extractedItems.length === 0 || !selectedProjectId}>
                Log {extractedItems.length} Items to Project
            </Button>
        </div>
    </div>
    </Modal>
  );
};

export default ScanReceiptModal;
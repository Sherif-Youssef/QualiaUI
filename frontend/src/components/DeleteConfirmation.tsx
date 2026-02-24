import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';


interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-failure/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-failure" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Confirm Deletion</h2>
            </div>
          </div>

          <p className="text-gray-600 mb-2">
            Are you sure you want to delete {itemName ? `"${itemName}"` : 'this item'}?
          </p>
          <p className="text-sm text-gray-500">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <Button onClick={onClose} variant="outline" className="border-gray-300">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-failure hover:bg-failure/90 text-white"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

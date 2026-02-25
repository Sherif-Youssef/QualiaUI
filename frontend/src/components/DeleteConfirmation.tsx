import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';


interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  error?: string | null;
  isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  error,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-failure/10 flex items-center justify-center mb-6 rotate-12">
              <AlertTriangle className="w-8 h-8 text-failure -rotate-12" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirm Deletion</h2>
            <p className="text-gray-500 font-medium px-4">
              Are you sure you want to delete {itemName ? <span className="text-gray-800 font-bold">"{itemName}"</span> : 'this item'}? This action is permanent.
            </p>
          </div>

          {error && (
            <div className="mt-6 p-3.5 bg-failure/10 border border-failure/20 rounded-xl flex items-center gap-3 text-failure text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="w-1.5 h-1.5 rounded-full bg-failure animate-pulse"></span>
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 p-6 bg-gray-50 border-t border-gray-100">
          <Button
            onClick={onClose}
            variant="ghost"
            className="flex-1 text-gray-500 hover:text-gray-700 font-bold"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-failure hover:bg-failure/90 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </div>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

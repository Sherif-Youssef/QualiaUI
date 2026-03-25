import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '../GeneralComponents/ErrorMessage';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  error?: string | null;
  onClearError?: () => void;
  isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  error,
  onClearError,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 pb-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6 rotate-12">
              <AlertTriangle className="w-8 h-8 text-red-500 -rotate-12" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Delete Permanently?</h2>
            <p className="text-gray-500 font-medium px-4 leading-relaxed">
              Are you sure you want to delete {itemName ? <span className="text-gray-900 font-extrabold">"{itemName}"</span> : 'this item'}? This action is permanent.
            </p>
          </div>

          {error && (
            <div className="mt-8">
              <ErrorMessage message={error} onClose={onClearError} />
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

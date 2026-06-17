import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from '../ui/button';
import { ModalHeader } from '../GeneralComponents';
import { TestSuite } from '@/types';

interface ViewTestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  suite: TestSuite | null;
}

export const ViewTestSuiteModal: React.FC<ViewTestSuiteModalProps> = ({
  isOpen,
  onClose,
  suite
}) => {
  if (!isOpen || !suite) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader
          title="Test Suite Details"
          subtitle="Explore test suite metadata and configurations"
          icon={Layers}
          onClose={onClose}
        />

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-1.5 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div className="text-[10px] uppercase font-black tracking-widest text-gray-400">Suite Name</div>
            <div className="text-xl font-black text-gray-900 break-words">{suite.name}</div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 px-1">Description</div>
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl max-h-[180px] overflow-y-auto text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
              {suite.description || (
                <span className="italic text-gray-400 font-medium">No description provided for this test suite.</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-gray-50/50">
          <Button onClick={onClose} className="bg-primary hover:bg-primary/90 text-white h-11 px-8 rounded-xl font-bold shadow-lg shadow-primary/20">
            Close Details
          </Button>
        </div>
      </div>
    </div>
  );
};

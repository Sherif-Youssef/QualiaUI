import React from 'react';
import { FileText, Globe, ListChecks } from 'lucide-react';
import { Button } from '../ui/button';
import { ModalHeader } from '../GeneralComponents';
import { TestCase } from '@/types';

interface ViewTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCase | null;
}

export const ViewTestCaseModal: React.FC<ViewTestCaseModalProps> = ({
  isOpen,
  onClose,
  testCase
}) => {
  if (!isOpen || !testCase) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader
          title="Test Case Details"
          subtitle="Explore test case metadata and configurations"
          icon={FileText}
          onClose={onClose}
        />

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="space-y-1.5 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div className="text-[10px] uppercase font-black tracking-widest text-gray-400">Test Case Name</div>
            <div className="text-xl font-black text-gray-900 break-words">{testCase.name}</div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 px-1">Description</div>
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
              {testCase.description || (
                <span className="italic text-gray-400 font-medium">No description provided for this test case.</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 px-1">Preconditions</div>
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
              {testCase.preconditions || (
                <span className="italic text-gray-400 font-medium">No preconditions specified.</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 px-1">Objectives</div>
            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
              {testCase.objectives || (
                <span className="italic text-gray-400 font-medium">No objectives defined.</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 min-w-0">
              <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-gray-400">
                <Globe className="w-3 h-3" />
                <span>Start URL</span>
              </div>
              <div className="text-xs font-mono font-bold text-gray-700 truncate" title={testCase.url}>
                {testCase.url || <span className="italic font-normal text-gray-400">None</span>}
              </div>
            </div>

            <div className="space-y-1.5 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-gray-400">
                <ListChecks className="w-3 h-3" />
                <span>Mode</span>
              </div>
              <div className="text-xs font-black uppercase text-primary tracking-wide">
                {testCase.mode || 'step-based'}
              </div>
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

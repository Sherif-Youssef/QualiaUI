import React from 'react';
import { Camera, ChevronsUpDown } from 'lucide-react';
import { TestStep } from '@/types/test-case';

interface TestDefinitionTableProps {
    steps: TestStep[];
    onStepClick: (step: TestStep) => void;
}

export const TestDefinitionTable: React.FC<TestDefinitionTableProps> = ({ steps, onStepClick }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight capitalize">Test Definition Steps</h2>
                </div>
                <div className="text-[10px] font-black text-gray-400 capitalize tracking-widest">
                    {steps.length} Steps Defined
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all duration-500">
                <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 capitalize tracking-widest w-24">
                                Step #
                            </th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                Description
                            </th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 capitalize tracking-widest">
                                Reference
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {steps.map((step, index) => (
                            <tr
                                key={step.id}
                                onClick={() => onStepClick(step)}
                                className="hover:bg-gray-50/50 cursor-pointer transition-all group"
                            >
                                <td className="px-8 py-6">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sm font-black text-gray-400">
                                        {step.number || index + 1}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                                            <Camera className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-all">
                                            {step.text || 'Action Step'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                                            <ChevronsUpDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

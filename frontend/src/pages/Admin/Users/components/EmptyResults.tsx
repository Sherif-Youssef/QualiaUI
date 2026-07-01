import React from 'react';
import { User } from 'lucide-react';

export const EmptyResults: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-gray-200 mb-6 border border-gray-100/50 grayscale opacity-40">
                <User className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-gray-900">No users found</h3>
            <p className="text-sm font-bold text-gray-400 max-w-xs mt-2 italic text-pretty">
                Try adjusting your filters or search terms to find what you are looking for.
            </p>
        </div>
    );
};

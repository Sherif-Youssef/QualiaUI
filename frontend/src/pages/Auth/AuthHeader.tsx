import React from 'react';

interface AuthHeaderProps {
    head: string;
    explain: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ head, explain }) => {
    return (
        <div className="text-center mb-8">
            <h1 className="text-3xl font-sans font-bold text-gray-800 mb-2">
                {head}
            </h1>
            <p className="text-sm text-gray-500">
                {explain}
            </p>
        </div>
    );
};
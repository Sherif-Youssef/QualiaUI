import React from 'react';

interface AuthFooterProps {
    mainText: string;
    actionText: string;
    onAction: () => void;
}

export const AuthFooter: React.FC<AuthFooterProps> = ({ mainText, actionText, onAction }) => {
    return (
        <p className="mt-8 text-center text-sm text-gray-500">
            {mainText}{" "}
            <button
                onClick={onAction}
                className="text-primary hover:underline font-bold transition-all"
            >
                {actionText}
            </button>
        </p>
    );
};

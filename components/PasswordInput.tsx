"use client";

import React, { useState } from 'react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ className, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <input
                {...props}
                type={showPassword ? "text" : "password"}
                className={`w-full px-4 py-3 rounded-xl poe-input poe-focus-ring font-bold transition-colors pr-12 ${className || ''}`}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-poe-text2 hover:text-poe-gold transition-colors poe-focus-ring rounded-md"
                tabIndex={-1} // Prevent tabbing to this button usually? Or keep it accessible. Keeping accessible is better.
                aria-label={showPassword ? "Hide password" : "Show password"}
            >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
        </div>
    );
};

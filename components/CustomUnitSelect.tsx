'use client';

import React, { useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
    value: string;
    onChange: (value: string) => void;
    measurementSystem?: string; // @deprecated - kept for compatibility.
    className?: string;
    placeholder?: string;
}

const POE_UNITS = ['x', 'stack', 'set', 'lvl', '%', 'socket', 'link', 'slot'];

const CustomUnitSelect: React.FC<Props> = ({ value, onChange, className, placeholder }) => {
    const { t } = useTranslation();

    const displayedUnits = useMemo(() => {
        const units = [...POE_UNITS];

        // Always include the current value if it exists, even if it's from the "wrong" system
        // This preserves legacy values read from old records.
        if (value && !units.includes(value)) {
            units.push(value);
        }

        return units.sort((a, b) => t(`units.${a}`).localeCompare(t(`units.${b}`)));
    }, [value, t]);

    return (
        <div className={`relative ${className}`}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-full appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-4 pr-8 rounded-2xl leading-tight focus:outline-none focus:bg-white focus:border-amber-500 text-sm font-medium transition-all cursor-pointer"
            >
                {placeholder && <option value="" disabled>{placeholder}</option>}
                {displayedUnits.map((u) => (
                    <option key={u} value={u}>
                        {(() => {
                            const key = `units.${u}`;
                            const translated = t(key);
                            return translated === key ? u : translated;
                        })()}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
            </div>
        </div>
    );
};

export default CustomUnitSelect;

/// <reference types="react" />
import React from 'react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const CodeInput: React.FC<CodeInputProps> = ({ value, onChange, placeholder = "Enter code here...", rows = 10 }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full p-3 border border-neutral-medium rounded-lg shadow-sm font-mono text-sm bg-gray-50 focus:ring-brand-primary focus:border-brand-primary focus:bg-white transition-colors"
      spellCheck="false"
    />
  );
};
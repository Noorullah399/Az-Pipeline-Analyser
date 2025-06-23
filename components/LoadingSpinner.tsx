/// <reference types="react" />
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin-slow rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary"></div>
        <p className="mt-4 text-lg text-neutral-dark font-semibold">Processing...</p>
      </div>
    </div>
  );
};
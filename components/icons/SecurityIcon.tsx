/// <reference types="react" />
import React from 'react';

export const SecurityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm-3.75 5.25v3a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5v-3a3.75 3.75 0 10-7.5 0zm-1.5 9a1.5 1.5 0 00-1.5 1.5v.75a1.5 1.5 0 001.5 1.5h7.5a1.5 1.5 0 001.5-1.5v-.75a1.5 1.5 0 00-1.5-1.5h-7.5z" clipRule="evenodd" />
  </svg>
);
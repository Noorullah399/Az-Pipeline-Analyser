/// <reference types="react" />
import React from 'react';
import { ActiveTab } from '../types';

interface TabProps {
  name: ActiveTab;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  // This component doesn't render anything itself, it's for type checking and structure.
  // The actual rendering is handled by the Tabs component.
  return <>{children}</>;
};

interface TabsProps {
  children: React.ReactElement<TabProps> | React.ReactElement<TabProps>[];
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Tabs: React.FC<TabsProps> = ({ children, activeTab, onTabChange }) => {
  const tabsArray = React.Children.toArray(children) as React.ReactElement<TabProps>[];

  return (
    <div>
      <div className="border-b border-neutral-medium">
        <nav className="-mb-px flex space-x-4 sm:space-x-6 md:space-x-8" aria-label="Tabs">
          {tabsArray.map((tab) => {
            const isActive = tab.props.name === activeTab;
            return (
              <button
                key={tab.props.name}
                onClick={() => onTabChange(tab.props.name)}
                className={`
                  whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center
                  ${
                    isActive
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-neutral-medium hover:text-neutral-dark hover:border-gray-300'
                  }
                  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50 rounded-t-md transition-colors duration-150
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.props.icon}
                {tab.props.children}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
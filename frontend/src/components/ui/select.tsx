// Mock implementation for tests
import React from 'react';

// Helper function to combine class names
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export const Select = ({ 
  children, 
  value, 
  onValueChange 
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) => {
  return <div className="select-container">{children}</div>;
};

export const SelectTrigger = ({ children }: { children: React.ReactNode }) => {
  return <button className="select-trigger">{children}</button>;
};

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return <span className="select-value">{placeholder}</span>;
};

export const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="select-content">{children}</div>;
};

export const SelectItem = ({ 
  value, 
  children 
}: {
  value: string;
  children: React.ReactNode;
}) => {
  return <div className="select-item" data-value={value}>{children}</div>;
};

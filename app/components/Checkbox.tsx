import * as React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ 
  checked, 
  onCheckedChange,
  className,
  ...props 
}) => {
  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={`
          h-4 w-4 rounded border border-gray-300
          bg-transparent text-primary-600
          focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          cursor-pointer
          ${className || ''}
        `}
        {...props}
      />
    </div>
  );
};

export default Checkbox;
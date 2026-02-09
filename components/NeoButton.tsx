import React from 'react';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

const NeoButton: React.FC<NeoButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  let bgColor = '#FFDE59'; // Default Yellow
  if (variant === 'secondary') bgColor = '#FFFFFF';
  if (variant === 'danger') bgColor = '#FF66C4';

  return (
    <button
      {...props}
      className={`
        border-4 border-black 
        px-6 py-3 
        font-bold text-lg 
        shadow-neo 
        active:shadow-none active:translate-x-[5px] active:translate-y-[5px] 
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{ backgroundColor: bgColor }}
    >
      {children}
    </button>
  );
};

export default NeoButton;
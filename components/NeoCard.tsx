import React from 'react';

interface NeoCardProps {
  title?: string;
  children: React.ReactNode;
  color?: string;
  className?: string;
  actions?: React.ReactNode;
}

const NeoCard: React.FC<NeoCardProps> = ({
  title,
  children,
  color = '#FFFFFF',
  className = '',
  actions
}) => {
  return (
    <div
      className={`border-4 border-black shadow-neo mb-6 relative transition-all ${className}`}
      style={{ backgroundColor: color }}
    >
      {title && (
        <div className="flex flex-col md:flex-row justify-between items-stretch border-b-4 border-black bg-white select-none">
          {/* Title Area */}
          <div className="bg-black text-white px-3 py-2 text-xl font-bold flex items-center flex-grow">
            {title.toUpperCase()}
          </div>

          {/* Right Side: Actions */}
          {actions && (
            <div className="flex items-stretch border-t-4 md:border-t-0 md:border-l-0 border-black bg-white">
              <div className="flex items-center px-3 py-1 gap-2 border-r-4 border-black md:border-r-0 md:border-l-4 overflow-x-auto">
                {actions}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-4 md:p-6 font-mono text-black animate-in slide-in-from-top-2 duration-200">
        {children}
      </div>
    </div>
  );
};

export default NeoCard;
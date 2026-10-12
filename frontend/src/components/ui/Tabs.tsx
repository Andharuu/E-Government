import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pill' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onChange,
  variant = 'pill',
  className = '',
}) => {
  if (variant === 'underline') {
    return (
      <div className={`flex items-center gap-6 border-b border-[#BDD8E9] overflow-x-auto no-scrollbar ${className}`}>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`pb-3 text-xs sm:text-[13px] font-semibold transition-all duration-150 flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[#0A4174] text-[#0A4174] font-bold'
                  : 'border-transparent text-[#49769F] hover:text-[#001D39] hover:border-[#6EA2B3]'
              }`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#BDD8E9]/40 text-[#0A4174] font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 p-1 bg-[#BDD8E9]/25 border border-[#BDD8E9]/50 rounded-xl overflow-x-auto no-scrollbar ${className}`}>
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-white text-[#0A4174] shadow-xs font-bold border border-[#BDD8E9]/50'
                : 'text-[#49769F] hover:text-[#001D39] hover:bg-white/60'
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-[#BDD8E9]/60 text-[#0A4174]' : 'bg-[#BDD8E9]/30 text-[#49769F]'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

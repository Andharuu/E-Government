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
      <div className={`tab-underline no-scrollbar ${className}`}>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              data-active={isActive}
              className="tab-underline-item inline-flex items-center gap-2"
            >
              {item.icon && <span className="shrink-0 text-[12px]">{item.icon}</span>}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-3 text-ink-2 font-semibold">
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
    <div className={`segmented no-scrollbar ${className}`}>
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            data-active={isActive}
            className="segmented-item"
          >
            {item.icon && <span className="shrink-0 text-[12px]">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 rounded-full font-semibold ${
                  isActive ? 'bg-accent-soft text-accent-text' : 'bg-surface-3 text-ink-3'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

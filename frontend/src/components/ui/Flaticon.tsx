import React from 'react';
import { FontAwesome } from './FontAwesome';

export interface FlaticonProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  variant?: 'rr' | 'br';
  className?: string;
  spin?: boolean;
}

export const Flaticon: React.FC<FlaticonProps> = ({
  name,
  variant,
  className = '',
  spin,
  ...props
}) => {
  // Map variant: 'br' (bold rounded) -> solid, otherwise let FontAwesome use icon's natural variant (regular or solid fallback)
  const faVariant = variant === 'br' ? 'solid' : variant === 'rr' ? 'regular' : undefined;

  return (
    <FontAwesome
      name={name}
      variant={faVariant}
      className={className}
      spin={spin}
      {...props}
    />
  );
};

export { FontAwesome, type FontAwesomeProps } from './FontAwesome';

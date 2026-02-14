import React, { useMemo } from 'react';
import clsx from 'clsx';
import { spacingTokens, shapeTokens } from '../../theme/designSystem';

export interface FeatureContentProps {
  children: React.ReactNode;
  variant?: 'paper' | 'transparent';
  padding?: keyof typeof spacingTokens | number;
  className?: string;
}

export const FeatureContent: React.FC<FeatureContentProps> = ({
  children,
  variant = 'paper',
  padding = 'lg',
  className,
}) => {
  const paddingValue = typeof padding === 'number' ? padding : spacingTokens[padding];

  const style = useMemo<React.CSSProperties>(() => ({
    padding: paddingValue,
    borderRadius: shapeTokens.corner.medium,
  }), [paddingValue]);

  const classes = clsx(
    'w-full',
    variant === 'paper' ? 'bg-card shadow-sm border border-border' : 'bg-transparent',
    className,
  );

  return (
    <section className={classes} style={style}>
      {children}
    </section>
  );
};

export default FeatureContent;

import React from 'react';
import clsx from 'clsx';
import { spacingTokens } from '../../theme/designSystem';

export interface FeatureLayoutProps {
  children: React.ReactNode;
  /** false = full width, otherwise max width token */
  maxWidth?: false | 'xl';
  className?: string;
}

const SCROLLBAR_STYLE: React.CSSProperties = {
  overflow: 'auto',
  paddingTop: spacingTokens.md,
  paddingBottom: spacingTokens.lg,
  paddingLeft: spacingTokens.lg,
  paddingRight: spacingTokens.lg,
};

export const FeatureLayout: React.FC<FeatureLayoutProps> = ({ children, maxWidth = 'xl', className }) => {
  const containerClass = clsx(
    'mx-auto flex w-full flex-col gap-6',
    maxWidth === false ? 'max-w-none' : 'max-w-screen-xl',
    className,
  );

  return (
    <main className="flex h-full min-h-0 flex-1">
      <div className="flex h-full w-full flex-1" style={SCROLLBAR_STYLE}>
        <div className={containerClass}>{children}</div>
      </div>
    </main>
  );
};

export default FeatureLayout;

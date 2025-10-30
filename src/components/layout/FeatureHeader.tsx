import React, { ReactNode, useMemo } from 'react';
import clsx from 'clsx';
import { Button } from '../ui/button';
import { spacingTokens } from '../../theme/designSystem';

interface HeaderButton {
  text: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  icon?: ReactNode;
}

export interface FeatureHeaderProps {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  addButtonText?: string;
  actions?: ReactNode;
  buttons?: HeaderButton[];
  showAddButton?: boolean;
}

export const FeatureHeader: React.FC<FeatureHeaderProps> = ({
  title,
  subtitle,
  onAdd,
  addButtonText = '新規作成',
  actions,
  buttons,
  showAddButton = true,
}) => {
  const headerStyle = useMemo<React.CSSProperties>(() => ({
    paddingBottom: spacingTokens.sm,
    borderBottom: '1px solid var(--border)',
  }), []);

  return (
    <header className="flex flex-col gap-4" style={headerStyle}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          <div className="flex items-center gap-2">
            {buttons?.map((button) => (
              <Button
                key={button.text}
                variant={button.variant ?? 'outline'}
                onClick={button.onClick}
                className={clsx('flex items-center gap-2')}
              >
                {button.icon}
                <span>{button.text}</span>
              </Button>
            ))}
            {showAddButton && onAdd ? (
              <Button onClick={onAdd} variant="default" className="flex items-center gap-2">
                {addButtonText}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default FeatureHeader;

import React from 'react';

interface AppContentContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const AppContentContainer: React.FC<AppContentContainerProps> = ({
  children,
  className = '',
  style = {}
}) => {
  return (
    <div 
      className={`w-full max-w-4xl mx-auto ${className}`}
      style={{
        paddingLeft: 'var(--content-margin-inline, 10px)',
        paddingRight: 'var(--content-margin-inline, 10px)',
        ...style
      }}
    >
      {children}
    </div>
  );
};

import Tippy from '@tippyjs/react';
import type { ReactElement, ReactNode } from 'react';
import { useLanguageStore } from '@/stores/languageStore';

interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end';
  delay?: number | [number, number];
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = [200, 0],
  disabled,
}: TooltipProps) {
  const { language } = useLanguageStore();
  const isRTL = language === 'fa';

  if (disabled || !content) return children;

  return (
    <Tippy
      content={
        <span
          className="text-xs"
          style={{ fontFamily: isRTL ? "'Vazirmatn', sans-serif" : "'Inter', sans-serif" }}
        >
          {content}
        </span>
      }
      placement={placement}
      delay={delay}
      animation="shift-away-subtle"
      theme="freshflow"
      arrow={true}
    >
      {children}
    </Tippy>
  );
}

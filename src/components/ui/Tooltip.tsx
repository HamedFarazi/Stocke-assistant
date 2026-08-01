import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away-subtle.css';
import type { ReactElement, ReactNode } from 'react';
import { useLanguageStore } from '@/stores/languageStore';

interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end';
  delay?: number | [number, number];
  disabled?: boolean;
}

export function Tooltip({ content, children, placement = 'top', delay = [200, 0], disabled }: TooltipProps) {
  const { language } = useLanguageStore();
  const isRTL = language === 'fa';

  return (
    <Tippy
      content={
        <span
          style={{ fontFamily: isRTL ? "'Vazirmatn', sans-serif" : "'Inter', sans-serif" }}
          className="text-xs"
        >
          {content}
        </span>
      }
      placement={placement}
      delay={delay}
      animation="shift-away-subtle"
      disabled={disabled}
      theme="freshflow"
    >
      {children}
    </Tippy>
  );
}

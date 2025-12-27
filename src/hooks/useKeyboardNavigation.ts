/**
 * useKeyboardNavigation Hook
 * Provides keyboard navigation utilities for accessible components
 */

import { useEffect, useCallback, RefObject } from 'react';

interface UseKeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  enabled?: boolean;
}

/**
 * Hook for handling keyboard navigation
 */
export function useKeyboardNavigation(
  ref: RefObject<HTMLElement>,
  options: UseKeyboardNavigationOptions = {}
) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
      }
    },
    [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, handleKeyDown, enabled]);
}

/**
 * Hook for managing focus trap in modals/dialogs
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store the element that had focus before the trap
    const previouslyFocusedElement = document.activeElement as HTMLElement;

    // Focus the first element
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Cleanup: restore focus to previously focused element
    return () => {
      container.removeEventListener('keydown', handleTabKey);
      previouslyFocusedElement?.focus();
    };
  }, [containerRef, isActive]);
}

/**
 * Hook for announcing messages to screen readers
 */
export function useScreenReaderAnnouncement() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return announce;
}

/**
 * Hook for managing roving tabindex (for lists, menus, etc.)
 */
export function useRovingTabIndex(
  containerRef: RefObject<HTMLElement>,
  itemSelector: string = '[role="menuitem"], [role="option"]'
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
    let currentIndex = 0;

    // Set initial tabindex
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;

      e.preventDefault();

      // Remove tabindex from current item
      items[currentIndex]?.setAttribute('tabindex', '-1');

      switch (e.key) {
        case 'ArrowDown':
          currentIndex = (currentIndex + 1) % items.length;
          break;
        case 'ArrowUp':
          currentIndex = (currentIndex - 1 + items.length) % items.length;
          break;
        case 'Home':
          currentIndex = 0;
          break;
        case 'End':
          currentIndex = items.length - 1;
          break;
      }

      // Set tabindex and focus on new item
      items[currentIndex]?.setAttribute('tabindex', '0');
      items[currentIndex]?.focus();
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, itemSelector]);
}

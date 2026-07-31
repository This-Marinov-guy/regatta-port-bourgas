"use client";

import type { ReactNode } from "react";
import { Icon } from "@iconify/react";

const interactiveButtonClass =
  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md";

type AdminModalProps = {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  fillHeight?: boolean;
};

/**
 * Shared admin modal shell: fixed header (title/description + close button),
 * a scrollable body, and an optional footer that always stays pinned to the
 * bottom of the modal card (it renders outside the scrollable body, so it
 * never depends on sticky/scroll-position tricks).
 */
export function AdminModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  fillHeight = false,
}: AdminModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div data-modal-root className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-dark/45 px-2 py-3 backdrop-blur-sm animate-in fade-in duration-200 sm:px-4 sm:py-8">
      <div className={`my-auto flex max-h-[calc(100vh-1.5rem)] w-full min-w-0 max-w-5xl flex-col overflow-hidden rounded-[1.25rem] border border-black/10 bg-white shadow-[0_30px_100px_rgba(23,32,35,0.2)] animate-in zoom-in-95 slide-in-from-bottom-6 duration-300 sm:max-h-[calc(100vh-4rem)] sm:rounded-[1.75rem] ${
        fillHeight ? "h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-4rem)]" : ""
      }`}
      >
        <div className="shrink-0 p-4 pb-0 sm:p-6 sm:pb-0 md:p-8 md:pb-0">
          <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6 sm:gap-4">
            <div className="min-w-0">
              <h3 className="break-words text-xl font-semibold text-dark sm:text-2xl">{title}</h3>
              {description ? (
                <p className="mt-1 leading-6 text-dark/60">{description}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              title="Close"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-600 ${interactiveButtonClass}`}
            >
              <Icon icon="ph:x-bold" width={22} height={22} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-0 sm:p-6 sm:pt-0 md:p-8 md:pt-0">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 flex flex-wrap items-center justify-center gap-3 border-t border-black/10 bg-white px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

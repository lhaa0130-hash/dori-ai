"use client";

import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  children?: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  eyebrow?: string;
}

export default function IlloGameDialog({
  title,
  description,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  eyebrow = "illo : play",
}: Props) {
  return (
    <div className="illo-dialog-backdrop" role="presentation">
      <section className="illo-dialog" role="dialog" aria-modal="true" aria-labelledby="illo-dialog-title">
        <p className="illo-dialog-eyebrow">{eyebrow}</p>
        <h2 id="illo-dialog-title">{title}</h2>
        {description && <p className="illo-dialog-description">{description}</p>}
        {children}
        <div className="illo-dialog-actions">
          <button type="button" className="illo-primary-button" onClick={onPrimary}>{primaryLabel}</button>
          {secondaryLabel && onSecondary && (
            <button type="button" className="illo-secondary-button" onClick={onSecondary}>{secondaryLabel}</button>
          )}
        </div>
      </section>
    </div>
  );
}


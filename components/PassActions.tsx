'use client';

// Top-right buttons on a pass page: back to everyone, copy this pass's link, save the card images.

import Link from 'next/link';
import { useState } from 'react';

export default function PassActions({ name, front, back }: { name: string; front: string; back: string }) {
  const [copied, setCopied] = useState(false);
  const file = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <nav className="pass-actions" aria-label="Pass">
      <Link href="/" className="pa-btn pa-btn--ghost">
        All passes
      </Link>
      <button type="button" className="pa-btn" onClick={() => void copy()}>
        {copied ? 'Link copied' : 'Copy my link'}
      </button>
      <a className="pa-btn pa-btn--ghost" href={front} download={`LEED26-${file}-front.jpg`}>
        Save front
      </a>
      <a className="pa-btn pa-btn--ghost" href={back} download={`LEED26-${file}-back.jpg`}>
        Save back
      </a>
    </nav>
  );
}

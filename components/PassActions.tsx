'use client';

// Share and Save buttons for the pass page's bottom bar.

import { useState } from 'react';

export default function PassActions({ name, front }: { name: string; front: string }) {
  const [copied, setCopied] = useState(false);
  const file = `LEED26-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`;
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name}, LEED 26 pass`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* share cancelled or clipboard blocked */
    }
  };
  return (
    <>
      <button type="button" className="dock-btn dock-btn--go" onClick={() => void share()}>
        {copied ? 'Link copied' : 'Share'}
      </button>
      <a className="dock-btn" href={front} download={file}>
        Save
      </a>
    </>
  );
}

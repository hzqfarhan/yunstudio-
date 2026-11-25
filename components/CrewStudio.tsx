'use client';

// The crew gallery: every LEED 26 pass, searchable by name and filtered by committee and by AJK Student / AJK Staff.

import Link from 'next/link';
import { useMemo, useState } from 'react';
import CrewIntro from './CrewIntro';
import { KIND_LABEL, frontOf, type CrewKind, type CrewMember } from '@/lib/crew';

type KindFilter = 'all' | CrewKind;

const TOP = ['Patron', 'Director', 'Deputy Director', 'Secretary', 'Assistant Secretary', 'Treasurer'];
// High committee first, unconfirmed committees last; inside a committee, top posts and leaders first.
const rank = (c: CrewMember) => (c.committee === 'High Committee' ? 0 : c.committee === 'To be confirmed' ? 2 : 1);
const roleRank = (c: CrewMember) =>
  (TOP.includes(c.role) ? TOP.indexOf(c.role) : c.role === 'Leader' ? 10 : c.role === 'Advisory Crew' ? 15 : 20) * 2 + (c.kind === 'staff' ? 0 : 1);
const initials = (n: string) =>
  n
    .replace(/^((dr|prof|pm|ts|en|pn|cik)\.?\s+)+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export default function CrewStudio({ crew }: { crew: CrewMember[] }) {
  const [find, setFind] = useState('');
  const [kind, setKind] = useState<KindFilter>('student');
  const [committee, setCommittee] = useState('all');

  const committees = useMemo(() => {
    const n = new Map<string, number>();
    for (const c of crew) if (kind === 'all' || c.kind === kind) n.set(c.committee, (n.get(c.committee) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [crew, kind]);

  const needle = find.trim().toLowerCase();
  const shown = crew
    .filter((c) => (kind === 'all' || c.kind === kind) && (committee === 'all' || c.committee === committee) && (!needle || `${c.name} ${c.fullName}`.toLowerCase().includes(needle)))
    .sort((a, b) => rank(a) - rank(b) || a.committee.localeCompare(b.committee) || Number(!!a.pending) - Number(!!b.pending) || roleRank(a) - roleRank(b) || a.name.localeCompare(b.name));

  const count = (k: KindFilter) => (k === 'all' ? crew.length : crew.filter((c) => c.kind === k).length);
  const committeeGone = committee !== 'all' && !committees.some(([c]) => c === committee);

  // Up to 7 real cards for the intro, top posts first, then spread across committees.
  const introCards = useMemo(() => {
    const withCard = crew.filter((c) => c.hasCard && !c.pending);
    const top = withCard.filter((c) => TOP.includes(c.role));
    const seen = new Set<string>();
    const rest = withCard.filter((c) => !TOP.includes(c.role) && !seen.has(c.committee) && seen.add(c.committee));
    return [...top, ...rest].slice(0, 7).map(frontOf);
  }, [crew]);

  return (
    <div className="studio">
      <CrewIntro cards={introCards} />
      <header className="studio-head">
        <div>
          <h1>LEED 26 crew passes</h1>
          <p>Find your name and tap your pass to look at it up close in 3D. Your pass has its own link you can keep.</p>
        </div>
        <p className="studio-total">
          <strong>{crew.filter((c) => !c.pending).length}</strong> passes
        </p>
      </header>

      <div className="studio-tools">
        <input
          type="search"
          className="studio-find"
          placeholder="Find your name"
          aria-label="Find a name"
          value={find}
          onChange={(e) => setFind(e.target.value)}
          autoComplete="off"
        />
        <div className="studio-kinds" role="radiogroup" aria-label="AJK">
          {(['student', 'staff', 'all'] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}>
              {k === 'all' ? 'Everyone' : KIND_LABEL[k]}
              <span>{count(k)}</span>
            </button>
          ))}
        </div>
        <label className="studio-committee">
          <span>Committee</span>
          <select value={committeeGone ? 'all' : committee} onChange={(e) => setCommittee(e.target.value)}>
            <option value="all">All committees</option>
            {committees.map(([c, n]) => (
              <option key={c} value={c}>
                {`${c} (${n})`}
              </option>
            ))}
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="studio-empty">
          <h2>No pass found</h2>
          <p>
            {needle ? `Nobody called “${find.trim()}” in this view. ` : ''}Check the spelling, or clear the filters to see everyone.
          </p>
          <button
            type="button"
            onClick={() => {
              setFind('');
              setKind('all');
              setCommittee('all');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="studio-grid">
          {shown.map((c) => (
            <li key={c.id}>
              {c.pending ? (
                <div className="studio-card is-pending" aria-label={`${c.name}: has not submitted the card form yet`}>
                <span className="studio-thumb">
                  {c.hasCard && !c.pending ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={frontOf(c)} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="studio-soon" aria-hidden="true">
                      <b>{initials(c.name)}</b>
                      <small>{c.pending ? 'Not submitted yet' : 'Card coming soon'}</small>
                    </span>
                  )}
                  {c.pending ? (
                    <span className="studio-kind studio-kind--pending">Not submitted</span>
                  ) : (
                    <span className={`studio-kind studio-kind--${c.kind}`}>{KIND_LABEL[c.kind]}</span>
                  )}
                </span>
                <span className="studio-name">{c.name}</span>
                {c.committee === 'High Committee' ? (
                  <span className="studio-meta">
                    <b>{c.role}</b>
                  </span>
                ) : (
                  <span className="studio-meta">
                    <b>{c.committee === 'To be confirmed' ? 'Committee to be confirmed' : c.committee}</b>
                  </span>
                )}
                </div>
              ) : (
                <Link href={`/pass/${c.id}`} className="studio-card">
                <span className="studio-thumb">
                  {c.hasCard && !c.pending ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={frontOf(c)} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="studio-soon" aria-hidden="true">
                      <b>{initials(c.name)}</b>
                      <small>{c.pending ? 'Not submitted yet' : 'Card coming soon'}</small>
                    </span>
                  )}
                  {c.pending ? (
                    <span className="studio-kind studio-kind--pending">Not submitted</span>
                  ) : (
                    <span className={`studio-kind studio-kind--${c.kind}`}>{KIND_LABEL[c.kind]}</span>
                  )}
                </span>
                <span className="studio-name">{c.name}</span>
                {c.committee === 'High Committee' ? (
                  <span className="studio-meta">
                    <b>{c.role}</b>
                  </span>
                ) : (
                  <span className="studio-meta">
                    <b>{c.committee === 'To be confirmed' ? 'Committee to be confirmed' : c.committee}</b>
                  </span>
                )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="studio-foot">Developed by SELADEVS</p>
    </div>
  );
}

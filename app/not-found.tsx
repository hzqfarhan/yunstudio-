import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="studio">
      <div className="studio-empty">
        <h2>This pass does not exist</h2>
        <p>The link may be mistyped, or the pass has not been added yet.</p>
        <Link href="/">See all passes</Link>
      </div>
    </main>
  );
}

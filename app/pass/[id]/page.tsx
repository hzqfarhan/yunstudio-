import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PassScene from '@/components/PassScene';
import PassActions from '@/components/PassActions';
import { CREW, DEFAULT_BACK, KIND_LABEL, findCrew, frontOf } from '@/lib/crew';

export function generateStaticParams() {
  return CREW.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = findCrew((await params).id);
  return c ? { title: `${c.name}, LEED 26 pass`, description: `${c.role}, ${c.committee}. LEED 26 crew pass.` } : {};
}

export default async function PassPage({ params }: { params: Promise<{ id: string }> }) {
  const c = findCrew((await params).id);
  if (!c) notFound();
  const back = c.back ?? DEFAULT_BACK;
  return (
    <main>
      <PassScene key={c.id} front={frontOf(c)} back={back} name={c.name} committee={c.committee === 'To be confirmed' ? 'Committee to be confirmed' : `AJK ${c.committee}`} detail={`${c.role}, ${KIND_LABEL[c.kind]}`} />
      <PassActions name={c.name} front={frontOf(c)} back={back} />
    </main>
  );
}

import CrewStudio from '@/components/CrewStudio';
import { CREW } from '@/lib/crew';

export default function Home() {
  return (
    <main>
      <CrewStudio crew={CREW} />
    </main>
  );
}

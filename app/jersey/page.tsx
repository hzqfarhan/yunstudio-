import type { Metadata } from 'next';
import JerseyScene from '@/components/JerseyScene';

export const metadata: Metadata = {
  title: 'LEED 26 crew polo',
  description: 'The LEED 26 FSKTM crew polo in 3D. Drag to turn it.',
};

export default function JerseyPage() {
  return (
    <main>
      <JerseyScene />
    </main>
  );
}

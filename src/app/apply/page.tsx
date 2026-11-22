import type { Metadata } from 'next';
import { Apply } from '@/components/apply/Apply';

export const metadata: Metadata = { title: 'Use your cursor' };

export default function ApplyPage() {
  return <Apply />;
}

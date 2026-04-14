import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { suites } from '@/data/suites';
import SuitePageClient from './SuitePageClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const suite = suites.find((s) => s.id === id);
  if (!suite) return {};
  return {
    title: `${suite.name} | Hotel Paraíso Encantado · Xilitla`,
    description: `${suite.description} Disfruta de esta experiencia desde $1,200 MXN/noche. Reserva directa sin comisiones.`,
  };
}

export async function generateStaticParams() {
  return suites.map((s) => ({ id: s.id }));
}

export default async function SuitePage({ params }: Props) {
  const { id } = await params;
  const suite = suites.find((s) => s.id === id);
  if (!suite) notFound();
  return <SuitePageClient suite={suite} />;
}

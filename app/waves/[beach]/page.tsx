import { Metadata } from 'next';
import BeachPageClient from './beach-page-client';

export default async function BeachPage({
  params,
}: {
  params: { beach: string };
}) {
  const beach = await Promise.resolve(params.beach);
  return <BeachPageClient beach={beach} />;
} 
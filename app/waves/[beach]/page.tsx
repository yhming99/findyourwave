import { Metadata } from 'next';
import BeachPageClient from './beach-page-client';

interface PageProps {
  params: {
    beach: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function BeachPage({ params, searchParams }: PageProps) {
  return <BeachPageClient beach={params.beach} />;
} 
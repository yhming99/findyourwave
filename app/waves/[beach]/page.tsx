import { Metadata } from 'next';
import BeachPageClient from './beach-page-client';

type PageProps = {
  params: Promise<{ beach: string }>;
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function BeachPage(props: PageProps) {
  const { beach } = await props.params;
  return <BeachPageClient beach={beach} />;
} 
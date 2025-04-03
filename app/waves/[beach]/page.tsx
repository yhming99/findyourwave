import { Metadata } from 'next';
import BeachPageClient from './beach-page-client';

type SearchParams = { [key: string]: string | string[] | undefined };

type PageProps = {
  params: Promise<{ beach: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function BeachPage(props: PageProps) {
  const [{ beach }, searchParams] = await Promise.all([
    props.params,
    props.searchParams
  ]);
  return <BeachPageClient beach={beach} />;
} 
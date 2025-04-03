import BeachPageClient from './beach-page-client';


export default function BeachPage({ params }: { params: { beach: string } }) {
  return <BeachPageClient beach={params.beach} />;
} 
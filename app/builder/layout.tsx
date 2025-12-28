import { Suspense } from 'react';

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading builder...</div>}>
      {children}
    </Suspense>
  );
}

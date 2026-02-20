'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BlueprintExplode from '@/components/sections/BlueprintExplode';

export default function BlueprintPage() {
  return (
    <>
      <Header />
      <main>
        <BlueprintExplode />
      </main>
      <Footer />
    </>
  );
}

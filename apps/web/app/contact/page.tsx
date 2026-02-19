'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VerticalLine from '@/components/ui/VerticalLine';
import BlueprintGrid from '@/components/ui/BlueprintGrid';
import NavIcon from '@/components/ui/NavIcon';
import ContactTypography from '@/components/ui/ContactTypography';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function ContactPage() {
  const leftRef = useScrollReveal<HTMLDivElement>({ y: 30 });
  const rightRef = useScrollReveal<HTMLDivElement>({ y: 30, delay: 0.15 });

  return (
    <>
      <Header />
      <main>
        <section className="relative flex min-h-screen items-start px-6 pt-28 md:px-10 lg:px-16">
          <BlueprintGrid variant="hero" />
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-12 py-16 lg:flex-row lg:gap-24">
            {/* Left side: decorative line + SVG typography */}
            <div className="flex gap-6 lg:w-2/5">
              <VerticalLine className="hidden h-[400px] shrink-0 md:flex" />
              <div ref={leftRef}>
                <ContactTypography className="h-auto w-full max-w-[280px] md:max-w-[320px] lg:max-w-[353px]" />
              </div>
            </div>

            {/* Right side: contact info */}
            <div ref={rightRef} className="flex-1 pt-4 lg:pt-12">
              {/* Email row */}
              <div className="border-t border-bp-line py-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <a
                    href="mailto:contact@arcarleton.ca"
                    className="flex items-center gap-2.5 text-sm tracking-widest transition-colors hover:text-accent"
                  >
                    <NavIcon />
                    CONTACT@ARCARLETON.CA
                  </a>
                  <p className="max-w-[240px] text-right text-sm leading-relaxed text-fg/60">
                    Feel free to reach out if you want to collaborate with us, or
                    simply have a chat!
                  </p>
                </div>
              </div>

              {/* Location row */}
              <div className="border-t border-bp-line py-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <a
                    href="https://maps.google.com/?q=1125+Colonel+By+Dr+Ottawa+ON+K1S+5B6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm tracking-widest transition-colors hover:text-accent"
                  >
                    <NavIcon />
                    VIEW ON GOOGLE MAPS
                  </a>
                  <div className="text-right text-sm leading-relaxed text-fg/60">
                    <p>Mackenzie Building 4463</p>
                    <p>1125 Colonel By Dr, Ottawa, ON K1S 5B6</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

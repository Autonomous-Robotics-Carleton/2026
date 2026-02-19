'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ArcLogo from '@/components/ui/ArcLogo';
import BlueprintGrid from '@/components/ui/BlueprintGrid';
import WireframeCar from '@/components/ui/WireframeCar';
import CornerTicks from '@/components/ui/CornerTicks';
import StackedLogos from '@/components/ui/StackedLogos';
import { getSponsorLogo } from '@/components/ui/SponsorLogos';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useParallax } from '@/hooks/useParallax';
import { sponsors } from '@/data/sponsors';

// Build logo groups: each column cycles through ALL sponsors
function buildLogoGroups(columns: number) {
  const logos = sponsors.map((s) => getSponsorLogo(s.name));
  return Array.from({ length: columns }, () => logos);
}

export default function HomePage() {
  const heroRef = useScrollReveal<HTMLDivElement>();
  const identityRef = useScrollReveal<HTMLDivElement>({ delay: 0.1 });
  const missionRef = useScrollReveal<HTMLDivElement>({ delay: 0.1 });
  const sponsorsRef = useScrollReveal<HTMLDivElement>({ delay: 0.1 });
  const carRef = useParallax<HTMLDivElement>({ speed: 0.15 });
  const gridRef = useParallax<HTMLDivElement>({ speed: 0.05, direction: 'y' });

  const logoGroups = buildLogoGroups(4);

  return (
    <>
      <Header />

      <main>
        {/* ── Hero with large ARC logo ── */}
        <section className="relative overflow-hidden px-6 pt-28 md:px-10 lg:px-16">
          <div ref={gridRef} className="absolute inset-[-20px]">
            <BlueprintGrid variant="hero" />
          </div>
          <div
            ref={heroRef}
            className="relative mx-auto max-w-[1440px] py-16 md:py-24 lg:py-32"
          >
            <ArcLogo className="h-20 w-auto text-white md:h-28 lg:h-36" />
          </div>
          {/* Wireframe car decoration */}
          <div
            ref={carRef}
            className="pointer-events-none absolute right-4 bottom-8 z-[1] w-[260px] md:right-10 md:w-[380px] lg:right-16 lg:w-[500px]"
          >
            <WireframeCar />
          </div>
        </section>

        {/* ── Identity Section ── */}
        <section className="relative px-6 md:px-10 lg:px-16">
          <BlueprintGrid variant="section" />
          <div className="mx-auto max-w-[1440px] py-16 md:py-20">
            <div
              ref={identityRef}
              className="relative flex flex-col gap-6 md:flex-row md:items-start md:gap-16 lg:gap-24"
            >
              <CornerTicks label="01" />
              <h2 className="shrink-0 text-3xl md:text-4xl lg:text-5xl">
                IDENTITY
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-fg/70 md:text-base">
                ARC is a student-run engineering club at Carleton University focused
                on building autonomous robotics systems. We give students hands-on
                experience in designing, building, and testing robots while
                fostering interdisciplinary collaboration across engineering,
                computer science, and design disciplines.
              </p>
            </div>
          </div>
        </section>

        {/* ── Mission Section ── */}
        <section className="relative px-6 md:px-10 lg:px-16">
          <BlueprintGrid variant="section" />
          <div className="mx-auto max-w-[1440px] py-16 md:py-20">
            <div
              ref={missionRef}
              className="relative flex flex-col gap-6 md:flex-row md:items-start md:gap-16 lg:gap-24"
            >
              <CornerTicks label="02" />
              <h2 className="shrink-0 text-3xl md:text-4xl lg:text-5xl">
                MISSION
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-fg/70 md:text-base">
                Our mission is to create a collaborative and inclusive space for
                students to explore and contribute to the future of autonomous
                vehicles: developing practical skills, valuable experience,
                meaningful connections, and cutting edge projects along the way.
              </p>
            </div>
          </div>
        </section>

        {/* ── Sponsors Section ── */}
        <section className="relative px-6 pb-24 md:px-10 md:pb-32 lg:px-16 lg:pb-40">
          <BlueprintGrid variant="minimal" />
          <div className="mx-auto max-w-[1440px]">
            <div ref={sponsorsRef} className="relative">
              <CornerTicks label="03" />
              <h2 className="text-3xl md:text-4xl lg:text-5xl">SPONSORS</h2>
              <div className="mt-12 text-fg/50 md:mt-16">
                <StackedLogos
                  logoGroups={logoGroups}
                  columns={4}
                  duration={28}
                  stagger={3}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* ── Bottom Marquee ── */}
      <div className="overflow-hidden border-t border-bp-line bg-bp-blue-dark py-4">
        <div className="animate-marquee flex whitespace-nowrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="mx-4 text-4xl tracking-wider text-accent/15 md:text-5xl lg:text-6xl"
            >
              AHEAD OF THE CURVE&nbsp;&nbsp;AHEAD OF THE CURVE&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

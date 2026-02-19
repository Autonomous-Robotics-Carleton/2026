'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VerticalLine from '@/components/ui/VerticalLine';
import BlueprintGrid from '@/components/ui/BlueprintGrid';
import CornerTicks from '@/components/ui/CornerTicks';
import { useScrollReveal, useStaggerReveal } from '@/hooks/useScrollReveal';
import { projects } from '@/data/projects';

export default function ProjectsPage() {
  const headingRef = useScrollReveal<HTMLDivElement>();
  const gridRef = useStaggerReveal<HTMLDivElement>('[data-reveal-item]', {
    stagger: 0.12,
  });

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative flex min-h-[60vh] items-center px-6 pt-28 md:px-10 lg:px-16">
          <BlueprintGrid variant="hero" />
          <div className="mx-auto flex max-w-[1440px] gap-8 lg:gap-16">
            <VerticalLine className="hidden h-[400px] shrink-0 md:flex" />
            <div ref={headingRef} className="flex flex-col justify-center py-16">
              <h1 className="text-5xl leading-[1.1] md:text-7xl lg:text-8xl">
                PROJECTS
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-fg/70 md:text-lg">
                Explore the technical projects powering our autonomous racing platform.
              </p>
            </div>
          </div>
        </section>

        {/* Project cards */}
        <section className="relative px-6 pb-32 md:px-10 lg:px-16">
          <BlueprintGrid variant="section" />
          <div
            ref={gridRef}
            className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 md:grid-cols-2"
          >
            {projects.map((project) => (
              <article
                key={project.id}
                data-reveal-item
                className="group relative border border-bp-line p-8 transition-all duration-300 hover:border-accent/30 bp-glow-hover"
              >
                <CornerTicks size={10} />
                {/* Placeholder image */}
                <div className="mb-6 aspect-video w-full bg-bp-blue-light" />
                <h2 className="text-2xl md:text-3xl">{project.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-fg/60">
                  {project.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-accent/15 px-3 py-1 text-xs uppercase tracking-wider text-accent/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

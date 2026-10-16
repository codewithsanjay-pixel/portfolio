import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  intro?: string;
  band?: boolean;
  narrow?: boolean;
  children: ReactNode;
};

export function Section({ id, title, intro, band, narrow, children }: Props) {
  const titleId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={titleId} className={`section${band ? " band" : ""}`}>
      <div className={`wrap${narrow ? " narrow" : ""}`}>
        <h2 id={titleId} className="section-title">
          {title}
        </h2>
        {intro ? <p className="section-intro">{intro}</p> : null}
        {children}
      </div>
    </section>
  );
}

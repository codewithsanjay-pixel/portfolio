import { ChatPanel } from "@/components/chat-panel";
import { ProjectCard } from "@/components/project-card";
import { Section } from "@/components/section";
import { SkillsExplorer } from "@/components/skills-explorer";
import { Timeline } from "@/components/timeline";
import { about, chat, eka, focus, links, person, roleProjects, skillGroups, timeline } from "@/content/site";

export default function Home() {
  return (
    <>
      <section className="hero wrap" aria-labelledby="hero-title">
        <div>
          <p className="eyebrow">{person.eyebrow}</p>
          <h1 id="hero-title">{person.headline}</h1>
          <p className="lede">{person.subline}</p>
          <ul className="link-row">
            <li>
              <a className="button button-quiet" href={links.github}>
                GitHub
              </a>
            </li>
            <li>
              <a className="button button-quiet" href={links.linkedin}>
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
        <ChatPanel text={chat} />
      </section>

      <Section id="focus" title="Focus" band>
        <div className="grid-3">
          {focus.map((area, i) => (
            <article key={area.title} className="card">
              <p className="card-num">{String(i + 1).padStart(2, "0")}</p>
              <h3>{area.title}</h3>
              <p className="card-body">{area.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section id="experience" title="Experience">
        <Timeline entries={timeline} />
      </Section>

      <Section id="skills" title="Skills" band>
        <SkillsExplorer groups={skillGroups} />
      </Section>

      <Section id="projects" title="Projects">
        <div className="grid-3">
          <ProjectCard
            title={eka.title}
            meta={eka.label}
            summary={eka.cardSummary}
            tags={eka.stack}
            href={`/projects/${eka.slug}`}
            linkLabel="Read more"
            lead
          />
          {roleProjects.map((p) => (
            <ProjectCard key={p.title} title={p.title} meta={p.meta} summary={p.summary} href={p.href} linkLabel="See role details" />
          ))}
        </div>
      </Section>

      <Section id="about" title="About" narrow>
        {about.map((p) => (
          <p key={p} className="about-text">
            {p}
          </p>
        ))}
      </Section>

      <Section id="contact" title="Contact" band narrow>
        <ul className="contact-list">
          <li>
            <span className="contact-key">Email</span> <a href={`mailto:${links.email}`}>{links.email}</a>
          </li>
          <li>
            <span className="contact-key">LinkedIn</span> <a href={links.linkedin}>linkedin.com/in/sanjay-kandimalla</a>
          </li>
          <li>
            <span className="contact-key">GitHub</span> <a href={links.github}>github.com/codewithsanjay-pixel</a>
          </li>
        </ul>
      </Section>
    </>
  );
}

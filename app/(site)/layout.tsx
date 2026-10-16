import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { footer, nav, person } from "@/content/site";
import { exampleLinkEnabled, withExampleLink } from "@/lib/nav";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  // Server-side only: the local example link appears when SHOW_EXAMPLE=true (ADR 005).
  const links = withExampleLink(nav, exampleLinkEnabled());
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader name={person.name} homeHref="/" links={links} />
      <main id="main">{children}</main>
      <SiteFooter text={footer} />
    </>
  );
}

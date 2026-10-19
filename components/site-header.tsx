import Link from "next/link";
import type { NavLink } from "@/lib/nav";
import { CommandPalette } from "./command-palette";
import { ThemeToggle } from "./theme-toggle";

type Props = {
  name: string;
  homeHref: string;
  links: readonly NavLink[];
};

export function SiteHeader({ name, homeHref, links }: Props) {
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <Link className="site-name" href={homeHref}>
          {name}
        </Link>
        <nav aria-label="Main">
          <ul className="nav-list">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={link.flag ? "nav-flag" : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <CommandPalette />
        <ThemeToggle />
      </div>
    </header>
  );
}

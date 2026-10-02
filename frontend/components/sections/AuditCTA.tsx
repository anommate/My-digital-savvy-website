import type { AuditContent } from "@/types/home";
import { Crimson } from "@/components/ui/rich-text";

export function AuditCTA({ audit }: { audit: AuditContent }) {
  return (
    <section className="wrap" id="audit" aria-labelledby="audit-heading">
      <div className="audit-box reveal">
        <span className="label">{audit.label}</span>
        <h2 id="audit-heading" className="display">
          {audit.heading}
          <Crimson />
        </h2>
        <p className="audit-copy">{audit.copy}</p>
        <a href={audit.cta.href} className="btn solid">
          {audit.cta.label}
        </a>
      </div>
    </section>
  );
}

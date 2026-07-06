import Link from "next/link";
import { listTimeline } from "@/lib/data/repository";

export default function TimelinePage() {
  const expeditions = listTimeline();

  return (
    <section className="panel">
      <h2 className="section-title">Timeline</h2>
      <p className="meta">Secondary browsing mode by year.</p>
      <table className="table space-top">
        <thead>
          <tr>
            <th>Year</th>
            <th>Chapter</th>
            <th>Date Range</th>
            <th>Artifacts</th>
          </tr>
        </thead>
        <tbody>
          {expeditions.map((expedition) => (
            <tr key={expedition.id}>
              <td>{expedition.yearStart}</td>
              <td>
                <Link href={`/chapters/${expedition.id}`}>{expedition.title}</Link>
              </td>
              <td>{expedition.dateLabel}</td>
              <td>{expedition.metrics.totalArtifacts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

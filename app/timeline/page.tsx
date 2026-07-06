import { TimelineLiteral } from "@/components/timeline-literal";
import { getProject } from "@/lib/data/repository";

export default function TimelinePage() {
  const project = getProject();
  return <TimelineLiteral project={project} />;
}

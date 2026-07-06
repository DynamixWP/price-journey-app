import { JourneyMap } from "@/components/journey-map";
import { getProject } from "@/lib/data/repository";

export default function Home() {
  const project = getProject();

  return <JourneyMap project={project} />;
}

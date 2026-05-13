import { getAllFeedback } from "@/lib/data";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  const items = getAllFeedback();
  return <Dashboard items={items} />;
}

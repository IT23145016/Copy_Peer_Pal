import PublicInfoPage from "./PublicInfoPage";

const highlights = [
  {
    title: "Built for students",
    text: "PeerPal focuses on the real pressure points of academic life like deadlines, scheduling, and staying organized.",
  },
  {
    title: "Designed for clarity",
    text: "The goal is a calmer interface where students and admins can find what they need quickly without extra clutter.",
  },
  {
    title: "Made for collaboration",
    text: "From assignment tracking to help desk support, the platform encourages better communication across the whole academic journey.",
  },
];

export default function AboutPage() {
  return (
    <PublicInfoPage
      eyebrow="About Us"
      title="A student platform with real campus context."
      description="PeerPal brings assignments, modules, scheduling, and support into one place so students can focus more on learning and less on chasing scattered information."
      highlights={highlights}
    />
  );
}

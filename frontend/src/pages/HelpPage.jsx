import PublicInfoPage from "./PublicInfoPage";

const highlights = [
  {
    title: "Student support",
    text: "Find guidance for assignments, scheduling, and using the core tools inside PeerPal.",
  },
  {
    title: "Admin help",
    text: "Get quick direction on publishing assignments, managing modules, and keeping the dashboard organized.",
  },
  {
    title: "Need more help?",
    text: "Once you sign in, you can open the in-app help desk for direct support and follow-up.",
  },
];

export default function HelpPage() {
  return (
    <PublicInfoPage
      eyebrow="Help"
      title="Support that feels easy to find."
      description="PeerPal keeps academic support simple, whether you are a student trying to stay on top of deadlines or an admin managing coursework updates."
      highlights={highlights}
    />
  );
}

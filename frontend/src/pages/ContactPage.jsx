import PublicInfoPage from "./PublicInfoPage";

const highlights = [
  {
    title: "General inquiries",
    text: "Reach out for product questions, onboarding help, or guidance on how PeerPal fits your academic workflow.",
  },
  {
    title: "Technical support",
    text: "If something is not working as expected, our support flow helps capture the issue and route it clearly.",
  },
  {
    title: "Campus collaboration",
    text: "We also welcome conversations about improving student coordination, assignment tracking, and peer learning.",
  },
];

export default function ContactPage() {
  return (
    <PublicInfoPage
      eyebrow="Contact Us"
      title="Let’s stay connected."
      description="PeerPal is built to make student life easier, and the support experience should feel just as approachable. Use this page as your starting point for reaching out."
      highlights={highlights}
    />
  );
}

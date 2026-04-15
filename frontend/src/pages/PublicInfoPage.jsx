export default function PublicInfoPage({ eyebrow, title, description, highlights = [] }) {
  return (
    <main className="landing landing-student">
      <section className="student-shell">
        <section className="public-info-hero">
          <div className="public-info-copy">
            <p className="public-info-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </section>

        <section className="public-info-grid">
          {highlights.map((item) => (
            <article className="public-info-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

export default function PageTitle({ title, text }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-5xl font-extrabold tracking-wide">{title}</h1>
      {text && <p className="mt-1 text-muted">{text}</p>}
    </div>
  );
}

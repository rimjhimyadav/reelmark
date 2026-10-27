export default function PageTitle({ title, text }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      {text && <p className="mt-1 text-muted">{text}</p>}
    </div>
  );
}

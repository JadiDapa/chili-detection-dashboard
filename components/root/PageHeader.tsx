export default function PageHeader({
  title,
  subtitle,
  hidden,
}: PageHeaderProps) {
  return (
    <div className={`${hidden ? "hidden" : "block"}`}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold capitalize md:text-4xl">
          {title}
        </h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle: string;
  hidden?: boolean;
}

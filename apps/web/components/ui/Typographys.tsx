interface TypographyH1Props {
  children: React.ReactNode;
  className?: string;
}

interface TypographyPProps {
  children: React.ReactNode;
  className?: string;
}

export function TypographyH1({ children, className = "" }: TypographyH1Props) {
  return (
    <h1
      className={`scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance ${className}`}
    >
      {children}
    </h1>
  );
}

export function TypographyP({ children, className = "" }: TypographyPProps) {
  return <p className={`leading-7 not-first:mt-6 ${className}`}>{children}</p>;
}

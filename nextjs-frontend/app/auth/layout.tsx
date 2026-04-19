export default function AuthRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="!mt-0">
      {children}
    </div>
  );
}

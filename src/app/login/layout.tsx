import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In · Dynamic SaaS HRMS',
  description: 'Enterprise HRMS workspace sign-in portal.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

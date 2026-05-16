// Root redirect — detects browser language and redirects "/" to /en or /es
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function RootPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') ?? '';
  const preferesSpanish = acceptLanguage.toLowerCase().startsWith('es');
  redirect(preferesSpanish ? '/es' : '/en');
}

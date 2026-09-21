// Catch-all so unknown URLs like /en/anything render the branded, translated 404 inside the site layout.
import {notFound} from 'next/navigation';

export default function CatchAll() {
  notFound();
}

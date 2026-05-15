import type {ReactNode} from 'react';

export function SectionHeading({label, title, description}: {label?: string; title: string; description?: ReactNode}) {
  return (
    <header className='mb-8 md:mb-10'>
      {label ? <p className='meta-label'>{label}</p> : null}
      <h2 className='mt-3 font-heading text-4xl leading-tight md:text-5xl'>{title}</h2>
      {description ? <p className='mt-4 max-w-3xl text-muted'>{description}</p> : null}
    </header>
  );
}

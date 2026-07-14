import { icons, HelpCircle, type LucideProps } from 'lucide-react'

/** Renders a Lucide icon by its kebab-case name (as used in the source design). */
export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const pascal = name
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
  const Cmp = (icons as Record<string, React.ComponentType<LucideProps>>)[pascal] ?? HelpCircle
  return <Cmp {...props} />
}

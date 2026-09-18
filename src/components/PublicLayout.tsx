import { ReactNode } from 'react'
import MarketingLayout from '../pages/marketing/MarketingLayout'

/**
 * Public pages (course/path/ebook sales, checkout, legal, catalog, …) share the same
 * marketing header + footer as the rest of the site — this simply delegates to
 * MarketingLayout so there is one consistent chrome across the entire public website.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <MarketingLayout>{children}</MarketingLayout>
}

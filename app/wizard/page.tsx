// app/wizard/page.tsx
import { getTemplate, listRoles, templateNames } from '@/lib/templates';
import type { SiteConfig } from '@/lib/site-schema';
import WizardClient from './WizardClient';
export default function WizardPage() {
  const demoData = Object.fromEntries(
    templateNames.map((role) => [role, getTemplate(role)]),
  ) as Record<string, SiteConfig>;
  return <WizardClient roles={listRoles()} demoData={demoData} />;
}

// app/wizard/page.tsx
import { listRoles } from '@/lib/templates';
import WizardClient from './WizardClient';
export default function WizardPage() {
  return <WizardClient roles={listRoles()} />;
}

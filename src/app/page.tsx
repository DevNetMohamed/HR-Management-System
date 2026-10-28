import { WizardProvider } from '@/context/WizardContext';
import { SetupWizard } from '@/components/wizard/SetupWizard';

export default function Home() {
  return (
    <WizardProvider>
      <SetupWizard />
    </WizardProvider>
  );
}

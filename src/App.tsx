import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { Dashboard } from '@/modules/dashboard/Dashboard';
import { Conversations } from '@/modules/conversations/Conversations';
import { Contacts } from '@/modules/contacts/Contacts';
import { Opportunities } from '@/modules/opportunities/Opportunities';
import { Calendars } from '@/modules/calendars/Calendars';
import { Marketing } from '@/modules/marketing/Marketing';
import { Automations } from '@/modules/automations/Automations';
import { Sites } from '@/modules/sites/Sites';
import { Reputation } from '@/modules/reputation/Reputation';
import { Reporting } from '@/modules/reporting/Reporting';
import { Payments } from '@/modules/payments/Payments';
import { Phone } from '@/modules/phone/Phone';
import { Tasks } from '@/modules/tasks/Tasks';
import { Integrations } from '@/modules/integrations/Integrations';
import { Media } from '@/modules/media/Media';
import { Settings } from '@/modules/settings/Settings';
import { Guides } from '@/modules/guides/Guides';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/calendars" element={<Calendars />} />
          <Route path="/marketing/email" element={<Marketing type="email" />} />
          <Route path="/marketing/sms" element={<Marketing type="sms" />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/reputation" element={<Reputation />} />
          <Route path="/reporting" element={<Reporting />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/phone" element={<Phone />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/media" element={<Media />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/:section" element={<Settings />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import React from 'react';
import { CheckCircle2, ShieldCheck, UserRound } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';

export default function RegistrationStatusPanel({ enabled, role, verificationRequired }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Public Registration</CardTitle>
          <CardDescription>Backend-enforced sign-up availability.</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant={enabled ? 'success' : 'warning'}>{enabled ? 'Enabled' : 'Disabled'}</Badge>
        </CardContent>
      </Card>
      <Card className="border border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><UserRound className="h-4 w-4" aria-hidden="true" />Default Public Role</CardTitle>
          <CardDescription>Self-registration is author-only.</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">{role?.display_name || 'Author'}</Badge>
        </CardContent>
      </Card>
      <Card className="border border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Verification</CardTitle>
          <CardDescription>Hardcoded registration flow behavior.</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant={verificationRequired ? 'success' : 'warning'}>{verificationRequired ? 'Required' : 'Not Required'}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

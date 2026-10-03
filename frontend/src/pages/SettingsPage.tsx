import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, Monitor, LogOut } from 'lucide-react';
import { authApi, userApi } from '../api/domains';
import { session } from '../api/client';
import { queryClient, useAuth } from '../app/providers';
import { useData, useAction } from '../hooks/data';
import {
  Card,
  PageHeader,
  PageState,
  EntityForm,
  Modal,
  Button,
  Badge,
  Pagination,
  Alert,
  dateLabel,
} from '../components/ui';
import type { Input } from '../types';
export default function SettingsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const sessions = useData(['sessions', page], () =>
    authApi.sessions({ offset: page * 12, limit: 12 }),
  );
  const [deactivate, setDeactivate] = useState(false);
  const [revokeAll, setRevokeAll] = useState(false);
  const [error, setError] = useState('');
  const leave = () => {
    session.set(null);
    queryClient.clear();
    navigate('/login', { replace: true });
  };
  const changed = () => {
    toast.success('Account updated. Sign in again to continue.');
    leave();
  };
  const password = useAction(authApi.password, '', changed);
  const email = useAction(userApi.email, '', changed);
  const username = useAction(userApi.username, '', changed);
  const revoke = useAction(authApi.revoke, 'Session revoked.');
  const all = useAction(authApi.revokeAll, 'All sessions revoked.', leave);
  const disable = useAction(() => userApi.deactivate(), 'Account deactivated.', leave);
  return (
    <>
      <PageHeader
        eyebrow="YOUR ACCOUNT. YOUR CONTROL."
        title="Account settings"
        description="Keep your account details up to date and your learning space secure."
      />
      <div className="settings-grid">
        <Card>
          <h2>Account details</h2>
          <p className="muted">Changing account details signs you out for security.</p>
          <h3>Email address</h3>
          <EntityForm<Input<'ChangeEmailRequest'>>
            fields={[
              {
                name: 'new_email',
                label: 'New email address',
                type: 'email',
                required: true,
                max: 255,
              },
              {
                name: 'current_password',
                label: 'Current password',
                type: 'password',
                required: true,
                max: 128,
              },
            ]}
            submit={(data) => email.mutateAsync(data)}
            label="Update email"
          />
          <h3>Username</h3>
          <EntityForm<Input<'ChangeUsernameRequest'>>
            fields={[
              { name: 'new_username', label: 'New username', required: true, min: 3, max: 50 },
              {
                name: 'current_password',
                label: 'Current password',
                type: 'password',
                required: true,
                max: 128,
              },
            ]}
            submit={(data) => username.mutateAsync(data)}
            label="Update username"
          />
        </Card>
        <Card>
          <h2>
            <ShieldCheck size={21} />
            Password & security
          </h2>
          <p className="muted">Choose a unique password with at least 8 characters.</p>
          <EntityForm<Input<'ChangePasswordRequest'>>
            fields={[
              {
                name: 'current_password',
                label: 'Current password',
                type: 'password',
                required: true,
                max: 128,
              },
              {
                name: 'new_password',
                label: 'New password',
                type: 'password',
                required: true,
                min: 8,
                max: 128,
              },
            ]}
            submit={(data) => password.mutateAsync(data)}
            label="Change password"
          />
          <div className="security-note">
            <ShieldCheck size={19} />
            <p>
              Account changes end your existing sessions. You’ll sign in again with your updated
              details.
            </p>
          </div>
          <h3>Sign out of this browser</h3>
          <Button variant="secondary" onClick={() => void auth.logout()}>
            <LogOut size={16} />
            Sign out
          </Button>
        </Card>
      </div>
      <Card>
        <div className="section-heading">
          <div>
            <h2>Sign-in sessions</h2>
            <p>Review and revoke sessions you no longer need.</p>
          </div>
          <Button variant="secondary" onClick={() => setRevokeAll(true)}>
            Revoke all sessions
          </Button>
        </div>
        <PageState query={sessions}>
          {sessions.data?.map((item) => (
            <div className="session-row" key={item.id}>
              <Monitor size={21} />
              <div>
                <strong>Session #{item.id}</strong>
                <p>
                  Signed in {dateLabel(item.created_at)} · Expires {dateLabel(item.expires_at)}
                </p>
              </div>
              <Badge tone={item.is_active ? 'active' : 'cancelled'}>
                {item.is_active ? 'Active' : item.revoked_at ? 'Revoked' : 'Expired'}
              </Badge>
              <Button
                variant="ghost"
                disabled={!item.is_active || revoke.isPending}
                onClick={() => revoke.mutate(item.id, { onError: (e) => toast.error(e.message) })}
              >
                Revoke
              </Button>
            </div>
          ))}
          <Pagination page={page} onChange={setPage} count={sessions.data?.length || 0} />
        </PageState>
      </Card>
      <Card className="danger-zone">
        <div>
          <h2>Deactivate your account</h2>
          <p>This disables access to your account. Your learning data remains stored.</p>
        </div>
        <Button
          variant="danger"
          onClick={() => {
            setError('');
            setDeactivate(true);
          }}
        >
          Deactivate account
        </Button>
      </Card>
      <Modal
        open={deactivate || revokeAll}
        onClose={() => {
          if (!disable.isPending && !all.isPending) {
            setDeactivate(false);
            setRevokeAll(false);
          }
        }}
        title={deactivate ? 'Deactivate your account?' : 'End all your sessions?'}
        description={
          deactivate
            ? `You will lose access to ${auth.user?.email}. This action disables your account.`
            : 'All refresh sessions will be revoked, and this browser will sign out.'
        }
      >
        {error && <Alert>{error}</Alert>}
        <div className="form-actions">
          <Button
            variant="secondary"
            onClick={() => {
              setDeactivate(false);
              setRevokeAll(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={disable.isPending || all.isPending}
            onClick={() => {
              setError('');
              if (deactivate) disable.mutate(undefined, { onError: (e) => setError(e.message) });
              else all.mutate(undefined, { onError: (e) => setError(e.message) });
            }}
          >
            {deactivate ? 'Deactivate account' : 'Revoke all sessions'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

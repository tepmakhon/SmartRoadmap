import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Check } from 'lucide-react';
import { Brand } from '../components/Brand';
import { authApi } from '../api/domains';
import { session } from '../api/client';
import { queryClient, useAuth } from '../app/providers';
import { EntityForm, type FieldConfig } from '../components/ui';
import { useEffect } from 'react';
import type { Input } from '../types';
export default function AuthPage() {
  const location = useLocation();
  const register = location.pathname === '/register';
  const navigate = useNavigate();
  const auth = useAuth();
  useEffect(() => {
    if (auth.user)
      navigate(
        (location.state as { from?: string } | null)?.from?.startsWith('/') &&
          !(location.state as { from?: string } | null)?.from?.startsWith('//')
          ? (location.state as { from: string }).from
          : '/dashboard',
        { replace: true },
      );
  }, [auth.user, navigate, location.state]);
  const fields: FieldConfig[] = [
    { name: 'email', label: 'Email address', type: 'email', required: true, max: 255 },
    ...(register
      ? [
          { name: 'full_name', label: 'Full name', max: 100 },
          { name: 'username', label: 'Username', required: true, max: 50 },
        ]
      : []),
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
      min: register ? 8 : undefined,
      max: 128,
      hint: register ? 'At least 8 characters. Choose a unique password.' : undefined,
    },
    ...(register
      ? [
          {
            name: 'confirm_password',
            label: 'Confirm password',
            type: 'password' as const,
            required: true,
            max: 128,
          },
        ]
      : []),
  ];
  async function submit(data: Input<'UserCreate'> & { confirm_password?: string }) {
    const { email, password, username, full_name } = data;
    if (register) await authApi.register({ email, password, username, full_name });
    const token = await authApi.login({ email, password });
    queryClient.clear();
    session.set(token);
    const intended = location.state as { from?: string } | null;
    navigate(
      intended?.from?.startsWith('/') && !intended.from.startsWith('//')
        ? intended.from
        : '/dashboard',
      { replace: true },
    );
  }
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow light">A little direction. A lot of possibility.</span>
          <h1>
            Your next chapter
            <br />
            starts with a plan.
          </h1>
          <p>
            Connect what you know with where you want to go. One skill, one milestone, one step at a
            time.
          </p>
          <div className="story-path">
            {[
              'Know your starting point',
              'Define your destination',
              'Make progress that matters',
            ].map((text, i) => (
              <div key={text}>
                <span>{i === 0 ? <Check size={16} /> : i + 1}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
        <span className="auth-foot">A clearer path to the work you want to do.</span>
      </aside>
      <main className="auth-main">
        <Link className="back-link" to="/">
          Back to home <ArrowUpRight size={15} />
        </Link>
        <div className="auth-form">
          <span className="eyebrow">YOUR JOURNEY STARTS HERE</span>
          <h1>{register ? 'Make room for what’s next.' : 'Good to have you back.'}</h1>
          <p>
            {register
              ? 'Create your account and build your learning path.'
              : 'Sign in to pick up where you left off.'}
          </p>
          <EntityForm
            key={String(register)}
            fields={fields}
            submit={submit}
            label={register ? 'Create account' : 'Sign in'}
          />
          <p className="auth-switch">
            {register ? 'Already have an account?' : 'New to Smart Roadmap?'}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          <p className="form-note">
            Your learning journey belongs to you. Your account keeps it all in one place.
          </p>
        </div>
      </main>
    </div>
  );
}

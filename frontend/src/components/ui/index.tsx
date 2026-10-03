import * as Dialog from '@radix-ui/react-dialog';
import {
  useId,
  useState,
  useRef,
  type ReactNode,
  type ButtonHTMLAttributes,
  type FormEvent,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  LoaderCircle,
  Plus,
  Search,
  X,
  AlertCircle,
  Route,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
export function Button({
  children,
  loading,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button
      {...props}
      className={`button ${variant} ${props.className || ''}`}
      disabled={props.disabled || loading}
      aria-busy={loading}
    >
      {loading && <LoaderCircle className="spin" size={16} />} {children}
    </button>
  );
}
export function Badge({ children, tone = '' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Alert({ children }: { children: ReactNode }) {
  return (
    <div className="alert" role="alert">
      <AlertCircle size={18} />
      <div>{children}</div>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Route size={24} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function LoadingState() {
  return (
    <div aria-label="Loading content" role="status" className="skeletons">
      <div className="skeleton heading" />
      {[0, 1, 2].map((i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function ErrorState({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <Card>
      <Alert>{error.message}</Alert>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      )}
    </Card>
  );
}
export function PageState({
  query,
  children,
}: {
  query: { isPending: boolean; error: Error | null; refetch: () => unknown };
  children: ReactNode;
}) {
  return query.isPending ? (
    <LoadingState />
  ) : query.error ? (
    <ErrorState error={query.error} retry={() => void query.refetch()} />
  ) : (
    <>{children}</>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="header-actions">{action}</div>}
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal"
          onInteractOutside={(event) => event.preventDefault()}
          onOpenAutoFocus={() => {
            returnFocus.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocus.current?.isConnected) returnFocus.current.focus();
          }}
        >
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>
                {description || 'Update your learning journey.'}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="icon-button" aria-label="Close dialog">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function ConfirmDelete({
  label,
  onDelete,
}: {
  label: string;
  onDelete: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <button
        className="icon-button danger-text"
        aria-label={`Delete ${label}`}
        title={`Delete ${label}`}
        onClick={() => setOpen(true)}
      >
        <Trash2 size={16} />
      </button>
      <Modal
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        title={`Delete ${label}?`}
        description="This action permanently removes this item and its dependent content."
      >
        {error && <Alert>{error}</Alert>}
        <div className="form-actions">
          <Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await onDelete();
                setOpen(false);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Unable to delete this item.');
              } finally {
                setBusy(false);
              }
            }}
          >
            Delete permanently
          </Button>
        </div>
      </Modal>
    </>
  );
}
export function ProgressBar({ value, label = 'Progress' }: { value: number; label?: string }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuenow={bounded}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${bounded}%` }} />
    </div>
  );
}
export function ProgressRing({ value }: { value: number }) {
  return (
    <div
      className="progress-ring"
      style={{
        background: `conic-gradient(var(--green) ${Math.max(0, Math.min(100, value))}%, var(--line) 0)`,
      }}
      role="img"
      aria-label={`${value}% complete`}
    >
      <div>
        <strong>
          {Math.round(value)}
          <small>%</small>
        </strong>
        <span>complete</span>
      </div>
    </div>
  );
}
export function Avatar({ name, url }: { name: string; url?: string | null }) {
  const [failed, setFailed] = useState(false);
  const safe = url && /^https?:\/\//i.test(url);
  return safe && !failed ? (
    <img
      className="avatar"
      alt={`${name}'s avatar`}
      src={url}
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="avatar">
      {name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()}
    </span>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  label = 'Search',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <label className="search">
      <Search size={17} />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
export function Pagination({
  page,
  onChange,
  count,
  size = 12,
}: {
  page: number;
  onChange: (page: number) => void;
  count: number;
  size?: number;
}) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <span>
        Page {page + 1} · {count} {count === 1 ? 'item' : 'items'}
      </span>
      <div>
        <Button variant="secondary" disabled={page === 0} onClick={() => onChange(page - 1)}>
          <ArrowLeft size={15} /> Previous
        </Button>
        <Button variant="secondary" disabled={count < size} onClick={() => onChange(page + 1)}>
          Next <ArrowRight size={15} />
        </Button>
      </div>
    </nav>
  );
}
export function Breadcrumb({ to, label, current }: { to: string; label: string; current: string }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link to={to}>{label}</Link>
      <span>/</span>
      <span aria-current="page">{current}</span>
    </nav>
  );
}
export function ExternalLink({ url, children }: { url: string; children: ReactNode }) {
  if (!/^https?:\/\//i.test(url)) return null;
  return (
    <a className="external-link" href={url} target="_blank" rel="noopener noreferrer">
      {children}
      <ArrowUpRight size={15} />
    </a>
  );
}
export const dateLabel = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
        new Date(
          value.length === 10
            ? value + 'T12:00:00'
            : value.endsWith('Z') || /[+-]\d\d:\d\d$/.test(value)
              ? value
              : value + 'Z',
        ),
      )
    : 'No target date';
export const titleCase = (value: string) =>
  value.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const plus = <Plus size={17} />;
export type FieldConfig = {
  name: string;
  label: string;
  type?:
    'text' | 'email' | 'password' | 'textarea' | 'select' | 'number' | 'date' | 'url' | 'checkbox';
  required?: boolean;
  max?: number;
  min?: number;
  options?: { value: string; label: string }[];
  hint?: string;
  default?: string;
  numeric?: boolean;
};
export const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: titleCase(value) }));
export function EntityForm<T extends object>({
  fields,
  initial,
  submit,
  onCancel,
  label = 'Save changes',
}: {
  fields: FieldConfig[];
  initial?: Partial<T>;
  submit: (data: T) => Promise<unknown>;
  onCancel?: () => void;
  label?: string;
}) {
  const id = useId();
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(
      fields.map((field) => {
        const value = initial ? (initial as Record<string, unknown>)[field.name] : undefined;
        return [
          field.name,
          field.type === 'checkbox' ? !!value : value == null ? field.default || '' : String(value),
        ];
      }),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  async function handle(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    const data: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = values[field.name];
      const value = typeof raw === 'string' ? (field.type === 'password' ? raw : raw.trim()) : raw;
      if (field.required && (value === '' || value == null))
        next[field.name] = `${field.label} is required.`;
      if (
        typeof value === 'string' &&
        field.max &&
        field.type !== 'number' &&
        value.length > field.max
      )
        next[field.name] = `Use ${field.max} characters or fewer.`;
      if (
        field.type !== 'number' &&
        field.min &&
        typeof value === 'string' &&
        value.length < field.min
      )
        next[field.name] = `Use at least ${field.min} characters.`;
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))
        next[field.name] = 'Enter a valid email address.';
      if (field.type === 'url' && value) {
        try {
          const url = new URL(String(value));
          if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
        } catch {
          next[field.name] = 'Use a valid http:// or https:// URL.';
        }
      }
      if (
        field.type === 'number' &&
        value !== '' &&
        (!Number.isInteger(Number(value)) ||
          (field.min !== undefined && Number(value) < field.min) ||
          (field.max !== undefined && Number(value) > field.max))
      )
        next[field.name] =
          `Enter a whole number${field.min !== undefined ? ` from ${field.min}` : ''}${field.max !== undefined ? ` to ${field.max}` : ''}.`;
      if (
        ['username', 'new_username'].includes(field.name) &&
        typeof value === 'string' &&
        value.length < 3
      )
        next[field.name] = 'Use at least 3 characters.';
      if (field.name === 'confirm_password' && value !== values.password)
        next[field.name] = 'Passwords do not match.';
      data[field.name] =
        field.type === 'checkbox'
          ? !!value
          : value === ''
            ? null
            : field.type === 'number' || field.numeric
              ? Number(value)
              : value;
    }
    setErrors(next);
    setMessage('');
    if (Object.keys(next).length) {
      document.getElementById(`${id}-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await submit(data as T);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save changes.');
      if (error instanceof ApiError) setErrors(error.fields);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={handle} noValidate className="entity-form">
      {message && <Alert>{message}</Alert>}
      <fieldset disabled={busy}>
        {fields.map((field) => (
          <div className={`field ${field.type === 'textarea' ? 'wide' : ''}`} key={field.name}>
            <label htmlFor={`${id}-${field.name}`}>
              {field.label}
              {field.required && <span className="required"> *</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={`${id}-${field.name}`}
                rows={4}
                value={String(values[field.name])}
                maxLength={field.max}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                aria-required={field.required || undefined}
                aria-invalid={!!errors[field.name]}
                aria-describedby={`${id}-${field.name}-help`}
              />
            ) : field.type === 'select' ? (
              <select
                id={`${id}-${field.name}`}
                value={String(values[field.name])}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                aria-required={field.required || undefined}
                aria-invalid={!!errors[field.name]}
                aria-describedby={`${id}-${field.name}-help`}
              >
                <option value="">Select {field.label.toLowerCase()}</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <input
                type="checkbox"
                id={`${id}-${field.name}`}
                checked={!!values[field.name]}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.checked })}
              />
            ) : (
              <div className="input-wrap">
                <input
                  id={`${id}-${field.name}`}
                  type={field.type === 'password' && show ? 'text' : field.type || 'text'}
                  value={String(values[field.name])}
                  min={field.type === 'number' ? field.min : undefined}
                  max={field.type === 'number' ? field.max : undefined}
                  maxLength={field.type !== 'number' ? field.max : undefined}
                  autoComplete={
                    field.type === 'password'
                      ? field.name === 'current_password'
                        ? 'current-password'
                        : 'new-password'
                      : field.type === 'email'
                        ? 'email'
                        : undefined
                  }
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  aria-required={field.required || undefined}
                  aria-invalid={!!errors[field.name]}
                  aria-describedby={`${id}-${field.name}-help`}
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShow(!show)}
                    aria-label={show ? 'Hide passwords' : 'Show passwords'}
                  >
                    {show ? 'Hide' : 'Show'}
                  </button>
                )}
              </div>
            )}
            <span
              id={`${id}-${field.name}-help`}
              className={errors[field.name] ? 'field-error' : 'field-hint'}
            >
              {errors[field.name] || field.hint}
            </span>
          </div>
        ))}
      </fieldset>
      <div className="form-actions">
        {onCancel && (
          <Button variant="secondary" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
        <Button loading={busy} type="submit">
          {busy ? 'Saving…' : label}
          <Check size={16} />
        </Button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Target, Pencil, ArrowUpRight, CalendarDays } from 'lucide-react';
import { goalsApi } from '../api/domains';
import { useData, useAction } from '../hooks/data';
import {
  Card,
  PageHeader,
  PageState,
  Badge,
  EmptyState,
  Button,
  Modal,
  EntityForm,
  Pagination,
  ConfirmDelete,
  Breadcrumb,
  plus,
  titleCase,
  dateLabel,
} from '../components/ui';
import { goalFields, statuses } from '../components/ui/fields';
import type { Goal, Input } from '../types';
import { GoalLearning } from './RecommendationsPage';
export default function GoalsPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [editing, setEditing] = useState<Goal | null | undefined>(undefined);
  const goals = useData(['goals', page, status, priority], () =>
    goalsApi.list({ offset: page * 12, limit: 12, status, priority }),
  );
  const save = useAction(
    (data: Input<'GoalCreate'>) =>
      editing ? goalsApi.update(editing.id, data) : goalsApi.create(data),
    'Goal saved.',
    () => setEditing(undefined),
  );
  const remove = useAction(goalsApi.remove, 'Goal deleted.');
  return (
    <>
      <PageHeader
        eyebrow="A DESTINATION WORTH WORKING TOWARD"
        title="Your goals"
        description="Give your learning a direction. Turn what’s next into a plan."
        action={<Button onClick={() => setEditing(null)}>{plus}Create goal</Button>}
      />
      <div className="toolbar">
        <span className="muted">Your next chapter starts here.</span>
        <div>
          <label>
            Status
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All priorities</option>
              {['low', 'medium', 'high'].map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <PageState query={goals}>
        {goals.data?.length ? (
          <div className="cards-grid">
            {goals.data.map((goal) => (
              <Card key={goal.id} className="entity-card">
                <div className="card-top">
                  <span className="item-icon">
                    <Target size={21} />
                  </span>
                  <Badge tone={goal.status}>{titleCase(goal.status)}</Badge>
                </div>
                <Link to={`/goals/${goal.id}`}>
                  <h2>{goal.title}</h2>
                </Link>
                <p>{goal.description || 'A goal with room to grow.'}</p>
                {goal.target_role && <span className="mini-label">{goal.target_role}</span>}
                <div className="card-meta">
                  <CalendarDays size={15} />
                  {dateLabel(goal.target_date)}
                  <Badge tone={goal.priority}>{titleCase(goal.priority)}</Badge>
                </div>
                <div className="card-actions">
                  <Link className="text-link" to={`/goals/${goal.id}`}>
                    Explore goal <ArrowUpRight size={16} />
                  </Link>
                  <div>
                    <button
                      className="icon-button"
                      aria-label={`Edit ${goal.title}`}
                      onClick={() => setEditing(goal)}
                    >
                      <Pencil size={16} />
                    </button>
                    <ConfirmDelete
                      label={goal.title}
                      onDelete={() => remove.mutateAsync(goal.id)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              title={
                status || priority
                  ? 'No goals match these filters'
                  : 'What would you like to work toward?'
              }
              description="Set a career or learning goal, then build a path that makes it possible."
              action={<Button onClick={() => setEditing(null)}>{plus}Create a goal</Button>}
            />
          </Card>
        )}
        <Pagination page={page} onChange={setPage} count={goals.data?.length || 0} />
      </PageState>
      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? 'Edit goal' : 'Create a goal'}
        description="Start with an ambition. We’ll help you find the steps."
      >
        <EntityForm
          key={editing?.id || 'new'}
          fields={goalFields}
          initial={editing || undefined}
          submit={(data) => save.mutateAsync(data)}
          onCancel={() => setEditing(undefined)}
          label={editing ? 'Save goal' : 'Create goal'}
        />
      </Modal>
    </>
  );
}
export function GoalDetail() {
  const id = Number(useParams().id);
  const goal = useData(['goal', id], () => goalsApi.get(id));
  const [edit, setEdit] = useState(false);
  const save = useAction(
    (data: Input<'GoalUpdate'>) => goalsApi.update(id, data),
    'Goal updated.',
    () => setEdit(false),
  );
  return (
    <PageState query={goal}>
      {goal.data && (
        <>
          <Breadcrumb to="/goals" label="Goals" current={goal.data.title} />
          <PageHeader
            eyebrow={goal.data.target_role || 'YOUR DESTINATION'}
            title={goal.data.title}
            description={
              goal.data.description || 'Set your skill targets and build a roadmap for this goal.'
            }
            action={
              <Button variant="secondary" onClick={() => setEdit(true)}>
                <Pencil size={16} />
                Edit goal
              </Button>
            }
          />
          <div className="detail-meta">
            <Badge tone={goal.data.status}>{titleCase(goal.data.status)}</Badge>
            <Badge tone={goal.data.priority}>{titleCase(goal.data.priority)} priority</Badge>
            <span>
              <CalendarDays size={16} />
              {dateLabel(goal.data.target_date)}
            </span>
          </div>
          <GoalLearning goal={goal.data} />
          <Modal open={edit} onClose={() => setEdit(false)} title="Edit goal">
            <EntityForm
              fields={goalFields}
              initial={goal.data}
              submit={(data) => save.mutateAsync(data)}
              onCancel={() => setEdit(false)}
            />
          </Modal>
        </>
      )}
    </PageState>
  );
}

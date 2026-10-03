import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Route,
  Sparkles,
  Pencil,
  ArrowUpRight,
  Check,
  Circle,
  CalendarDays,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  allPages,
  goalsApi,
  roadmapsApi,
  milestonesApi,
  tasksApi,
  topicsApi,
  resourcesApi,
} from '../api/domains';
import { useAction, useData } from '../hooks/data';
import {
  Card,
  PageHeader,
  PageState,
  EmptyState,
  Button,
  Modal,
  EntityForm,
  Pagination,
  ConfirmDelete,
  Badge,
  ProgressBar,
  Breadcrumb,
  ExternalLink,
  plus,
  dateLabel,
  titleCase,
  options,
  type FieldConfig,
} from '../components/ui';
import {
  titleField,
  descriptionField,
  statusField,
  milestoneFields,
  taskFields,
} from '../components/ui/fields';
import type { Input, Milestone, Task, Roadmap } from '../types';
export default function RoadmapsPage() {
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Roadmap | null | undefined>(undefined);
  const roads = useData(['roadmaps', page], () =>
    roadmapsApi.list({ offset: page * 12, limit: 12 }),
  );
  const goals = useData(['goals', 'all'], () => allPages(goalsApi.list));
  const save = useAction(
    (data: Input<'RoadmapCreate'>) =>
      editing ? roadmapsApi.update(editing.id, data) : roadmapsApi.create(data),
    'Roadmap saved.',
    () => setEditing(undefined),
  );
  const remove = useAction(roadmapsApi.remove, 'Roadmap deleted.');
  return (
    <>
      <PageHeader
        eyebrow="MAKE THE JOURNEY MAKE SENSE"
        title="Your roadmaps"
        description="Clear milestones. Practical tasks. A path you can make your own."
        action={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              {plus}Create manually
            </Button>
            <Link className="button primary" to="/recommendations">
              <Sparkles size={17} />
              Generate roadmap
            </Link>
          </>
        }
      />
      <PageState query={roads}>
        {roads.data?.length ? (
          <div className="cards-grid">
            {roads.data.map((roadmap) => (
              <Card className="entity-card" key={roadmap.id}>
                <div className="card-top">
                  <span className="item-icon">
                    <Route size={22} />
                  </span>
                  <Badge tone={roadmap.status}>{titleCase(roadmap.status)}</Badge>
                </div>
                <Link to={`/roadmaps/${roadmap.id}`}>
                  <h2>{roadmap.title}</h2>
                </Link>
                <p>{roadmap.description || 'A path with room for your next chapter.'}</p>
                <RoadmapProgress id={roadmap.id} />
                <div className="card-actions">
                  <Link to={`/roadmaps/${roadmap.id}`} className="text-link">
                    Continue journey <ArrowUpRight size={16} />
                  </Link>
                  <div>
                    <button
                      className="icon-button"
                      aria-label={`Edit ${roadmap.title}`}
                      onClick={() => setEditing(roadmap)}
                    >
                      <Pencil size={16} />
                    </button>
                    <ConfirmDelete
                      label={roadmap.title}
                      onDelete={() => remove.mutateAsync(roadmap.id)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="Let’s map out what’s next"
              description="Generate a personalized roadmap from your goal and skill targets, or create one step by step."
              action={
                <Link className="button primary" to="/recommendations">
                  <Sparkles size={17} />
                  Build your first roadmap
                </Link>
              }
            />
          </Card>
        )}
        <Pagination page={page} onChange={setPage} count={roads.data?.length || 0} />
      </PageState>
      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? 'Edit roadmap' : 'Create a roadmap'}
      >
        <EntityForm<Input<'RoadmapCreate'>>
          fields={[
            titleField,
            descriptionField,
            {
              name: 'goal_id',
              label: 'Related goal',
              type: 'select',
              numeric: true,
              options: goals.data?.map((goal) => ({ value: String(goal.id), label: goal.title })),
            },
            statusField,
          ]}
          initial={editing || undefined}
          submit={(data) => save.mutateAsync(data)}
          onCancel={() => setEditing(undefined)}
          label="Save roadmap"
        />
      </Modal>
    </>
  );
}
function RoadmapProgress({ id }: { id: number }) {
  const progress = useData(['progress', id], () => roadmapsApi.progress(id));
  return progress.error ? (
    <span className="field-error">Progress unavailable</span>
  ) : progress.data ? (
    <div className="roadmap-progress">
      <div>
        <span>
          {progress.data.completed_tasks} of {progress.data.total_tasks} tasks
        </span>
        <strong>{progress.data.percent_complete}%</strong>
      </div>
      <ProgressBar value={progress.data.percent_complete} />
    </div>
  ) : (
    <p className="muted">Loading progress…</p>
  );
}
export function RoadmapDetail() {
  const id = Number(useParams().id);
  const roadmap = useData(['roadmap', id], () => roadmapsApi.get(id));
  const milestones = useData(['milestones', id], () => allPages(milestonesApi(id).list));
  const progress = useData(['progress', id], () => roadmapsApi.progress(id));
  const goal = useData(
    ['goal', roadmap.data?.goal_id],
    () => goalsApi.get(roadmap.data!.goal_id!),
    !!roadmap.data?.goal_id,
  );
  const [editing, setEditing] = useState<Milestone | null | undefined>(undefined);
  const save = useAction(
    (data: Input<'MilestoneCreate'>) =>
      editing ? milestonesApi(id).update(editing.id, data) : milestonesApi(id).create(data),
    'Milestone saved.',
    () => setEditing(undefined),
  );
  const remove = useAction(milestonesApi(id).remove, 'Milestone deleted.');
  return (
    <PageState query={roadmap}>
      {roadmap.data && (
        <>
          <Breadcrumb to="/roadmaps" label="Roadmaps" current={roadmap.data.title} />
          <PageHeader
            eyebrow={goal.data?.target_role || 'ONE STEP AT A TIME'}
            title={roadmap.data.title}
            description={
              roadmap.data.description || 'Follow your milestones and keep moving forward.'
            }
            action={<Button onClick={() => setEditing(null)}>{plus}Add milestone</Button>}
          />
          <Card className="roadmap-overview">
            <div>
              <Badge tone={roadmap.data.status}>{titleCase(roadmap.data.status)}</Badge>
              <h2>Your progress, made visible.</h2>
              {goal.data && (
                <Link className="text-link" to={`/goals/${goal.data.id}`}>
                  Goal: {goal.data.title} <ArrowUpRight size={15} />
                </Link>
              )}
            </div>
            <div>
              <PageState query={progress}>
                {progress.data && (
                  <>
                    <div className="progress-stat">
                      <strong>
                        {progress.data.percent_complete}
                        <small>%</small>
                      </strong>
                      <span>
                        {progress.data.completed_tasks} completed ·{' '}
                        {progress.data.total_tasks - progress.data.completed_tasks} remaining
                      </span>
                    </div>
                    <ProgressBar value={progress.data.percent_complete} />
                  </>
                )}
              </PageState>
            </div>
          </Card>
          <div className="section-heading">
            <div>
              <h2>Your learning path</h2>
              <p>Follow the milestones. Make each step count.</p>
            </div>
            <span className="mini-label">{milestones.data?.length ?? '…'} MILESTONES</span>
          </div>
          <PageState query={milestones}>
            {milestones.data?.length ? (
              <div className="milestone-timeline">
                {milestones.data.map((milestone, index) => (
                  <MilestonePanel
                    key={milestone.id}
                    roadmapId={id}
                    milestone={milestone}
                    index={index}
                    edit={() => setEditing(milestone)}
                    remove={() => remove.mutateAsync(milestone.id)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState
                  title="Create the first milestone"
                  description="Break your roadmap into meaningful stages, then add tasks to each one."
                  action={<Button onClick={() => setEditing(null)}>{plus}Add milestone</Button>}
                />
              </Card>
            )}
          </PageState>
          <Modal
            open={editing !== undefined}
            onClose={() => setEditing(undefined)}
            title={editing ? 'Edit milestone' : 'Add a milestone'}
          >
            <EntityForm<Input<'MilestoneCreate'>>
              fields={milestoneFields.map((field) =>
                field.name === 'position'
                  ? {
                      ...field,
                      default: String(
                        Math.max(-1, ...(milestones.data || []).map((m) => m.position)) + 1,
                      ),
                    }
                  : field,
              )}
              initial={editing || undefined}
              submit={(data) => save.mutateAsync(data)}
              onCancel={() => setEditing(undefined)}
              label="Save milestone"
            />
          </Modal>
        </>
      )}
    </PageState>
  );
}
function useLearningLinks() {
  return useData(['learning-links'], async () => {
    const topics = await allPages(topicsApi.list);
    const groups = await Promise.all(
      topics.map(async (topic) => ({
        topic,
        resources: await allPages(resourcesApi(topic.id).list),
      })),
    );
    return {
      topics,
      resources: groups.flatMap((group) =>
        group.resources.map((resource) => ({ ...resource, topicName: group.topic.name })),
      ),
    };
  });
}
function MilestonePanel({
  roadmapId,
  milestone,
  index,
  edit,
  remove,
}: {
  roadmapId: number;
  milestone: Milestone;
  index: number;
  edit: () => void;
  remove: () => Promise<unknown>;
}) {
  const tasks = useData(['tasks', roadmapId, milestone.id], () =>
    allPages(tasksApi(roadmapId, milestone.id).list),
  );
  const api = tasksApi(roadmapId, milestone.id);
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);
  const learning = useLearningLinks();
  const save = useAction(
    (data: Input<'TaskCreate'>) => (editing ? api.update(editing.id, data) : api.create(data)),
    'Task saved.',
    () => setEditing(undefined),
  );
  const update = useAction(
    ({ id, status }: { id: number; status: Task['status'] }) => api.update(id, { status }),
    'Task updated.',
  );
  const deleteTask = useAction(api.remove, 'Task deleted.');
  const completed = tasks.data?.filter((t) => t.status === 'completed').length || 0;
  const fields: FieldConfig[] = [
    ...taskFields.map((field) =>
      field.name === 'position'
        ? {
            ...field,
            default: String(Math.max(-1, ...(tasks.data || []).map((t) => t.position)) + 1),
          }
        : field,
    ),
    {
      name: 'topic_id',
      label: 'Related topic',
      type: 'select',
      numeric: true,
      options: learning.data?.topics.map((t) => ({ value: String(t.id), label: t.name })),
    },
    {
      name: 'resource_id',
      label: 'Learning resource',
      type: 'select',
      numeric: true,
      options: learning.data?.resources.map((r) => ({
        value: String(r.id),
        label: `${r.topicName}: ${r.title}`,
      })),
      hint: 'If you select both a topic and resource, they must belong together.',
    },
  ];
  return (
    <section className="milestone-panel">
      <div className="timeline-number">{String(index + 1).padStart(2, '0')}</div>
      <details open>
        <summary>
          <div>
            <span className="eyebrow">MILESTONE {index + 1}</span>
            <h3>{milestone.title}</h3>
            <p>{milestone.description}</p>
          </div>
          <div>
            {tasks.data && (
              <Badge
                tone={completed === tasks.data.length && tasks.data.length > 0 ? 'completed' : ''}
              >
                {completed}/{tasks.data.length} complete
              </Badge>
            )}
            <span>{dateLabel(milestone.target_date)}</span>
          </div>
        </summary>
        <div className="milestone-body">
          <div className="milestone-actions">
            <Button variant="ghost" onClick={edit}>
              <Pencil size={14} />
              Edit milestone
            </Button>
            <ConfirmDelete label={milestone.title} onDelete={remove} />
            <Button variant="secondary" onClick={() => setEditing(null)}>
              {plus}Add task
            </Button>
          </div>
          <PageState query={tasks}>
            {tasks.data?.length ? (
              tasks.data.map((task) => (
                <div
                  className={`task-row ${task.status === 'completed' ? 'done' : ''}`}
                  key={task.id}
                >
                  <button
                    className="task-check"
                    aria-label={`${task.status === 'completed' ? 'Reopen' : 'Complete'} task ${task.title}`}
                    aria-pressed={task.status === 'completed'}
                    disabled={update.isPending}
                    onClick={() =>
                      update.mutate(
                        {
                          id: task.id,
                          status: task.status === 'completed' ? 'pending' : 'completed',
                        },
                        { onError: (e) => toast.error(e.message) },
                      )
                    }
                  >
                    {task.status === 'completed' ? <Check size={17} /> : <Circle size={17} />}
                  </button>
                  <div className="task-content">
                    <strong>{task.title}</strong>
                    {task.description && <p>{task.description}</p>}
                    <div className="task-meta">
                      {task.target_date && (
                        <span>
                          <CalendarDays size={13} />
                          {dateLabel(task.target_date)}
                        </span>
                      )}
                      {task.resource_id &&
                        learning.data?.resources.find((r) => r.id === task.resource_id) && (
                          <ExternalLink
                            url={
                              learning.data.resources.find((r) => r.id === task.resource_id)!.url
                            }
                          >
                            <BookOpen size={13} />
                            Learning resource
                          </ExternalLink>
                        )}
                    </div>
                  </div>
                  <label className="task-status">
                    <span className="sr-only">Status for {task.title}</span>
                    <select
                      value={task.status}
                      disabled={update.isPending}
                      onChange={(e) =>
                        update.mutate(
                          { id: task.id, status: e.target.value as Task['status'] },
                          { onError: (error) => toast.error(error.message) },
                        )
                      }
                    >
                      {options(['pending', 'in_progress', 'completed']).map((o) => (
                        <option value={o.value} key={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="icon-button"
                    aria-label={`Edit task ${task.title}`}
                    onClick={() => setEditing(task)}
                  >
                    <Pencil size={15} />
                  </button>
                  <ConfirmDelete
                    label={`task ${task.title}`}
                    onDelete={() => deleteTask.mutateAsync(task.id)}
                  />
                </div>
              ))
            ) : (
              <EmptyState
                title="What’s your next step?"
                description="Add a practical learning task to this milestone."
              />
            )}
          </PageState>
        </div>
      </details>
      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? 'Edit task' : 'Add a learning task'}
      >
        <EntityForm<Input<'TaskCreate'>>
          fields={fields}
          initial={editing || undefined}
          submit={(data) => save.mutateAsync(data)}
          onCancel={() => setEditing(undefined)}
          label="Save task"
        />
      </Modal>
    </section>
  );
}

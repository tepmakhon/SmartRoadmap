import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Plus, Target, Code2, Route } from 'lucide-react';
import { allPages, goalsApi, recommendationsApi, skillsApi } from '../api/domains';
import { useAction, useData } from '../hooks/data';
import { useCatalog, skillField, CatalogNotice } from '../components/SkillPicker';
import {
  Card,
  PageHeader,
  PageState,
  Button,
  Modal,
  EntityForm,
  Badge,
  EmptyState,
  ConfirmDelete,
  titleCase,
  options,
  Alert,
  type FieldConfig,
} from '../components/ui';
import { proficiency } from '../components/ui/fields';
import type { Goal, Input } from '../types';
export function GoalLearning({ goal }: { goal: Goal }) {
  const id = goal.id;
  const catalog = useCatalog();
  const targets = useData(['requirements', id], () =>
    allPages((params) => recommendationsApi.requirements(id, params)),
  );
  const recommendations = useData(['recommendations', id], () => recommendationsApi.list(id));
  const current = useData(['skills', 'generation'], () => allPages(skillsApi.list));
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const add = useAction(
    (data: Input<'GoalSkillCreate'>) => recommendationsApi.add(id, data),
    'Skill target added.',
    () => setAdding(false),
  );
  const remove = useAction(
    (skillId: number) => recommendationsApi.remove(id, skillId),
    'Skill target removed.',
  );
  const generate = useAction(
    () => recommendationsApi.generate(id),
    'Your roadmap is ready.',
    (roadmap) => navigate(`/roadmaps/${roadmap.id}`),
  );
  const fields: FieldConfig[] = [
    skillField(catalog),
    {
      name: 'required_proficiency',
      label: 'Target proficiency',
      type: 'select',
      required: true,
      options: options(proficiency),
      default: 'intermediate',
    },
    {
      name: 'position',
      label: 'Learning order',
      type: 'number',
      required: true,
      min: 0,
      default: String(Math.max(-1, ...(targets.data || []).map((t) => t.position)) + 1),
      hint: 'Lower positions come first. Each target needs a unique position.',
    },
  ];
  return (
    <div className="generation-layout">
      <div>
        <Card>
          <div className="section-heading">
            <div>
              <h2>Define your skill targets</h2>
              <p>What do you need to learn, and in what order?</p>
            </div>
            <Button variant="secondary" onClick={() => setAdding(true)}>
              <Plus size={16} />
              Add target
            </Button>
          </div>
          <PageState query={targets}>
            {targets.data?.length ? (
              <div className="target-list">
                {targets.data.map((target, index) => (
                  <div className="target-row" key={target.id}>
                    <span className="step-number">{index + 1}</span>
                    <div>
                      <strong>
                        {catalog.data?.find((s) => s.id === target.skill_id)?.name ||
                          `Skill ${target.skill_id}`}
                      </strong>
                      <span>
                        Target: {titleCase(target.required_proficiency)} · Position{' '}
                        {target.position}
                      </span>
                    </div>
                    <ConfirmDelete
                      label="skill target"
                      onDelete={() => remove.mutateAsync(target.skill_id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Tell us what you’re working toward"
                description="Add the skills you want to develop. Put foundations first, then build on them."
                action={
                  <Button variant="secondary" onClick={() => setAdding(true)}>
                    <Plus size={16} />
                    Add your first target
                  </Button>
                }
              />
            )}
          </PageState>
        </Card>
        <Card>
          <div className="section-heading">
            <div>
              <h2>Your next learning opportunities</h2>
              <p>Skill gaps based on your current proficiency and latest assessments.</p>
            </div>
            <Sparkles size={20} />
          </div>
          <PageState query={recommendations}>
            {recommendations.data?.length ? (
              recommendations.data.map((item) => (
                <div className="recommendation-row" key={item.skill_id}>
                  <span className="item-icon">
                    <Code2 size={20} />
                  </span>
                  <div>
                    <h3>{item.skill_name}</h3>
                    <p>
                      {item.current_proficiency
                        ? titleCase(item.current_proficiency)
                        : 'Not yet added'}{' '}
                      <ArrowRight size={14} /> {titleCase(item.required_proficiency)}
                    </p>
                    <div className="inline-badges">
                      <Badge tone="active">
                        {item.gap} level{item.gap === 1 ? '' : 's'} to grow
                      </Badge>
                      <Badge>{item.resource_ids.length} linked resources</Badge>
                      <Badge>{item.completed_projects} completed projects</Badge>
                      {item.latest_assessment_score != null && (
                        <Badge>Latest score: {item.latest_assessment_score}/100</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title={
                  targets.data?.length
                    ? 'Your targets are within reach'
                    : 'Recommendations start with your targets'
                }
                description={
                  targets.data?.length
                    ? 'Your recorded proficiency meets these targets. Add a new target to keep growing.'
                    : 'Add skill targets above to see where your next learning opportunities are.'
                }
              />
            )}
          </PageState>
        </Card>
      </div>
      <aside>
        <Card className="generation-card">
          <span className="item-icon">
            <Route size={25} />
          </span>
          <h2>A path that’s yours.</h2>
          <p>
            Turn your goal and skill gaps into a roadmap with milestones, resources, and practice
            tasks.
          </p>
          <ol className="generation-steps">
            <li>
              <span>1</span>Your goal<strong>{goal.title}</strong>
            </li>
            <li>
              <span>2</span>Your starting point
              <strong>{current.data?.length ?? '…'} skills recorded</strong>
            </li>
            <li>
              <span>3</span>Your destination
              <strong>{goal.target_role || 'Your learning goal'}</strong>
            </li>
          </ol>
          {error && <Alert>{error}</Alert>}
          <Button
            disabled={!recommendations.data?.length || goal.status !== 'active'}
            loading={generate.isPending}
            onClick={() => {
              setError('');
              generate.mutate(undefined, { onError: (e) => setError(e.message) });
            }}
          >
            <Sparkles size={17} />
            {generate.isPending ? 'Building your roadmap…' : 'Generate roadmap'}
          </Button>
          <p className="form-note">
            {goal.status !== 'active'
              ? 'Activate this goal before generating a roadmap.'
              : 'Your saved targets determine the learning sequence. Each generation creates a new roadmap.'}
          </p>
        </Card>
        <Link className="text-link" to="/skills">
          Review your current skills <ArrowRight size={16} />
        </Link>
      </aside>
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a skill target"
        description="Choose a skill, your destination level, and where it belongs in the learning sequence."
      >
        <CatalogNotice catalog={catalog} />
        <EntityForm<Input<'GoalSkillCreate'>>
          fields={fields}
          submit={(data) => add.mutateAsync(data)}
          onCancel={() => setAdding(false)}
          label="Add skill target"
        />
      </Modal>
    </div>
  );
}
export default function RecommendationsPage() {
  const goals = useData(['goals', 'all'], () => allPages(goalsApi.list));
  const [id, setId] = useState('');
  const selected = goals.data?.find((g) => String(g.id) === (id || String(goals.data[0]?.id)));
  return (
    <>
      <PageHeader
        eyebrow="YOUR NEXT STEP, WITH PURPOSE"
        title="Find your way forward"
        description="Connect where you are with where you want to go. Build a plan around your goals."
      />
      <PageState query={goals}>
        {goals.data?.length ? (
          <>
            <div className="goal-selector">
              <Target size={20} />
              <label>
                Choose your goal
                <select
                  value={id || String(goals.data[0]?.id)}
                  onChange={(e) => setId(e.target.value)}
                >
                  {goals.data.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {selected && <GoalLearning key={selected.id} goal={selected} />}
          </>
        ) : (
          <Card>
            <EmptyState
              title="Every path starts with a destination"
              description="Create a goal, then define the skills you want to develop. Your roadmap starts there."
              action={
                <Link className="button primary" to="/goals">
                  Create a goal <ArrowRight size={16} />
                </Link>
              }
            />
          </Card>
        )}
      </PageState>
    </>
  );
}

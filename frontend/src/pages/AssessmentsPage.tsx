import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { assessmentsApi } from '../api/domains';
import { useData, useAction } from '../hooks/data';
import { useCatalog, skillField, CatalogNotice } from '../components/SkillPicker';
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
  dateLabel,
  plus,
} from '../components/ui';
import type { Input } from '../types';
export default function AssessmentsPage() {
  const [page, setPage] = useState(0);
  const [skillId, setSkillId] = useState('');
  const [adding, setAdding] = useState(false);
  const catalog = useCatalog();
  const assessments = useData(['assessments', page, skillId], () =>
    assessmentsApi.list({ offset: page * 12, limit: 12, skill_id: skillId }),
  );
  const add = useAction(
    assessmentsApi.create,
    'Assessment recorded. Your recommendations have been updated.',
    () => setAdding(false),
  );
  const remove = useAction(assessmentsApi.remove, 'Assessment removed.');
  return (
    <>
      <PageHeader
        eyebrow="REFLECT. LEARN. KEEP MOVING."
        title="Skill assessments"
        description="Record a self-assessment score to give your learning recommendations more context."
        action={<Button onClick={() => setAdding(true)}>{plus}Record assessment</Button>}
      />
      <div className="assessment-note">
        <ClipboardCheck size={22} />
        <div>
          <strong>A clearer picture of your current level.</strong>
          <p>
            These are self-reported scores, not verified exams. Your latest score helps the roadmap
            engine identify learning opportunities.
          </p>
        </div>
        <Link to="/recommendations" className="text-link">
          View recommendations <ArrowRight size={16} />
        </Link>
      </div>
      <div className="toolbar">
        <label>
          Skill
          <select
            value={skillId}
            onChange={(e) => {
              setSkillId(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All skills</option>
            {catalog.data?.map((skill) => (
              <option value={skill.id} key={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <PageState query={assessments}>
        {assessments.data?.length ? (
          <div className="cards-grid">
            {assessments.data.map((item) => (
              <Card className="assessment-card" key={item.id}>
                <div className="card-top">
                  <Badge>
                    {catalog.data?.find((s) => s.id === item.skill_id)?.name ||
                      `Skill ${item.skill_id}`}
                  </Badge>
                  <ConfirmDelete label="assessment" onDelete={() => remove.mutateAsync(item.id)} />
                </div>
                <div className="assessment-score">
                  <strong>{item.score}</strong>
                  <span>/ 100</span>
                </div>
                <ProgressBar value={item.score} label="Assessment score" />
                <p>{item.notes || 'Self-assessment recorded.'}</p>
                <small className="muted">{dateLabel(item.created_at)}</small>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="Take stock of what you know"
              description="Reflect on a skill and record a score from 0 to 100. Use notes to capture what you want to improve."
              action={
                <Button onClick={() => setAdding(true)}>{plus}Record your first assessment</Button>
              }
            />
          </Card>
        )}
        <Pagination page={page} onChange={setPage} count={assessments.data?.length || 0} />
      </PageState>
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Record a skill assessment"
        description="Reflect on your current proficiency. This score is self-reported."
      >
        <CatalogNotice catalog={catalog} />
        <EntityForm<Input<'AssessmentCreate'>>
          fields={[
            skillField(catalog),
            {
              name: 'score',
              label: 'Score (0–100)',
              type: 'number',
              required: true,
              min: 0,
              max: 100,
            },
            { name: 'notes', label: 'Reflection notes', type: 'textarea', max: 5000 },
          ]}
          submit={(data) => add.mutateAsync(data)}
          onCancel={() => setAdding(false)}
          label="Record assessment"
        />
      </Modal>
    </>
  );
}

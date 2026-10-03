import { useState } from 'react';
import { Code2, Pencil, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { skillsApi, adminApi } from '../api/domains';
import { useData, useAction, useDebounced } from '../hooks/data';
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
  ProgressBar,
  SearchInput,
  options,
  plus,
  titleCase,
} from '../components/ui';
import { proficiency } from '../components/ui/fields';
import type { Skill, Input, Proficiency } from '../types';
export default function SkillsPage() {
  const [page, setPage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [manage, setManage] = useState(false);
  const catalog = useCatalog();
  const skills = useData(['skills', page], () => skillsApi.list({ offset: page * 12, limit: 12 }));
  const admin = useData(['admin-capability'], adminApi.capability);
  const add = useAction(skillsApi.create, 'Skill added.', () => setAdding(false));
  const update = useAction(
    ({ id, level }: { id: number; level: Proficiency }) =>
      skillsApi.update(id, { proficiency: level }),
    'Proficiency updated.',
  );
  const remove = useAction(skillsApi.remove, 'Skill removed.');
  return (
    <>
      <PageHeader
        eyebrow="START WITH WHAT YOU KNOW"
        title="Your skillset"
        description="A clearer picture of where you are. A stronger foundation for where you’re going."
        action={
          <>
            <Link className="button secondary" to="/assessments">
              Record an assessment <ArrowUpRight size={16} />
            </Link>
            <Button onClick={() => setAdding(true)}>{plus}Add skill</Button>
          </>
        }
      />
      <PageState query={skills}>
        {skills.data?.length ? (
          <div className="cards-grid">
            {skills.data.map((item) => (
              <Card key={item.id} className="skill-card">
                <div className="card-top">
                  <span className="item-icon">
                    <Code2 size={22} />
                  </span>
                  <ConfirmDelete
                    label={item.skill.name}
                    onDelete={() => remove.mutateAsync(item.skill.id)}
                  />
                </div>
                <h2>{item.skill.name}</h2>
                <p>{item.skill.category || 'Learning skill'}</p>
                <ProgressBar
                  value={(proficiency.indexOf(item.proficiency) + 1) * 25}
                  label={`${item.skill.name} proficiency`}
                />
                <label className="proficiency-control">
                  Your proficiency
                  <select
                    value={item.proficiency}
                    disabled={update.isPending}
                    onChange={(e) =>
                      update.mutate(
                        { id: item.skill.id, level: e.target.value as Proficiency },
                        { onError: (error) => toast.error(error.message) },
                      )
                    }
                  >
                    {proficiency.map((level) => (
                      <option key={level} value={level}>
                        {titleCase(level)}
                      </option>
                    ))}
                  </select>
                </label>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="You’re starting with more than you think"
              description="Add your current skills and proficiency so your roadmap can build on what you already know."
              action={<Button onClick={() => setAdding(true)}>{plus}Add your first skill</Button>}
            />
          </Card>
        )}
        <Pagination page={page} onChange={setPage} count={skills.data?.length || 0} />
      </PageState>
      {admin.data && (
        <div className="catalog-admin">
          <Button variant="secondary" onClick={() => setManage(!manage)}>
            {manage ? 'Hide catalog' : 'Manage skill catalog'}
          </Button>
          {manage && <CatalogManager />}
        </div>
      )}
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a skill"
        description="Choose a skill from the catalog and tell us your current level."
      >
        <CatalogNotice catalog={catalog} />
        <EntityForm<Input<'UserSkillCreate'>>
          fields={[
            skillField(catalog),
            {
              name: 'proficiency',
              label: 'Proficiency',
              type: 'select',
              required: true,
              options: options(proficiency),
              default: 'beginner',
            },
          ]}
          submit={(data) => add.mutateAsync(data)}
          onCancel={() => setAdding(false)}
          label="Add skill"
        />
      </Modal>
    </>
  );
}
function CatalogManager() {
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Skill | null | undefined>(undefined);
  const catalog = useData(['catalog', debounced, page], () =>
    skillsApi.catalog({ search: debounced, offset: page * 12, limit: 12 }),
  );
  const save = useAction(
    (data: Input<'SkillCreate'>) =>
      editing ? adminApi.catalog.update(editing.id, data) : adminApi.catalog.create(data),
    'Catalog updated.',
    () => setEditing(undefined),
  );
  const remove = useAction(adminApi.catalog.remove, 'Catalog skill deleted.');
  return (
    <Card>
      <div className="section-heading">
        <h2>Shared skill catalog</h2>
        <Button variant="secondary" onClick={() => setEditing(null)}>
          {plus}Create catalog skill
        </Button>
      </div>
      <SearchInput
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        placeholder="Search the catalog"
      />
      <PageState query={catalog}>
        {catalog.data?.map((skill) => (
          <div className="target-row" key={skill.id}>
            <div>
              <strong>{skill.name}</strong>
              <span>{skill.category || 'Uncategorized'}</span>
            </div>
            <button
              className="icon-button"
              aria-label={`Edit catalog skill ${skill.name}`}
              onClick={() => setEditing(skill)}
            >
              <Pencil size={16} />
            </button>
            <ConfirmDelete
              label={`catalog skill ${skill.name}`}
              onDelete={() => remove.mutateAsync(skill.id)}
            />
          </div>
        ))}
        {!catalog.data?.length && (
          <EmptyState
            title="No catalog skills"
            description="Add a shared skill to make it available for learning goals."
          />
        )}
        <Pagination page={page} onChange={setPage} count={catalog.data?.length || 0} />
      </PageState>
      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? 'Edit catalog skill' : 'Create catalog skill'}
      >
        <EntityForm<Input<'SkillCreate'>>
          fields={[
            { name: 'name', label: 'Skill name', required: true, max: 100 },
            { name: 'category', label: 'Category', max: 100 },
            { name: 'description', label: 'Description', type: 'textarea', max: 500 },
          ]}
          initial={editing || undefined}
          submit={(data) => save.mutateAsync(data)}
          onCancel={() => setEditing(undefined)}
        />
      </Modal>
    </Card>
  );
}

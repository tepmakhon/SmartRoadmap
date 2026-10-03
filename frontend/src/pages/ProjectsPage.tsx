import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FolderKanban, Pencil, ArrowUpRight, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { allPages, projectsApi } from '../api/domains';
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
  Badge,
  SearchInput,
  Breadcrumb,
  ExternalLink,
  dateLabel,
  plus,
} from '../components/ui';
import { projectFields } from '../components/ui/fields';
import type { Project, Input } from '../types';
export default function ProjectsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [editing, setEditing] = useState<Project | null | undefined>(undefined);
  const projects = useData(['projects', page, debounced], () =>
    projectsApi.list({ offset: page * 12, limit: 12, search: debounced }),
  );
  const save = useAction(
    (data: Input<'ProjectCreate'>) =>
      editing ? projectsApi.update(editing.id, data) : projectsApi.create(data),
    'Project saved.',
    () => setEditing(undefined),
  );
  const remove = useAction(projectsApi.remove, 'Project deleted.');
  return (
    <>
      <PageHeader
        eyebrow="PUT WHAT YOU LEARN INTO PRACTICE"
        title="Your projects"
        description="Turn new skills into something real. Keep a record of what you’re building."
        action={<Button onClick={() => setEditing(null)}>{plus}Create project</Button>}
      />
      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(0);
          }}
          placeholder="Search your projects"
        />
      </div>
      <PageState query={projects}>
        {projects.data?.length ? (
          <div className="cards-grid">
            {projects.data.map((project) => (
              <Card className="entity-card" key={project.id}>
                <div className="card-top">
                  <span className="item-icon">
                    <FolderKanban size={22} />
                  </span>
                  <Badge tone={project.completed_at ? 'completed' : 'active'}>
                    {project.completed_at ? 'Completed' : 'In progress'}
                  </Badge>
                </div>
                <Link to={`/projects/${project.id}`}>
                  <h2>{project.title}</h2>
                </Link>
                <p>{project.description || 'Build something worth learning from.'}</p>
                <small className="muted">Created {dateLabel(project.created_at)}</small>
                <div className="card-actions">
                  <Link className="text-link" to={`/projects/${project.id}`}>
                    Open project <ArrowUpRight size={15} />
                  </Link>
                  <div>
                    <button
                      className="icon-button"
                      aria-label={`Edit ${project.title}`}
                      onClick={() => setEditing(project)}
                    >
                      <Pencil size={16} />
                    </button>
                    <ConfirmDelete
                      label={project.title}
                      onDelete={() => remove.mutateAsync(project.id)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              title={search ? 'No projects match your search' : 'Make your skills tangible'}
              description="Start a project, connect the skills you’re practicing, and record when you finish."
              action={<Button onClick={() => setEditing(null)}>{plus}Create a project</Button>}
            />
          </Card>
        )}
        <Pagination page={page} onChange={setPage} count={projects.data?.length || 0} />
      </PageState>
      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? 'Edit project' : 'Create a project'}
      >
        <EntityForm<Input<'ProjectCreate'>>
          fields={projectFields}
          initial={editing || undefined}
          submit={(data) => save.mutateAsync(data)}
          onCancel={() => setEditing(undefined)}
          label="Save project"
        />
      </Modal>
    </>
  );
}
export function ProjectDetail() {
  const id = Number(useParams().id);
  const project = useData(['project', id], () => projectsApi.get(id));
  const skills = useData(['project-skills', id], () =>
    allPages((params) => projectsApi.skills(id, params)),
  );
  const catalog = useCatalog();
  const [edit, setEdit] = useState(false);
  const [adding, setAdding] = useState(false);
  const save = useAction(
    (data: Input<'ProjectUpdate'>) => projectsApi.update(id, data),
    'Project updated.',
    () => setEdit(false),
  );
  const add = useAction(
    (data: Input<'ProjectSkillCreate'>) => projectsApi.addSkill(id, data.skill_id),
    'Skill linked.',
    () => setAdding(false),
  );
  const remove = useAction(
    (skillId: number) => projectsApi.removeSkill(id, skillId),
    'Skill unlinked.',
  );
  return (
    <PageState query={project}>
      {project.data && (
        <>
          <Breadcrumb to="/projects" label="Projects" current={project.data.title} />
          <PageHeader
            eyebrow="LEARNING BY BUILDING"
            title={project.data.title}
            description={
              project.data.description || 'A project that puts your skills into practice.'
            }
            action={
              <Button variant="secondary" onClick={() => setEdit(true)}>
                <Pencil size={16} />
                Edit project
              </Button>
            }
          />
          <Card className="project-overview">
            <div>
              <Badge tone={project.data.completed_at ? 'completed' : 'active'}>
                {project.data.completed_at ? 'Completed' : 'In progress'}
              </Badge>
              {project.data.url && (
                <ExternalLink url={project.data.url}>Visit project</ExternalLink>
              )}
            </div>
            <Button
              loading={save.isPending}
              onClick={() =>
                save.mutate(
                  { completed: !project.data!.completed_at },
                  { onError: (e) => toast.error(e.message) },
                )
              }
            >
              <Check size={16} />
              {project.data.completed_at ? 'Reopen project' : 'Mark as completed'}
            </Button>
          </Card>
          <Card>
            <div className="section-heading">
              <div>
                <h2>Skills you’re putting to work</h2>
                <p>Connect the technologies and skills you practice in this project.</p>
              </div>
              <Button variant="secondary" onClick={() => setAdding(true)}>
                <Plus size={16} />
                Associate skill
              </Button>
            </div>
            <PageState query={skills}>
              {skills.data?.length ? (
                skills.data.map((item) => (
                  <div className="target-row" key={item.id}>
                    <span className="item-icon">
                      <FolderKanban size={19} />
                    </span>
                    <div>
                      <strong>{item.skill.name}</strong>
                      <span>{item.skill.category}</span>
                    </div>
                    <ConfirmDelete
                      label={`association with ${item.skill.name}`}
                      onDelete={() => remove.mutateAsync(item.skill.id)}
                    />
                  </div>
                ))
              ) : (
                <EmptyState
                  title="What are you practicing?"
                  description="Link the skills used in this project to make your experience visible."
                />
              )}
            </PageState>
          </Card>
          <Modal open={edit} onClose={() => setEdit(false)} title="Edit project">
            <EntityForm<Input<'ProjectUpdate'>>
              fields={projectFields}
              initial={project.data}
              submit={(data) => save.mutateAsync(data)}
              onCancel={() => setEdit(false)}
            />
          </Modal>
          <Modal open={adding} onClose={() => setAdding(false)} title="Associate a skill">
            <CatalogNotice catalog={catalog} />
            <EntityForm<Input<'ProjectSkillCreate'>>
              fields={[skillField(catalog)]}
              submit={(data) => add.mutateAsync(data)}
              onCancel={() => setAdding(false)}
              label="Associate skill"
            />
          </Modal>
        </>
      )}
    </PageState>
  );
}

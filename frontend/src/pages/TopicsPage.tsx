import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layers, Pencil, ArrowUpRight, BookOpen } from 'lucide-react';
import { allPages, topicsApi, resourcesApi } from '../api/domains';
import { useData, useAction, useDebounced } from '../hooks/data';
import { useCatalog, skillField } from '../components/SkillPicker';
import {
  Card,
  PageHeader,
  PageState,
  EmptyState,
  Modal,
  EntityForm,
  Button,
  Pagination,
  ConfirmDelete,
  SearchInput,
  Breadcrumb,
  ExternalLink,
  Badge,
  plus,
  titleCase,
  dateLabel,
} from '../components/ui';
import { descriptionField, resourceFields } from '../components/ui/fields';
import type { Topic, Resource, Input } from '../types';
export default function TopicsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [editing, setEditing] = useState<Topic | null | undefined>(undefined);
  const catalog = useCatalog();
  const topics = useData(['topics', page, debounced], () =>
    topicsApi.list({ offset: page * 12, limit: 12, search: debounced }),
  );
  const save = useAction(
    (data: Input<'TopicCreate'>) =>
      editing ? topicsApi.update(editing.id, data) : topicsApi.create(data),
    'Topic saved.',
    () => setEditing(undefined),
  );
  const remove = useAction(topicsApi.remove, 'Topic deleted.');
  return (
    <>
      <PageHeader
        eyebrow="MAKE SPACE FOR CURIOSITY"
        title="Your learning topics"
        description="Organize what you want to explore. Connect topics to skills and keep useful resources close."
        action={<Button onClick={() => setEditing(null)}>{plus}Create topic</Button>}
      />
      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(0);
          }}
          placeholder="Search your topics"
        />
        <span className="muted">Your personal learning library</span>
      </div>
      <PageState query={topics}>
        {topics.data?.length ? (
          <div className="cards-grid">
            {topics.data.map((topic) => (
              <Card className="entity-card" key={topic.id}>
                <div className="card-top">
                  <span className="item-icon">
                    <Layers size={22} />
                  </span>
                  {topic.skill_id && (
                    <Badge>
                      {catalog.data?.find((s) => s.id === topic.skill_id)?.name ||
                        `Skill ${topic.skill_id}`}
                    </Badge>
                  )}
                </div>
                <Link to={`/topics/${topic.id}`}>
                  <h2>{topic.name}</h2>
                </Link>
                <p>{topic.description || 'A new corner of your learning journey.'}</p>
                <div className="card-actions">
                  <Link className="text-link" to={`/topics/${topic.id}`}>
                    Explore resources <ArrowUpRight size={15} />
                  </Link>
                  <div>
                    <button
                      className="icon-button"
                      aria-label={`Edit ${topic.name}`}
                      onClick={() => setEditing(topic)}
                    >
                      <Pencil size={16} />
                    </button>
                    <ConfirmDelete
                      label={topic.name}
                      onDelete={() => remove.mutateAsync(topic.id)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              title={search ? 'No topics match your search' : 'Follow your curiosity'}
              description="Create a topic for something you want to learn, then collect useful resources in one place."
              action={<Button onClick={() => setEditing(null)}>{plus}Create a topic</Button>}
            />
          </Card>
        )}
        <Pagination page={page} onChange={setPage} count={topics.data?.length || 0} />
      </PageState>
      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? 'Edit topic' : 'Create a topic'}
      >
        <EntityForm<Input<'TopicCreate'>>
          fields={[
            { name: 'name', label: 'Topic name', required: true, max: 150 },
            descriptionField,
            skillField(catalog, 'skill_id', 'Related skill', false),
          ]}
          initial={editing || undefined}
          submit={(data) => save.mutateAsync(data)}
          onCancel={() => setEditing(undefined)}
          label="Save topic"
        />
      </Modal>
    </>
  );
}
export function TopicDetail() {
  const id = Number(useParams().id);
  const topic = useData(['topic', id], () => topicsApi.get(id));
  return (
    <PageState query={topic}>
      {topic.data && (
        <>
          <Breadcrumb to="/topics" label="Topics" current={topic.data.name} />
          <PageHeader
            eyebrow="YOUR PERSONAL LEARNING LIBRARY"
            title={topic.data.name}
            description={
              topic.data.description || 'Keep useful resources for this topic in one place.'
            }
          />
          <ResourceList topicId={id} />
        </>
      )}
    </PageState>
  );
}
export function ResourceList({ topicId }: { topicId: number }) {
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Resource | null | undefined>(undefined);
  const api = resourcesApi(topicId);
  const resources = useData(['resources', topicId, page], () =>
    api.list({ offset: page * 12, limit: 12 }),
  );
  const save = useAction(
    (data: Input<'ResourceCreate'>) => (editing ? api.update(editing.id, data) : api.create(data)),
    'Resource saved.',
    () => setEditing(undefined),
  );
  const remove = useAction(api.remove, 'Resource removed.');
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Learning resources</h2>
          <p>Good references make the next step easier.</p>
        </div>
        <Button onClick={() => setEditing(null)}>{plus}Add resource</Button>
      </div>
      <PageState query={resources}>
        {resources.data?.length ? (
          <div className="cards-grid">
            {resources.data.map((resource) => (
              <Card className="entity-card" key={resource.id}>
                <div className="card-top">
                  <span className="item-icon">
                    <BookOpen size={22} />
                  </span>
                  <Badge>{titleCase(resource.kind)}</Badge>
                </div>
                <h2>{resource.title}</h2>
                <p>{resource.description || 'A useful reference for your learning journey.'}</p>
                <small className="muted">Added {dateLabel(resource.created_at)}</small>
                <div className="card-actions">
                  <ExternalLink url={resource.url}>Open resource</ExternalLink>
                  <div>
                    <button
                      className="icon-button"
                      aria-label={`Edit ${resource.title}`}
                      onClick={() => setEditing(resource)}
                    >
                      <Pencil size={16} />
                    </button>
                    <ConfirmDelete
                      label={resource.title}
                      onDelete={() => remove.mutateAsync(resource.id)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="Keep the good stuff close"
              description="Save articles, courses, videos, books, and documentation for this topic."
              action={<Button onClick={() => setEditing(null)}>{plus}Add a resource</Button>}
            />
          </Card>
        )}
        <Pagination page={page} onChange={setPage} count={resources.data?.length || 0} />
      </PageState>
      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? 'Edit resource' : 'Add a learning resource'}
      >
        <EntityForm<Input<'ResourceCreate'>>
          fields={resourceFields}
          initial={editing || undefined}
          submit={(data) => save.mutateAsync(data)}
          onCancel={() => setEditing(undefined)}
          label="Save resource"
        />
      </Modal>
    </>
  );
}
export function ResourcesPage() {
  const topics = useData(['topics', 'all'], () => allPages(topicsApi.list));
  const [selected, setSelected] = useState('');
  const id = Number(selected || topics.data?.[0]?.id);
  return (
    <>
      <PageHeader
        eyebrow="GOOD REFERENCES. BETTER LEARNING."
        title="Your resource library"
        description="A home for the articles, courses, and references that help you move forward."
      />
      <PageState query={topics}>
        {topics.data?.length ? (
          <>
            <div className="goal-selector">
              <Layers size={20} />
              <label>
                Browse a topic
                <select
                  value={selected || String(topics.data[0]?.id)}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {topics.data.map((topic) => (
                    <option value={topic.id} key={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ResourceList key={id} topicId={id} />
          </>
        ) : (
          <Card>
            <EmptyState
              title="Start with a topic"
              description="Resources live in your personal learning topics. Create a topic to start collecting them."
              action={
                <Link to="/topics" className="button primary">
                  Create a topic <ArrowUpRight size={16} />
                </Link>
              }
            />
          </Card>
        )}
      </PageState>
    </>
  );
}

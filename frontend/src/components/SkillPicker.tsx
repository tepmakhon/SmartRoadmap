import { allPages, skillsApi } from '../api/domains';
import { useData } from '../hooks/data';
import { Alert, type FieldConfig, titleCase } from './ui';
export function useCatalog() {
  return useData(['catalog', 'all'], () => allPages(skillsApi.catalog));
}
export function skillField(
  catalog: ReturnType<typeof useCatalog>,
  name = 'skill_id',
  label = 'Skill',
  required = true,
): FieldConfig {
  return {
    name,
    label,
    type: 'select',
    required,
    numeric: true,
    options: catalog.data?.map((skill) => ({ value: String(skill.id), label: skill.name })),
  };
}
export function CatalogNotice({ catalog }: { catalog: ReturnType<typeof useCatalog> }) {
  return catalog.error ? (
    <Alert>{catalog.error.message}</Alert>
  ) : catalog.isPending ? (
    <p className="muted">Loading available skills…</p>
  ) : !catalog.data?.length ? (
    <Alert>
      The skill catalog is empty. A workspace administrator needs to add skills before you can
      select one.
    </Alert>
  ) : null;
}
export const proficiencyLabel = titleCase;

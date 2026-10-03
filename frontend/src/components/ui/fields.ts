import type { FieldConfig } from './index';
import { options } from './index';
export const proficiency = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export const statuses = ['active', 'completed', 'paused', 'cancelled'] as const;
export const titleField: FieldConfig = { name: 'title', label: 'Title', required: true, max: 200 };
export const descriptionField: FieldConfig = {
  name: 'description',
  label: 'Description',
  type: 'textarea',
  max: 5000,
};
export const dateField: FieldConfig = { name: 'target_date', label: 'Target date', type: 'date' };
export const statusField: FieldConfig = {
  name: 'status',
  label: 'Status',
  type: 'select',
  required: true,
  options: options(statuses),
  default: 'active',
};
export const goalFields: FieldConfig[] = [
  titleField,
  { name: 'target_role', label: 'Target role', max: 150 },
  descriptionField,
  dateField,
  statusField,
  {
    name: 'priority',
    label: 'Priority',
    type: 'select',
    required: true,
    options: options(['low', 'medium', 'high']),
    default: 'medium',
  },
];
export const milestoneFields: FieldConfig[] = [
  titleField,
  descriptionField,
  {
    name: 'position',
    label: 'Position',
    type: 'number',
    required: true,
    min: 0,
    default: '0',
    hint: 'Use a unique position within this roadmap.',
  },
  dateField,
];
export const taskFields: FieldConfig[] = [
  ...milestoneFields,
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: options(['pending', 'in_progress', 'completed']),
    default: 'pending',
  },
];
export const projectFields: FieldConfig[] = [
  titleField,
  descriptionField,
  { name: 'url', label: 'Project link', type: 'url', max: 2000 },
];
export const resourceFields: FieldConfig[] = [
  titleField,
  { name: 'url', label: 'Resource URL', type: 'url', required: true, max: 2000 },
  {
    name: 'kind',
    label: 'Format',
    type: 'select',
    required: true,
    options: options(['article', 'video', 'course', 'book', 'documentation']),
    default: 'article',
  },
  descriptionField,
];

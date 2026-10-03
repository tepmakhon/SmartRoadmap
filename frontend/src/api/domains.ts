import { request, queryString } from './client';
import type { Tokens } from './client';
import type {
  User,
  Profile,
  Skill,
  UserSkill,
  Goal,
  Topic,
  Resource,
  Roadmap,
  Milestone,
  Task,
  Project,
  Assessment,
  Requirement,
  Recommendation,
  Progress,
  Analytics,
  Notification,
  Session,
  Input,
} from '../types';
export type Params = Record<string, string | number | undefined>;
const me = '/users/me';
function collection<T, Create, Update = Partial<Create>>(path: string) {
  return {
    list: (params: Params = {}) => request<T[]>(path + queryString(params)),
    get: (id: number) => request<T>(`${path}/${id}`),
    create: (data: Create) => request<T>(path, 'POST', data),
    update: (id: number, data: Update) => request<T>(`${path}/${id}`, 'PATCH', data),
    remove: (id: number) => request<void>(`${path}/${id}`, 'DELETE'),
  };
}
export const authApi = {
  login: (data: Input<'UserLogin'>) => request<Tokens>('/auth/login', 'POST', data, false),
  register: (data: Input<'UserCreate'>) => request<User>('/auth/register', 'POST', data, false),
  logout: (refresh_token: string) =>
    request<{ message: string }>('/auth/logout', 'POST', { refresh_token }, false),
  password: (data: Input<'ChangePasswordRequest'>) =>
    request<{ message: string }>('/auth/change-password', 'POST', data),
  sessions: (params: Params = {}) => request<Session[]>('/auth/sessions' + queryString(params)),
  revoke: (id: number) => request('/auth/sessions/' + id, 'DELETE'),
  revokeAll: () => request('/auth/sessions/revoke-all', 'POST'),
};
export const userApi = {
  me: () => request<User>(me),
  profile: () => request<Profile>(me + '/profile'),
  updateProfile: (data: Input<'UserProfileUpdate'>) =>
    request<Profile>(me + '/profile', 'PUT', data),
  email: (data: Input<'ChangeEmailRequest'>) => request(me + '/change-email', 'POST', data),
  username: (data: Input<'ChangeUsernameRequest'>) =>
    request(me + '/change-username', 'POST', data),
  deactivate: () => request(me, 'DELETE'),
  analytics: () => request<Analytics>(me + '/analytics'),
};
export const skillsApi = {
  catalog: (params: Params = {}) =>
    request<Skill[]>('/skills' + queryString(params), 'GET', undefined, false),
  list: (params: Params = {}) => request<UserSkill[]>(me + '/skills' + queryString(params)),
  create: (data: Input<'UserSkillCreate'>) => request<UserSkill>(me + '/skills', 'POST', data),
  update: (skillId: number, data: Input<'UserSkillUpdate'>) =>
    request<UserSkill>(`${me}/skills/${skillId}`, 'PATCH', data),
  remove: (skillId: number) => request<void>(`${me}/skills/${skillId}`, 'DELETE'),
};
export const goalsApi = collection<Goal, Input<'GoalCreate'>, Input<'GoalUpdate'>>(me + '/goals');
export const topicsApi = collection<Topic, Input<'TopicCreate'>, Input<'TopicUpdate'>>(
  me + '/topics',
);
export const resourcesApi = (topicId: number) =>
  collection<Resource, Input<'ResourceCreate'>, Input<'ResourceUpdate'>>(
    `${me}/topics/${topicId}/resources`,
  );
export const roadmapsApi = {
  ...collection<Roadmap, Input<'RoadmapCreate'>, Input<'RoadmapUpdate'>>(me + '/roadmaps'),
  progress: (id: number) => request<Progress>(`${me}/roadmaps/${id}/progress`),
};
export const milestonesApi = (roadmapId: number) =>
  collection<Milestone, Input<'MilestoneCreate'>, Input<'MilestoneUpdate'>>(
    `${me}/roadmaps/${roadmapId}/milestones`,
  );
export const tasksApi = (roadmapId: number, milestoneId: number) =>
  collection<Task, Input<'TaskCreate'>, Input<'TaskUpdate'>>(
    `${me}/roadmaps/${roadmapId}/milestones/${milestoneId}/tasks`,
  );
export const projectsApi = {
  ...collection<Project, Input<'ProjectCreate'>, Input<'ProjectUpdate'>>(me + '/projects'),
  skills: (id: number, params: Params = {}) =>
    request<Input<'ProjectSkillResponse'>[]>(`${me}/projects/${id}/skills` + queryString(params)),
  addSkill: (id: number, skill_id: number) =>
    request(`${me}/projects/${id}/skills`, 'POST', { skill_id }),
  removeSkill: (id: number, skillId: number) =>
    request(`${me}/projects/${id}/skills/${skillId}`, 'DELETE'),
};
export const assessmentsApi = {
  list: (params: Params = {}) => request<Assessment[]>(me + '/assessments' + queryString(params)),
  get: (id: number) => request<Assessment>(`${me}/assessments/${id}`),
  create: (data: Input<'AssessmentCreate'>) =>
    request<Assessment>(me + '/assessments', 'POST', data),
  remove: (id: number) => request<void>(`${me}/assessments/${id}`, 'DELETE'),
};
export const recommendationsApi = {
  requirements: (id: number, params: Params = {}) =>
    request<Requirement[]>(`${me}/goals/${id}/skills` + queryString(params)),
  add: (id: number, data: Input<'GoalSkillCreate'>) =>
    request<Requirement>(`${me}/goals/${id}/skills`, 'POST', data),
  remove: (id: number, skillId: number) => request(`${me}/goals/${id}/skills/${skillId}`, 'DELETE'),
  list: (id: number) => request<Recommendation[]>(`${me}/goals/${id}/recommendations`),
  generate: (id: number) => request<Roadmap>(`${me}/goals/${id}/generate-roadmap`, 'POST'),
};
export const notificationsApi = {
  list: (params: Params = {}) =>
    request<Notification[]>(me + '/notifications' + queryString(params)),
  read: (id: number) => request<Notification>(`${me}/notifications/${id}/read`, 'PATCH'),
};
export const adminApi = {
  capability: async () => {
    try {
      await request('/admin/metrics');
      return true;
    } catch {
      return false;
    }
  },
  catalog: collection<Skill, Input<'SkillCreate'>>('/skills'),
};
export async function allPages<T>(list: (params: Params) => Promise<T[]>): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await list({ offset, limit: 100 });
    result.push(...page);
    if (page.length < 100) return result;
  }
}

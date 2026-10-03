# Frontend implementation matrix

Source: `frontend/openapi.json`, exported from the actual `backend/app/main.py` application before UI implementation. Exact paths, methods, and schema names below come from that contract.

| Domain | Backend endpoint | HTTP method | Request | Response | Frontend page | Frontend component | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | /api/v1/auth/register | POST | UserCreate | 201 UserResponse | /login, /register, /settings | AuthPage, SettingsPage, API client | Implemented |
| Auth | /api/v1/auth/login | POST | UserLogin | 200 Token | /login, /register, /settings | AuthPage, SettingsPage, API client | Implemented |
| Auth | /api/v1/auth/refresh | POST | RefreshTokenRequest | 200 Token | /login, /register, /settings | AuthPage, SettingsPage, API client | Implemented |
| Auth | /api/v1/auth/logout | POST | LogoutRequest | 200 JSON (schema not declared) | /login, /register, /settings | AuthPage, SettingsPage, API client | Implemented |
| Auth | /api/v1/auth/sessions | GET | offset, limit | 200 SessionResponse[] | /login, /register, /settings | AuthPage, SettingsPage, API client | Implemented |
| Auth | /api/v1/auth/sessions/{session_id} | DELETE | None | 200 JSON (schema not declared) | /login, /register, /settings | AuthPage, SettingsPage, API client | Implemented |
| Auth | /api/v1/auth/sessions/revoke-all | POST | None | 200 JSON (schema not declared) | /login, /register, /settings | AuthPage, SettingsPage, API client | Implemented |
| Auth | /api/v1/auth/change-password | POST | ChangePasswordRequest | 200 JSON (schema not declared) | /login, /register, /settings | AuthPage, SettingsPage, API client | Implemented |
| Users | /api/v1/users/me | GET | None | 200 UserResponse | /settings | SettingsPage, AuthProvider | Implemented |
| Users | /api/v1/users/me | DELETE | None | 200 JSON (schema not declared) | /settings | SettingsPage, AuthProvider | Implemented |
| Users | /api/v1/users/me/change-email | POST | ChangeEmailRequest | 200 JSON (schema not declared) | /settings | SettingsPage, AuthProvider | Implemented |
| Users | /api/v1/users/me/change-username | POST | ChangeUsernameRequest | 200 JSON (schema not declared) | /settings | SettingsPage, AuthProvider | Implemented |
| Profile | /api/v1/users/me/profile | GET | None | 200 UserProfileResponse | /profile | ProfilePage | Implemented |
| Profile | /api/v1/users/me/profile | PUT | UserProfileUpdate | 200 UserProfileResponse | /profile | ProfilePage | Implemented |
| Skills | /api/v1/skills | GET | offset, limit, search | 200 SkillResponse[] | /skills | SkillsPage, SkillPicker | Implemented |
| Skills | /api/v1/skills | POST | SkillCreate | 201 SkillResponse | /skills | SkillsPage, SkillPicker | Implemented |
| Skills | /api/v1/skills/{skill_id} | GET | None | 200 SkillResponse | /skills | SkillsPage, SkillPicker | Typed client; UI uses collection response |
| Skills | /api/v1/skills/{skill_id} | PATCH | SkillCreate | 200 SkillResponse | /skills | SkillsPage, SkillPicker | Implemented |
| Skills | /api/v1/skills/{skill_id} | DELETE | None | 204 No body | /skills | SkillsPage, SkillPicker | Implemented |
| Skills | /api/v1/users/me/skills | GET | offset, limit | 200 UserSkillResponse[] | /skills | SkillsPage, SkillPicker | Implemented |
| Skills | /api/v1/users/me/skills | POST | UserSkillCreate | 201 UserSkillResponse | /skills | SkillsPage, SkillPicker | Implemented |
| Skills | /api/v1/users/me/skills/{skill_id} | PATCH | UserSkillUpdate | 200 UserSkillResponse | /skills | SkillsPage, SkillPicker | Implemented |
| Skills | /api/v1/users/me/skills/{skill_id} | DELETE | None | 204 No body | /skills | SkillsPage, SkillPicker | Implemented |
| Goals | /api/v1/users/me/goals | POST | GoalCreate | 201 GoalResponse | /goals, /goals/:id | GoalsPage, GoalDetail | Implemented |
| Goals | /api/v1/users/me/goals | GET | offset, limit, status, priority | 200 GoalResponse[] | /goals, /goals/:id | GoalsPage, GoalDetail | Implemented |
| Goals | /api/v1/users/me/goals/{goal_id} | GET | None | 200 GoalResponse | /goals, /goals/:id | GoalsPage, GoalDetail | Implemented |
| Goals | /api/v1/users/me/goals/{goal_id} | PATCH | GoalUpdate | 200 GoalResponse | /goals, /goals/:id | GoalsPage, GoalDetail | Implemented |
| Goals | /api/v1/users/me/goals/{goal_id} | DELETE | None | 204 No body | /goals, /goals/:id | GoalsPage, GoalDetail | Implemented |
| Topics | /api/v1/users/me/topics | POST | TopicCreate | 201 TopicResponse | /topics, /topics/:id | TopicsPage, TopicDetail | Implemented |
| Topics | /api/v1/users/me/topics | GET | offset, limit, search | 200 TopicResponse[] | /topics, /topics/:id | TopicsPage, TopicDetail | Implemented |
| Topics | /api/v1/users/me/topics/{topic_id} | GET | None | 200 TopicResponse | /topics, /topics/:id | TopicsPage, TopicDetail | Implemented |
| Topics | /api/v1/users/me/topics/{topic_id} | PATCH | TopicUpdate | 200 TopicResponse | /topics, /topics/:id | TopicsPage, TopicDetail | Implemented |
| Topics | /api/v1/users/me/topics/{topic_id} | DELETE | None | 204 No body | /topics, /topics/:id | TopicsPage, TopicDetail | Implemented |
| Learning Resources | /api/v1/users/me/topics/{topic_id}/resources | POST | ResourceCreate | 201 ResourceResponse | /resources, /topics/:id | ResourcesPage, ResourceList | Implemented |
| Learning Resources | /api/v1/users/me/topics/{topic_id}/resources | GET | offset, limit | 200 ResourceResponse[] | /resources, /topics/:id | ResourcesPage, ResourceList | Implemented |
| Learning Resources | /api/v1/users/me/topics/{topic_id}/resources/{resource_id} | GET | None | 200 ResourceResponse | /resources, /topics/:id | ResourcesPage, ResourceList | Typed client; UI uses collection response |
| Learning Resources | /api/v1/users/me/topics/{topic_id}/resources/{resource_id} | PATCH | ResourceUpdate | 200 ResourceResponse | /resources, /topics/:id | ResourcesPage, ResourceList | Implemented |
| Learning Resources | /api/v1/users/me/topics/{topic_id}/resources/{resource_id} | DELETE | None | 204 No body | /resources, /topics/:id | ResourcesPage, ResourceList | Implemented |
| Roadmaps | /api/v1/users/me/roadmaps | POST | RoadmapCreate | 201 RoadmapResponse | /roadmaps, /roadmaps/:id | RoadmapsPage, RoadmapDetail | Implemented |
| Roadmaps | /api/v1/users/me/roadmaps | GET | offset, limit | 200 RoadmapResponse[] | /roadmaps, /roadmaps/:id | RoadmapsPage, RoadmapDetail | Implemented |
| Roadmaps | /api/v1/users/me/roadmaps/{roadmap_id} | GET | None | 200 RoadmapResponse | /roadmaps, /roadmaps/:id | RoadmapsPage, RoadmapDetail | Implemented |
| Roadmaps | /api/v1/users/me/roadmaps/{roadmap_id} | PATCH | RoadmapUpdate | 200 RoadmapResponse | /roadmaps, /roadmaps/:id | RoadmapsPage, RoadmapDetail | Implemented |
| Roadmaps | /api/v1/users/me/roadmaps/{roadmap_id} | DELETE | None | 204 No body | /roadmaps, /roadmaps/:id | RoadmapsPage, RoadmapDetail | Implemented |
| Milestones | /api/v1/users/me/roadmaps/{roadmap_id}/milestones | POST | MilestoneCreate | 201 MilestoneResponse | /roadmaps/:id | MilestonePanel | Implemented |
| Milestones | /api/v1/users/me/roadmaps/{roadmap_id}/milestones | GET | offset, limit | 200 MilestoneResponse[] | /roadmaps/:id | MilestonePanel | Implemented |
| Milestones | /api/v1/users/me/roadmaps/{roadmap_id}/milestones/{milestone_id} | GET | None | 200 MilestoneResponse | /roadmaps/:id | MilestonePanel | Typed client; UI uses collection response |
| Milestones | /api/v1/users/me/roadmaps/{roadmap_id}/milestones/{milestone_id} | PATCH | MilestoneUpdate | 200 MilestoneResponse | /roadmaps/:id | MilestonePanel | Implemented |
| Milestones | /api/v1/users/me/roadmaps/{roadmap_id}/milestones/{milestone_id} | DELETE | None | 204 No body | /roadmaps/:id | MilestonePanel | Implemented |
| Tasks | /api/v1/users/me/roadmaps/{roadmap_id}/milestones/{milestone_id}/tasks | POST | TaskCreate | 201 TaskResponse | /roadmaps/:id | MilestonePanel, EntityForm | Implemented |
| Tasks | /api/v1/users/me/roadmaps/{roadmap_id}/milestones/{milestone_id}/tasks | GET | offset, limit | 200 TaskResponse[] | /roadmaps/:id | MilestonePanel, EntityForm | Implemented |
| Tasks | /api/v1/users/me/roadmaps/{roadmap_id}/milestones/{milestone_id}/tasks/{task_id} | GET | None | 200 TaskResponse | /roadmaps/:id | MilestonePanel, EntityForm | Typed client; UI uses collection response |
| Tasks | /api/v1/users/me/roadmaps/{roadmap_id}/milestones/{milestone_id}/tasks/{task_id} | PATCH | TaskUpdate | 200 TaskResponse | /roadmaps/:id | MilestonePanel, EntityForm | Implemented |
| Tasks | /api/v1/users/me/roadmaps/{roadmap_id}/milestones/{milestone_id}/tasks/{task_id} | DELETE | None | 204 No body | /roadmaps/:id | MilestonePanel, EntityForm | Implemented |
| Progress | /api/v1/users/me/roadmaps/{roadmap_id}/progress | GET | None | 200 ProgressResponse | /roadmaps/:id, /dashboard | ProgressBar, ProgressRing | Implemented |
| Projects | /api/v1/users/me/projects | POST | ProjectCreate | 201 ProjectResponse | /projects, /projects/:id | ProjectsPage, ProjectDetail | Implemented |
| Projects | /api/v1/users/me/projects | GET | offset, limit, search | 200 ProjectResponse[] | /projects, /projects/:id | ProjectsPage, ProjectDetail | Implemented |
| Projects | /api/v1/users/me/projects/{project_id} | GET | None | 200 ProjectResponse | /projects, /projects/:id | ProjectsPage, ProjectDetail | Implemented |
| Projects | /api/v1/users/me/projects/{project_id} | PATCH | ProjectUpdate | 200 ProjectResponse | /projects, /projects/:id | ProjectsPage, ProjectDetail | Implemented |
| Projects | /api/v1/users/me/projects/{project_id} | DELETE | None | 204 No body | /projects, /projects/:id | ProjectsPage, ProjectDetail | Implemented |
| Projects | /api/v1/users/me/projects/{project_id}/skills | POST | ProjectSkillCreate | 201 ProjectSkillResponse | /projects, /projects/:id | ProjectsPage, ProjectDetail | Implemented |
| Projects | /api/v1/users/me/projects/{project_id}/skills | GET | offset, limit | 200 ProjectSkillResponse[] | /projects, /projects/:id | ProjectsPage, ProjectDetail | Implemented |
| Projects | /api/v1/users/me/projects/{project_id}/skills/{skill_id} | DELETE | None | 204 No body | /projects, /projects/:id | ProjectsPage, ProjectDetail | Implemented |
| Assessments | /api/v1/users/me/assessments | POST | AssessmentCreate | 201 AssessmentResponse | /assessments | AssessmentsPage | Implemented |
| Assessments | /api/v1/users/me/assessments | GET | offset, limit, skill_id | 200 AssessmentResponse[] | /assessments | AssessmentsPage | Implemented |
| Assessments | /api/v1/users/me/assessments/{assessment_id} | GET | None | 200 AssessmentResponse | /assessments | AssessmentsPage | Typed client; UI uses collection response |
| Assessments | /api/v1/users/me/assessments/{assessment_id} | DELETE | None | 204 No body | /assessments | AssessmentsPage | Implemented |
| Recommendations | /api/v1/users/me/goals/{goal_id}/skills | POST | GoalSkillCreate | 201 GoalSkillResponse | /recommendations, /goals/:id | RecommendationsPage, GoalLearning | Implemented |
| Recommendations | /api/v1/users/me/goals/{goal_id}/skills | GET | offset, limit | 200 GoalSkillResponse[] | /recommendations, /goals/:id | RecommendationsPage, GoalLearning | Implemented |
| Recommendations | /api/v1/users/me/goals/{goal_id}/skills/{skill_id} | DELETE | None | 204 No body | /recommendations, /goals/:id | RecommendationsPage, GoalLearning | Implemented |
| Recommendations | /api/v1/users/me/goals/{goal_id}/recommendations | GET | None | 200 RecommendationResponse[] | /recommendations, /goals/:id | RecommendationsPage, GoalLearning | Implemented |
| Roadmap Generation | /api/v1/users/me/goals/{goal_id}/generate-roadmap | POST | None | 201 RoadmapResponse | /recommendations, /goals/:id | GoalLearning | Implemented |

## Contract boundaries

- Password-reset, email-verification, avatar-upload, and examination/question-bank endpoints are absent; no corresponding calls were invented.
- Assessments support skill ID, score (0–100), and notes. There are no question/answer or examination endpoints.
- Resources are nested under a personal topic; there is no global resource list/search/category endpoint. The resources page selects a topic and paginate that topic's real resource collection.
- Topics are personal collections, not a public discovery catalog. There is no topic-category field.
- Skills are public to read and administrator-only to create/update/delete. User skills use nested `skill` responses; updates/removal use the underlying skill ID, not the association ID.
- Goal requirements are ordered skill targets; they support create/list/delete, not PATCH. Targets can be removed and re-added at a different unique position.
- Generation accepts no request body: goal, skill targets, and optional supporting data must be saved beforehand.
- The user's administrator flag is not in UserResponse; optional catalog management checks the real admin metrics authorization endpoint.
- Goal progress is not directly available. Roadmap progress comes from `/roadmaps/{roadmap_id}/progress`.
- Dashboard aggregates use `/api/v1/users/me/analytics`; notifications use `/api/v1/users/me/notifications` and PATCH `/{notification_id}/read`. These additional real endpoints are outside the requested domain list.
- Endpoints with undeclared response schemas are marked as such; frontend messages follow the actual router implementation.
- Backend authentication returns token JSON rather than cookies. The frontend uses tab-scoped session storage, a single-flight refresh request, and cache clearing on sign-out.

## Implementation and validation

The frontend was built after this matrix was exported. `Implemented` means the actual operation is connected to a user-facing flow; the explicitly marked detail-read operations have typed clients while their forms use objects from the corresponding list response. Production pages contain no mock data. Shared `EntityForm`, `ConfirmDelete`, `PageState`, and `Pagination` components supply validation, errors, confirmation, and real offset/limit pagination.

Validation covers TypeScript, ESLint, production builds, isolated authentication/form tests, and real-backend Playwright journeys. The browser suite covers every requested domain through persisted data, generation and progress, plus account/session security, administrator catalog CRUD, mobile/tablet layouts, dialog keyboard focus, and automated WCAG checks. `.github/workflows/frontend.yml` runs the journeys against the production Nginx container. See `frontend/README.md` for commands and test-account cleanup behavior.

Additional operational endpoint `/api/v1/admin/users` exists in the backend but has no consumer account-management screen in this frontend. `/admin/metrics` is used only to check catalog administrator authorization. Health/database endpoints are used for operational verification.

Verified locally: 14 unit tests and 10 real-backend browser journeys passed. Browser journeys ran through the production frontend at `http://127.0.0.1:3000`. Type checking, linting, production/container builds, direct-route history fallback, security headers, and frontend/API health checks passed. Automated accessibility checks covered the landing page, dashboard, goal form, and mobile navigation; this is not a claim of a comprehensive accessibility certification. The GitHub Actions workflow is configured but has not been executed by GitHub in this session.

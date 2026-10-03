import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Target,
  CheckCheck,
  FolderKanban,
  Route,
  Sparkles,
  Plus,
  Code2,
} from 'lucide-react';
import { userApi, goalsApi, roadmapsApi, skillsApi } from '../api/domains';
import { useData } from '../hooks/data';
import { useAuth } from '../app/providers';
import {
  Card,
  PageHeader,
  PageState,
  Badge,
  EmptyState,
  ProgressRing,
  ProgressBar,
  dateLabel,
  titleCase,
} from '../components/ui';
export default function DashboardPage() {
  const auth = useAuth();
  const profile = useData(['profile'], userApi.profile);
  const stats = useData(['analytics'], userApi.analytics);
  const goals = useData(['goals', 'dashboard'], () =>
    goalsApi.list({ limit: 4, status: 'active' }),
  );
  const roadmaps = useData(['roadmaps', 'dashboard'], () => roadmapsApi.list({ limit: 3 }));
  const skills = useData(['skills', 'dashboard'], () => skillsApi.list({ limit: 4 }));
  const percent = stats.data?.total_tasks
    ? Math.round((stats.data.completed_tasks / stats.data.total_tasks) * 100)
    : 0;
  const name = (profile.data?.full_name || auth.user?.full_name || auth.user?.username || '').split(
    ' ',
  )[0];
  return (
    <>
      <PageHeader
        eyebrow="YOUR LEARNING, AT A GLANCE"
        title={`A little closer, ${name}.`}
        description="Every small step adds up. Here’s where your journey stands."
        action={
          <Link className="button secondary" to="/goals">
            <Plus size={16} />
            New goal
          </Link>
        }
      />
      <div className="dashboard-hero">
        <div>
          <span className="eyebrow light">TURN YOUR NEXT GOAL INTO A PLAN</span>
          <h2>
            Your ambition deserves
            <br />a clear way forward.
          </h2>
          <p>
            Connect your current skills to your next chapter.
            <br />
            Let’s find the steps that get you there.
          </p>
          <Link className="button lime" to="/recommendations">
            Build my roadmap <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="hero-path" aria-hidden="true">
          <span>
            <Code2 size={20} /> What you know
          </span>
          <i />
          <span>
            <Route size={20} /> Your next steps
          </span>
          <i />
          <span>
            <Target size={20} /> Where you’re going
          </span>
        </div>
      </div>
      <PageState query={stats}>
        <div className="stats-grid">
          {[
            {
              label: 'Goals',
              value: stats.data?.goals,
              icon: Target,
              note: 'Ambitions with direction',
            },
            {
              label: 'Roadmaps',
              value: stats.data?.roadmaps,
              icon: Route,
              note: 'Paths you’re building',
            },
            {
              label: 'Tasks completed',
              value: stats.data?.completed_tasks,
              icon: CheckCheck,
              note: `Of ${stats.data?.total_tasks || 0} learning tasks`,
            },
            {
              label: 'Projects',
              value: stats.data?.projects,
              icon: FolderKanban,
              note: `${stats.data?.completed_projects || 0} completed`,
            },
          ].map((stat) => (
            <Card key={stat.label} className="stat-card">
              <div>
                <span>{stat.label}</span>
                <stat.icon size={18} />
              </div>
              <strong>{stat.value}</strong>
              <small>{stat.note}</small>
            </Card>
          ))}
        </div>
      </PageState>
      <div className="dashboard-columns">
        <div>
          <Card>
            <div className="section-heading">
              <div>
                <h2>Your roadmaps</h2>
                <p>A little structure for the journey ahead.</p>
              </div>
              <Link className="text-link" to="/roadmaps">
                View all <ArrowRight size={15} />
              </Link>
            </div>
            <PageState query={roadmaps}>
              {roadmaps.data?.length ? (
                roadmaps.data.map((roadmap) => (
                  <Link
                    className="roadmap-list-item"
                    to={`/roadmaps/${roadmap.id}`}
                    key={roadmap.id}
                  >
                    <span className="item-icon">
                      <Route size={21} />
                    </span>
                    <div>
                      <strong>{roadmap.title}</strong>
                      <p>{roadmap.description || 'Your personal learning path'}</p>
                      <Badge tone={roadmap.status}>{titleCase(roadmap.status)}</Badge>
                    </div>
                    <ArrowUpRight size={17} />
                  </Link>
                ))
              ) : (
                <EmptyState
                  title="Your next chapter is unwritten"
                  description="Set your goal and skill targets. We’ll help turn them into a learning path."
                  action={
                    <Link className="button secondary" to="/recommendations">
                      Create your first roadmap <ArrowRight size={16} />
                    </Link>
                  }
                />
              )}
            </PageState>
          </Card>
          <Card>
            <div className="section-heading">
              <div>
                <h2>Goals in motion</h2>
                <p>Keep your destination in sight.</p>
              </div>
              <Link className="text-link" to="/goals">
                View all <ArrowRight size={15} />
              </Link>
            </div>
            <PageState query={goals}>
              {goals.data?.length ? (
                goals.data.map((goal) => (
                  <Link className="goal-summary" to={`/goals/${goal.id}`} key={goal.id}>
                    <span className="goal-marker">
                      <Target size={19} />
                    </span>
                    <div>
                      <strong>{goal.title}</strong>
                      <span>
                        {goal.target_role || 'Learning goal'} · {dateLabel(goal.target_date)}
                      </span>
                    </div>
                    <Badge tone={goal.priority}>{titleCase(goal.priority)}</Badge>
                  </Link>
                ))
              ) : (
                <EmptyState
                  title="Give your learning a direction"
                  description="Create a goal for a skill, a career move, or something you want to build."
                  action={
                    <Link to="/goals" className="text-link">
                      Set your first goal <ArrowRight size={16} />
                    </Link>
                  }
                />
              )}
            </PageState>
          </Card>
        </div>
        <aside>
          <Card className="progress-card">
            <div className="section-heading">
              <h2>Your momentum</h2>
              <span className="mini-label">ALL ROADMAPS</span>
            </div>
            <PageState query={stats}>
              <ProgressRing value={percent} />
              <p>
                <strong>{stats.data?.completed_tasks || 0}</strong> tasks completed
                <br />
                <span>
                  {(stats.data?.total_tasks || 0) - (stats.data?.completed_tasks || 0)} steps still
                  ahead
                </span>
              </p>
              <div className="encouragement">
                {percent === 0
                  ? 'Your first step is the most important one.'
                  : percent === 100
                    ? 'You’ve completed every task. Ready for your next chapter?'
                    : 'A little progress is still progress. Keep going.'}
              </div>
            </PageState>
          </Card>
          <Card>
            <div className="section-heading">
              <h2>Your skillset</h2>
              <Link className="text-link" to="/skills">
                Manage <ArrowRight size={14} />
              </Link>
            </div>
            <PageState query={skills}>
              {skills.data?.length ? (
                skills.data.map((item) => (
                  <div className="skill-summary" key={item.id}>
                    <div>
                      <strong>{item.skill.name}</strong>
                      <span>{titleCase(item.proficiency)}</span>
                    </div>
                    <ProgressBar
                      value={
                        (['beginner', 'intermediate', 'advanced', 'expert'].indexOf(
                          item.proficiency,
                        ) +
                          1) *
                        25
                      }
                      label={`${item.skill.name} proficiency`}
                    />
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Start with what you know"
                  description="Add your skills to personalize your path."
                  action={
                    <Link to="/skills" className="text-link">
                      Add a skill <Plus size={15} />
                    </Link>
                  }
                />
              )}
            </PageState>
          </Card>
          <div className="tip-card">
            <Sparkles size={20} />
            <h3>Find your next step</h3>
            <p>
              Your skill gaps can become your next opportunity. Explore a plan based on your goals.
            </p>
            <Link to="/recommendations">
              Explore recommendations <ArrowRight size={15} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

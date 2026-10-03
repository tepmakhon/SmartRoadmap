import { lazy, Suspense, Component, type ReactNode, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Shell from '../components/layout/Shell';
import { ErrorState, LoadingState, EmptyState } from '../components/ui';
const Landing = lazy(() => import('../pages/LandingPage'));
const Auth = lazy(() => import('../pages/AuthPage'));
const Dashboard = lazy(() => import('../pages/DashboardPage'));
const Profile = lazy(() => import('../pages/ProfilePage'));
const Settings = lazy(() => import('../pages/SettingsPage'));
const Skills = lazy(() => import('../pages/SkillsPage'));
const Goals = lazy(() => import('../pages/GoalsPage'));
const GoalDetail = lazy(() =>
  import('../pages/GoalsPage').then((module) => ({ default: module.GoalDetail })),
);
const Topics = lazy(() => import('../pages/TopicsPage'));
const TopicDetail = lazy(() =>
  import('../pages/TopicsPage').then((module) => ({ default: module.TopicDetail })),
);
const Resources = lazy(() =>
  import('../pages/TopicsPage').then((module) => ({ default: module.ResourcesPage })),
);
const Roadmaps = lazy(() => import('../pages/RoadmapsPage'));
const RoadmapDetail = lazy(() =>
  import('../pages/RoadmapsPage').then((module) => ({ default: module.RoadmapDetail })),
);
const Projects = lazy(() => import('../pages/ProjectsPage'));
const ProjectDetail = lazy(() =>
  import('../pages/ProjectsPage').then((module) => ({ default: module.ProjectDetail })),
);
const Assessments = lazy(() => import('../pages/AssessmentsPage'));
const Recommendations = lazy(() => import('../pages/RecommendationsPage'));
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <div className="boot">
        <ErrorState
          error={new Error('This page could not be displayed. Please reload to try again.')}
          retry={() => window.location.reload()}
        />
      </div>
    ) : (
      this.props.children
    );
  }
}
function RouteEffects() {
  const location = useLocation();
  useEffect(() => {
    document.title = `${location.pathname.split('/')[1]?.replace(/^./, (c) => c.toUpperCase()) || 'Your next chapter'} · Smart Roadmap`;
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}
export function AppRoutes() {
  return (
    <BrowserRouter>
      <RouteEffects />
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="boot">
              <LoadingState />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
            <Route element={<Shell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/goals/:id" element={<GoalDetail />} />
              <Route path="/topics" element={<Topics />} />
              <Route path="/topics/:id" element={<TopicDetail />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/roadmaps" element={<Roadmaps />} />
              <Route path="/roadmaps/:id" element={<RoadmapDetail />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/assessments" element={<Assessments />} />
              <Route path="/recommendations" element={<Recommendations />} />
            </Route>
            <Route
              path="*"
              element={
                <div className="boot">
                  <EmptyState
                    title="This path doesn’t lead anywhere"
                    description="The page may have moved, or the address may be incorrect."
                    action={
                      <Link className="button primary" to="/dashboard">
                        Back to your workspace
                      </Link>
                    }
                  />
                </div>
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

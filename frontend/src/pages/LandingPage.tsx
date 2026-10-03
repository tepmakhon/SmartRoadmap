import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Target,
  Route,
  Layers,
  Check,
  Compass,
  Code2,
} from 'lucide-react';
import { Brand } from '../components/Brand';
export default function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Brand />
        <div className="landing-links">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Why Smart Roadmap</a>
        </div>
        <div>
          <Link className="button ghost" to="/login">
            Sign in
          </Link>
          <Link className="button primary" to="/register">
            Get started <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>
      <main>
        <section className="landing-hero">
          <div>
            <span className="landing-label">
              <span /> A CLEARER WAY FORWARD
            </span>
            <h1>
              Big ambitions.
              <br />
              Small steps.
              <br />
              <em>A path that’s yours.</em>
            </h1>
            <p>
              Turn your learning goals into a practical roadmap. Build on your skills, find your
              next step, and see how far you’ve come.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="button primary">
                Build my roadmap <ArrowRight size={18} />
              </Link>
              <a className="button ghost" href="#how-it-works">
                See how it works
              </a>
            </div>
            <div className="hero-note">
              <Check size={15} /> Your skills. Your goals. Your pace.
            </div>
          </div>
          <div
            className="journey-art"
            role="img"
            aria-label="A learning path from current skills to a career goal"
          >
            <div className="art-label">
              <Compass size={17} /> YOUR NEXT CHAPTER
            </div>
            <div className="art-node start">
              <span>
                <Code2 size={22} />
              </span>
              <div>
                <small>START WITH WHAT YOU KNOW</small>
                <strong>Your current skills</strong>
              </div>
              <Check size={18} />
            </div>
            <div className="art-connector" />
            <div className="art-node middle">
              <span>
                <Layers size={22} />
              </span>
              <div>
                <small>GROW, ONE STEP AT A TIME</small>
                <strong>Milestones that make sense</strong>
              </div>
            </div>
            <div className="art-connector" />
            <div className="art-node end">
              <span>
                <Target size={22} />
              </span>
              <div>
                <small>MAKE YOUR AMBITION REAL</small>
                <strong>Your learning goal</strong>
              </div>
              <ArrowUpRight size={20} />
            </div>
            <div className="art-caption">
              A plan built around where you are
              <br />
              and where you want to go.
            </div>
            <span className="art-orbit" />
          </div>
        </section>
        <section id="how-it-works" className="landing-section">
          <span className="eyebrow">LESS GUESSWORK. MORE FORWARD.</span>
          <h2>Give your ambition a little structure.</h2>
          <div className="steps-grid">
            {[
              {
                n: '01',
                title: 'Find your starting point',
                text: 'Add the skills you already have and your current proficiency.',
              },
              {
                n: '02',
                title: 'Choose your destination',
                text: 'Set a goal, define the skill targets, and put them in learning order.',
              },
              {
                n: '03',
                title: 'Take the next step',
                text: 'Generate a roadmap, follow your milestones, and track completed tasks.',
              },
            ].map((step) => (
              <div key={step.n}>
                <span>{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </section>
        <section id="features" className="landing-section feature-section">
          <div>
            <span className="eyebrow">EVERYTHING CONNECTED</span>
            <h2>
              One home for
              <br />
              your next chapter.
            </h2>
            <p>
              A learning plan is more useful when your goals, resources, and progress live together.
            </p>
            <Link to="/register" className="text-link">
              Start your journey <ArrowRight size={17} />
            </Link>
          </div>
          <div className="feature-grid">
            {[
              {
                icon: Target,
                title: 'Goals with direction',
                text: 'Define the role, priorities, and skill targets you want to work toward.',
              },
              {
                icon: Route,
                title: 'Personalized roadmaps',
                text: 'Turn skill gaps into ordered milestones and practical learning tasks.',
              },
              {
                icon: Layers,
                title: 'Learning, organized',
                text: 'Keep your topics, learning resources, projects, and assessments connected.',
              },
              {
                icon: Check,
                title: 'Progress you can see',
                text: 'Complete tasks and see your roadmap progress update as you learn.',
              },
            ].map((feature) => (
              <article key={feature.title}>
                <feature.icon size={24} />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-cta">
          <span className="eyebrow light">YOUR FUTURE SELF WILL THANK YOU</span>
          <h2>
            You don’t need the whole map.
            <br />
            Just a good place to start.
          </h2>
          <Link to="/register" className="button lime">
            Find my next step <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer>
        <Brand />
        <span>Built for learning. Designed for progress.</span>
        <Link to="/login">
          Sign in <ArrowUpRight size={15} />
        </Link>
      </footer>
    </div>
  );
}

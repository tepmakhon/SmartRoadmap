import { Link } from 'react-router-dom';
import { Route } from 'lucide-react';
export function Brand() {
  return (
    <Link className="brand" to="/">
      <span className="brand-icon">
        <Route size={23} />
      </span>
      smart<span>roadmap</span>
      <span className="brand-dot">.</span>
    </Link>
  );
}

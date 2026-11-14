import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container section-pad narrow-page center-box">
      <h2>Looks like this route wandered off.</h2>
      <p>We couldn’t find the page you were looking for.</p>
      <Link to="/" className="primary-btn">Back home</Link>
    </div>
  );
}

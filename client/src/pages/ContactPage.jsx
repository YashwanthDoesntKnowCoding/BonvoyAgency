import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container section-pad narrow-page">
      <h2>Contact us</h2>
      <form className="stack-form" onSubmit={submit}>
        <label>
          Name
          <input placeholder="Your name" />
        </label>
        <label>
          Email
          <input type="email" placeholder="you@example.com" />
        </label>
        <label>
          Message
          <textarea rows="5" placeholder="How can we help?" />
        </label>
        <button type="submit" className="primary-btn">Send message</button>
        {submitted && <p className="success-text">Thanks! Your message has been saved.</p>}
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="container section-pad narrow-page">
      <h2>Profile settings</h2>
      <form className="stack-form">
        <label>
          Full name
          <input defaultValue="Demo User" />
        </label>
        <label>
          Email
          <input type="email" defaultValue="demo@bonvoyagency.com" />
        </label>
        <label>
          Phone
          <input defaultValue="+91 9123456780" />
        </label>
        <button type="submit" className="primary-btn">Save changes</button>
      </form>
    </div>
  );
}

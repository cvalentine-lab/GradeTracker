import { useState, useEffect } from 'react';
import { populi } from '../api';
import styles from './Settings.module.css';

export default function Settings() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    populi.status().then(setStatus).catch(console.error);
  }, []);

  return (
    <div className={styles.settings}>
      <h1>Settings</h1>
      <section className={styles.section}>
        <h2>Populi Integration</h2>
        <p className={styles.status}>
          Mode: <strong>{status?.mode === 'live' ? 'Live (connected)' : 'Demo (sample data)'}</strong>
        </p>
        {status?.mode === 'demo' && (
          <div className={styles.config}>
            <p>To link your Populi account and build a planner from your syllabi:</p>
            <ol>
              <li>Request API access from your school's IT department or registrar. They can create an API key in Populi under Account & Settings → API → Keys.</li>
              <li>Create <code>backend/.env</code> (copy from <code>backend/.env.example</code>).</li>
              <li>Set <code>POPULI_API_URL</code> to your school's API URL, e.g. <code>https://myschool.populiweb.com/api2</code></li>
              <li>Set <code>POPULI_ACCESS_TOKEN</code> to the API key from your admin.</li>
              <li>Restart the backend server.</li>
            </ol>
            <p className={styles.note}>
              You can try the app with sample data in demo mode—build a planner and browse syllabi to see how it works.
            </p>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>AI Planner</h2>
        <p>When Populi is connected, you can use the <strong>AI build planner</strong> button to generate a smart planner from your syllabi. Add <code>OPENAI_API_KEY</code> to <code>backend/.env</code> (get a key at platform.openai.com).</p>
      </section>
    </div>
  );
}

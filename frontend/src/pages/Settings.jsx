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
            <p>To connect to your school's Populi:</p>
            <ol>
              <li>Copy <code>.env.example</code> to <code>.env</code> in the backend folder.</li>
              <li>Add your Populi API URL (e.g. <code>https://yourschool.populiweb.com/api</code>)</li>
              <li>Add your Populi access token (get from your school admin)</li>
              <li>Restart the backend server</li>
            </ol>
            <p className={styles.note}>
              Populi API access is typically granted by your institution's administrator.
              Contact your school's IT department for API credentials.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

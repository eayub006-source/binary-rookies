import { useState } from 'react';
import { IdentityProvider, useIdentity } from './context/IdentityContext.jsx';
import { IdentityGate } from './components/IdentityGate.jsx';
import { RumorForm } from './components/RumorForm.jsx';
import { RumorList } from './components/RumorList.jsx';
import { About } from './components/About.jsx';

function ReverifyLink() {
  const { anonymousId, clearIdentity } = useIdentity();
  if (!anonymousId) return null;
  return (
    <button
      type="button"
      className="app-reverify"
      onClick={() => { clearIdentity(); window.location.reload(); }}
    >
      Re-verify (show CAPTCHA again)
    </button>
  );
}

export default function App() {
  const [rumorListKey, setRumorListKey] = useState(0);
  return (
    <IdentityProvider>
      <div className="app">
        <header className="app-header">
          <h1>Anonymous Campus Rumor System</h1>
          <p className="app-tagline">Anonymous, community-verified rumors—trust without central authority.</p>
          <About />
          <ReverifyLink />
        </header>
        <IdentityGate>
          <RumorForm onCreated={() => setRumorListKey((k) => k + 1)} />
          <RumorList key={rumorListKey} />
        </IdentityGate>
      </div>
    </IdentityProvider>
  );
}

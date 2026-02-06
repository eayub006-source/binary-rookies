import { useState } from 'react';
import { IdentityProvider } from './context/IdentityContext.jsx';
import { IdentityGate } from './components/IdentityGate.jsx';
import { RumorForm } from './components/RumorForm.jsx';
import { RumorList } from './components/RumorList.jsx';

export default function App() {
  const [rumorListKey, setRumorListKey] = useState(0);
  return (
    <IdentityProvider>
      <div className="app">
        <h1>Anonymous Campus Rumor System</h1>
        <IdentityGate>
          <RumorForm onCreated={() => setRumorListKey((k) => k + 1)} />
          <RumorList key={rumorListKey} />
        </IdentityGate>
      </div>
    </IdentityProvider>
  );
}

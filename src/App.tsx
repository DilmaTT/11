import Index from './pages/Index';
import { AuthProvider } from '@/contexts/AuthContext';
import { RangeProvider } from '@/contexts/RangeContext';

function App() {
  return (
    <AuthProvider>
      <RangeProvider>
        <Index />
      </RangeProvider>
    </AuthProvider>
  );
}

export default App;

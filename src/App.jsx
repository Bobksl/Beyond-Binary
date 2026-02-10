import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import News from '@/pages/News';
import Onboarding from '@/pages/Onboarding';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* This 'index' route makes Home the default view */}
          <Route index element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/news" element={<News />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;

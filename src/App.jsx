import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import News from '@/pages/News';
import Onboarding from '@/pages/Onboarding';
import InternationalStudents from '@/pages/InternationalStudents';
import Promo from '@/pages/Promo';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Make News & Updates the default home page */}
          <Route index element={<News />} />
          <Route path="/home" element={<Home />} />
          <Route path="/international-students" element={<InternationalStudents />} />
          <Route path="/promo" element={<Promo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/news" element={<News />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;

import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import AIChatbox from './AIChatbox';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* This is where your page content will "plug in" */}
        <Outlet />
      </main>
      {/* AI Chatbox - available on all pages */}
      <AIChatbox />
    </div>
  );
};

export default Layout;

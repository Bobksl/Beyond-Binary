import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* This is where your page content will "plug in" */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
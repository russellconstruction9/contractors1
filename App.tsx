import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './hooks/useDataContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import ProjectDetails from './components/ProjectDetails';
import Tasks from './components/Tasks';
import Team from './components/Team';
import TimeTracking from './components/TimeTracking';
import PunchLists from './components/PunchLists';
import PunchListDetails from './components/PunchListDetails';
import ProjectPhotos from './components/ProjectPhotos';
import Inventory from './components/Inventory';
import Profile from './components/Profile';
import Schedule from './components/Schedule';
import MapView from './components/MapView';
import Invoicing from './components/Invoicing';
import InvoiceDetails from './components/InvoiceDetails';


const App: React.FC = () => {
  return (
    <DataProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
          <Route path="/projects/:projectId/photos" element={<ProjectPhotos />} />
          <Route path="/projects/:projectId/tasks" element={<Tasks />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/team" element={<Team />} />
          <Route path="/time-tracking" element={<TimeTracking />} />
          <Route path="/punch-lists" element={<PunchLists />} />
          <Route path="/punch-lists/:projectId" element={<PunchListDetails />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/invoicing" element={<Invoicing />} />
          <Route path="/invoices/:invoiceId" element={<InvoiceDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </DataProvider>
  );
};

export default App;
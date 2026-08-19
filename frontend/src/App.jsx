import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import AddRepoDialog from "./components/AddRepoDialog.jsx";
import SettingsDialog from "./components/SettingsDialog.jsx";
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx";

import Overview from "./views/Overview.jsx";
import AskView from "./views/AskView.jsx";
import ExplorerView from "./views/ExplorerView.jsx";
import SearchView from "./views/SearchView.jsx";
import GraphView from "./views/GraphView.jsx";
import ImpactView from "./views/ImpactView.jsx";

function Shell() {
  const [view, setView] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCommand, setShowCommand] = useState(false);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Cross-view focus: opening a file in the Explorer, or a symbol in Graph/Impact.
  const [explorerTarget, setExplorerTarget] = useState(null); // { file, start, end, repoId }
  const [symbolTarget, setSymbolTarget] = useState(null); // { symbol, repoId }

  const navigate = useCallback((id) => {
    setView(id);
    setMobileOpen(false);
  }, []);

  const openInExplorer = useCallback((cit, repoId) => {
    setExplorerTarget({ ...cit, repoId });
    setView("explorer");
  }, []);

  const openInGraph = useCallback((symbol, repoId) => {
    setSymbolTarget({ symbol, repoId });
    setView("graph");
  }, []);

  const openInImpact = useCallback((symbol, repoId) => {
    setSymbolTarget({ symbol, repoId });
    setView("impact");
  }, []);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommand((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const viewProps = { openInExplorer, openInGraph, openInImpact, navigate, explorerTarget, symbolTarget };

  return (
    <div className="app" data-collapsed={collapsed} data-mobile-open={mobileOpen}>
      <Sidebar
        activeView={view}
        onNavigate={navigate}
        collapsed={collapsed}
        onAddRepo={() => setShowAddRepo(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenCommand={() => setShowCommand(true)}
      />
      <div className="app-main">
        <TopBar
          activeView={view}
          onToggleSidebar={() => {
            setCollapsed((c) => !c);
            setMobileOpen((m) => !m);
          }}
          onOpenCommand={() => setShowCommand(true)}
          onOpenSettings={() => setShowSettings(true)}
          onAddRepo={() => setShowAddRepo(true)}
        />
        <div className="app-body">
          {view === "overview" && <Overview {...viewProps} onAddRepo={() => setShowAddRepo(true)} />}
          {view === "ask" && <AskView {...viewProps} onAddRepo={() => setShowAddRepo(true)} />}
          {view === "explorer" && <ExplorerView {...viewProps} />}
          {view === "search" && <SearchView {...viewProps} />}
          {view === "graph" && <GraphView {...viewProps} />}
          {view === "impact" && <ImpactView {...viewProps} />}
        </div>
      </div>

      {showCommand && (
        <CommandPalette
          onClose={() => setShowCommand(false)}
          onNavigate={navigate}
          onAddRepo={() => { setShowCommand(false); setShowAddRepo(true); }}
          onOpenSettings={() => { setShowCommand(false); setShowSettings(true); }}
        />
      )}
      {showAddRepo && <AddRepoDialog onClose={() => setShowAddRepo(false)} />}
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <Shell />
    </WorkspaceProvider>
  );
}

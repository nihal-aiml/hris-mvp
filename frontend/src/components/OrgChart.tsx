import { useState, useRef, useCallback, useEffect } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  Search, ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronUp,
  Loader2, Users
} from 'lucide-react';
import {
  Employee, Department, DEPARTMENT_COLORS, DEPARTMENT_LABELS
} from '../types/employee';

interface Props {
  employees: Employee[];
  loading: boolean;
  onNodeClick: (emp: Employee) => void;
  highlightedId: string | null;
  onHighlightClear: () => void;
}

interface TreeData {
  emp: Employee;
  children: TreeData[];
}

function buildTree(employees: Employee[]): TreeData[] {
  const map = new Map<string, TreeData>();
  employees.forEach(e => map.set(e.id, { emp: e, children: [] }));
  const roots: TreeData[] = [];
  employees.forEach(e => {
    const node = map.get(e.id)!;
    if (e.managerId && map.has(e.managerId)) {
      map.get(e.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

interface OrgNodeProps {
  node: TreeData;
  onNodeClick: (emp: Employee) => void;
  highlightedId: string | null;
  onHighlightClear: () => void;
}

function OrgNode({ node, onNodeClick, highlightedId, onHighlightClear }: OrgNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const isHighlighted = highlightedId === node.emp.id;
  const hasChildren = node.children.length > 0;
  const { emp } = node;
  const deptColor = DEPARTMENT_COLORS[emp.department];
  const initials = `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase();
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHighlighted && nodeRef.current) {
      nodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      const t = setTimeout(onHighlightClear, 4500);
      return () => clearTimeout(t);
    }
  }, [isHighlighted]);

  return (
    <TreeNode
      label={
        <div className="flex justify-center pb-2">
          <div
            ref={nodeRef}
            id={`org-node-${emp.id}`}
            onClick={() => onNodeClick(emp)}
            className={`relative cursor-pointer rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-xl group ${isHighlighted ? 'node-highlight' : ''}`}
            style={{
              width: 180,
              background: 'var(--color-surface-2)',
              border: `1px solid ${isHighlighted ? deptColor : 'var(--color-border)'}`,
              borderTop: `3px solid ${deptColor}`,
              boxShadow: isHighlighted
                ? `0 0 20px ${deptColor}66, 0 4px 20px rgba(0,0,0,0.4)`
                : '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <div className="p-3 pb-2">
              {/* Avatar */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${emp.avatarColor}, ${emp.avatarColor}88)` }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-xs truncate leading-tight" style={{ color: deptColor, fontSize: 10 }}>
                    {emp.jobTitle}
                  </p>
                </div>
              </div>
              {/* Dept badge */}
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
                style={{ background: `${deptColor}20`, color: deptColor, fontSize: 9, border: `1px solid ${deptColor}30` }}
              >
                {DEPARTMENT_LABELS[emp.department]}
              </span>
            </div>

            {/* Expand/collapse button */}
            {hasChildren && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(x => !x); }}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-white z-10 shadow-lg transition-transform hover:scale-110"
                style={{ background: deptColor, border: '2px solid var(--color-bg)' }}
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded
                  ? <ChevronUp size={10} />
                  : <ChevronDown size={10} />
                }
              </button>
            )}
          </div>
        </div>
      }
    >
      {hasChildren && expanded
        ? node.children.map(child => (
            <OrgNode
              key={child.emp.id}
              node={child}
              onNodeClick={onNodeClick}
              highlightedId={highlightedId}
              onHighlightClear={onHighlightClear}
            />
          ))
        : null}
    </TreeNode>
  );
}

export default function OrgChart({ employees, loading, onNodeClick, highlightedId, onHighlightClear }: Props) {
  const [searchQ, setSearchQ] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const transformRef = useRef<any>(null);

  const tree = buildTree(employees);

  const handleSearch = useCallback(() => {
    if (!searchQ.trim()) return;
    const q = searchQ.toLowerCase();
    const found = employees.find(e =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
      e.jobTitle.toLowerCase().includes(q)
    );
    if (found) {
      setSearchResult(found.id);
      // Trigger highlight which will scroll to the node
      const el = document.getElementById(`org-node-${found.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    } else {
      setSearchResult('not-found');
      setTimeout(() => setSearchResult(null), 2000);
    }
  }, [searchQ, employees]);

  const departments = [...new Set(employees.map(e => e.department))] as Department[];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 size={32} className="text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm">Loading org chart…</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
        <Users size={40} className="opacity-30" />
        <p>No employees to display</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* ── Action Bar ───────────────────────────────────────────── */}
      <div
        className="shrink-0 flex flex-wrap items-center gap-3 px-6 py-3 border-b z-10"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* In-chart search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="orgchart-search"
              type="text"
              placeholder="Find employee on chart…"
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSearchResult(null); }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9 pr-3 py-1.5 text-sm rounded-lg border outline-none w-52"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border-2)', color: 'var(--color-text)' }}
            />
          </div>
          <button
            id="orgchart-search-btn"
            onClick={handleSearch}
            className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all hover:opacity-90"
            style={{ background: 'var(--color-accent)' }}
          >
            Find
          </button>
          {searchResult === 'not-found' && (
            <span className="text-xs text-red-400">No match found</span>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            id="zoom-in-btn"
            onClick={() => transformRef.current?.zoomIn()}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            id="zoom-out-btn"
            onClick={() => transformRef.current?.zoomOut()}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            id="zoom-fit-btn"
            onClick={() => transformRef.current?.resetTransform()}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="Fit All"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* ── Chart Canvas ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #0f172a 0%, #070d1a 100%)' }}>
        {/* dot grid background */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <TransformWrapper
          ref={transformRef}
          initialScale={0.85}
          minScale={0.2}
          maxScale={2}
          centerOnInit
          limitToBounds={false}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ padding: '60px 80px' }}
          >
            {tree.map(root => (
              <Tree
                key={root.emp.id}
                label=""
                lineWidth="1px"
                lineColor="#334155"
                lineBorderRadius="6px"
                nodePadding="4px"
              >
                <OrgNode
                  node={root}
                  onNodeClick={onNodeClick}
                  highlightedId={highlightedId}
                  onHighlightClear={onHighlightClear}
                />
              </Tree>
            ))}
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* ── Department Legend ─────────────────────────────────────── */}
      <div
        className="absolute bottom-4 right-4 rounded-xl p-3 border z-10"
        style={{ background: 'rgba(17,24,39,0.92)', borderColor: 'var(--color-border)', backdropFilter: 'blur(8px)' }}
      >
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Departments</p>
        <div className="flex flex-col gap-1.5">
          {departments.map(dept => (
            <div key={dept} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: DEPARTMENT_COLORS[dept] }} />
              <span className="text-xs text-slate-300">{DEPARTMENT_LABELS[dept]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

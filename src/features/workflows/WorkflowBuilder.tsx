import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  type Node, type Edge, type Connection, Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowNodeComponent } from './WorkflowNode';
import { NodeLibrary } from './NodeLibrary';
import { NodeConfigPanel } from './NodeConfigPanel';
import { WorkflowExecutionPanel } from './WorkflowExecutionPanel';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { generateId, cn } from '@/lib/utils';
import type { Workflow, WorkflowNode as WFNode, WorkflowNodeData } from '@/types';
import { allNodeDefs } from './nodeDefinitions';
import { ArrowLeft, Save, Play, Power, PowerOff, CheckCircle2 } from 'lucide-react';
import { runWorkflowExecution } from './workflowExecutionEngine';
import { products } from '@/data/products';

const nodeTypes = { workflowNode: WorkflowNodeComponent };

interface WorkflowBuilderProps {
  workflow: Workflow | null;
  onBack: () => void;
}

export function WorkflowBuilder({ workflow, onBack }: WorkflowBuilderProps) {
  const { addWorkflow, updateWorkflow, activateWorkflow, deactivateWorkflow, batches, addOperation, addNotification, addExecution } = useAppStore();
  const { t, isRTL } = useTranslation();
  const wf = t.workflows;

  const initialNodes: Node[] = (workflow?.nodes ?? []).map(n => ({ ...n, type: 'workflowNode', data: n.data as WorkflowNodeData }));
  const initialEdges: Edge[] = workflow?.edges ?? [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState(workflow?.name ?? (isRTL ? 'گردش‌کار بدون نام' : 'Untitled Workflow'));
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saved, setSaved] = useState(false);
  const [executionOpen, setExecutionOpen] = useState(false);
  const [executionResult, setExecutionResult] = useState<import('./workflowExecutionEngine').ExecutionResult | null>(null);
  const [isActive, setIsActive] = useState(workflow?.status === 'active');
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(workflow?.id ?? null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback((conn: Connection) => {
    setEdges(eds => addEdge({ ...conn, type: 'smoothstep' }, eds));
  }, [setEdges]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    // Check for custom node data first
    const customData = event.dataTransfer.getData('application/reactflow-custom');
    const nodeTypeStr = event.dataTransfer.getData('application/reactflow-nodetype');

    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (!rect) return;

    // Center the drop on the cursor
    const position = {
      x: event.clientX - rect.left - 110,
      y: event.clientY - rect.top - 45,
    };

    if (customData) {
      try {
        const parsed = JSON.parse(customData) as { type: string; label: string; description: string; category: import('@/types').NodeCategory };
        const newNode: Node = {
          id: generateId('n'),
          type: 'workflowNode',
          position,
          data: {
            nodeType: parsed.type as import('@/types').NodeType,
            category: parsed.category,
            label: parsed.label,
            description: parsed.description,
            config: {},
            executionState: 'idle',
          } as WorkflowNodeData,
        };
        setNodes(nds => [...nds, newNode]);
      } catch { /* ignore */ }
      return;
    }

    if (!nodeTypeStr) return;
    const def = allNodeDefs.find(d => d.type === nodeTypeStr);
    if (!def) return;

    const newNode: Node = {
      id: generateId('n'),
      type: 'workflowNode',
      position,
      data: {
        nodeType: def.type,
        category: def.category,
        label: def.label,
        description: def.description,
        config: { ...def.defaultConfig },
        executionState: 'idle',
      } as WorkflowNodeData,
    };
    setNodes(nds => [...nds, newNode]);
  }, [setNodes]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  function updateNodeConfig(nodeId: string, config: Record<string, unknown>, label?: string) {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, config, ...(label ? { label } : {}) } as WorkflowNodeData } : n));
    if (selectedNode?.id === nodeId)
      setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, config, ...(label ? { label } : {}) } as WorkflowNodeData } : null);
  }

  function deleteNode(nodeId: string) {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }

  function handleSave() {
    const wfNodes: WFNode[] = nodes.map(n => ({ id: n.id, type: n.type ?? 'workflowNode', position: n.position, data: n.data as WorkflowNodeData }));
    const wfEdges = edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type, label: e.label as string }));
    if (savedWorkflowId) {
      updateWorkflow(savedWorkflowId, { name: workflowName, nodes: wfNodes, edges: wfEdges });
    } else {
      const created = addWorkflow({ name: workflowName, description: isRTL ? 'گردش‌کار سفارشی' : 'Custom workflow', status: 'draft', nodes: wfNodes, edges: wfEdges, createdBy: 'user-001' });
      setSavedWorkflowId(created.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleToggleActive() {
    if (!savedWorkflowId) { handleSave(); return; }
    if (isActive) { deactivateWorkflow(savedWorkflowId); setIsActive(false); }
    else { activateWorkflow(savedWorkflowId); setIsActive(true); }
  }

  async function handleTest() {
    const allProducts = products.map(p => ({ product: p, batches: batches.filter(b => b.productId === p.id) }));
    const sample = allProducts.find(p => p.batches.length > 0);
    if (!sample) return;
    const wfNodes: WFNode[] = nodes.map(n => ({ id: n.id, type: n.type ?? 'workflowNode', position: n.position, data: n.data as WorkflowNodeData }));
    const wfEdges = edges.map(e => ({ id: e.id, source: e.source, target: e.target }));
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, executionState: 'idle' } as WorkflowNodeData })));
    const result = await runWorkflowExecution(
      { id: savedWorkflowId ?? 'preview', name: workflowName, nodes: wfNodes, edges: wfEdges } as Workflow,
      sample,
      { addOperation, addNotification, addExecution },
      (nodeId, state) => setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, executionState: state } as WorkflowNodeData } : n))
    );
    setExecutionResult(result);
    setExecutionOpen(true);
    setTimeout(() => setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, executionState: 'idle' } as WorkflowNodeData }))), 5000);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className={cn('flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white flex-shrink-0', isRTL && 'flex-row-reverse')}>
        <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
          <button onClick={onBack} className={cn('flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors', isRTL && 'flex-row-reverse')}>
            <ArrowLeft size={15} className={cn(isRTL && 'rotate-180')} />
            <span className="hidden sm:inline">{wf.backToWorkflows}</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <input
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
            dir={isRTL ? 'rtl' : 'ltr'}
            className="w-52 h-7 text-sm font-semibold text-slate-900 bg-transparent border border-transparent rounded px-1 focus:outline-none focus:border-slate-200 focus:bg-white transition-colors"
          />
        </div>
        <div className={cn('flex items-center gap-1.5', isRTL && 'flex-row-reverse')}>
          {saved && (
            <span className={cn('flex items-center gap-1 text-xs text-green-700 mx-1', isRTL && 'flex-row-reverse')}>
              <CheckCircle2 size={12} /> {wf.saved}
            </span>
          )}
          <Button size="xs" variant="secondary" leftIcon={<Save size={12} />} onClick={handleSave}>{wf.save}</Button>
          <Button size="xs" variant="outline" leftIcon={<Play size={12} />} onClick={handleTest}>{wf.test}</Button>
          <Button size="xs" variant={isActive ? 'danger' : 'primary'}
            leftIcon={isActive ? <PowerOff size={12} /> : <Power size={12} />}
            onClick={handleToggleActive}>
            {isActive ? wf.deactivate : wf.activate}
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div className={cn('flex flex-1 min-h-0', isRTL && 'flex-row-reverse')}>
        <NodeLibrary />
        <div className="flex-1 min-w-0 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onDrop={onDrop} onDragOver={onDragOver}
            onNodeClick={onNodeClick} onPaneClick={onPaneClick}
            nodeTypes={nodeTypes} fitView
            defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
            connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2 }}
            className="bg-slate-50/30">
            <Background color="#e2e8f0" gap={16} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                const cat = (n.data as WorkflowNodeData)?.category;
                return cat === 'trigger' ? '#3b82f6' : cat === 'condition' ? '#f59e0b' : '#15803d';
              }}
              nodeStrokeWidth={2}
              zoomable
              pannable
            />
            <Panel position="top-center">
              {nodes.length === 0 && (
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-500 shadow-sm mt-2">
                  {wf.dragHint}
                </div>
              )}
            </Panel>
          </ReactFlow>
          {executionOpen && executionResult && (
            <WorkflowExecutionPanel result={executionResult} onClose={() => setExecutionOpen(false)} />
          )}
        </div>
        {selectedNode && (
          <NodeConfigPanel node={selectedNode}
            onUpdate={(config, label) => updateNodeConfig(selectedNode.id, config, label)}
            onDelete={() => deleteNode(selectedNode.id)} />
        )}
      </div>
    </div>
  );
}

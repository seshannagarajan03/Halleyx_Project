import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi } from '../api/services';
import { Plus, Play, Pencil, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './WorkflowList.css';

const WorkflowList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['workflows', search, status, page],
    queryFn: () => workflowApi.getAll({ search, status, page, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: workflowApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] })
  });

  const handleDelete = async (workflowId) => {
    if (!window.confirm('Delete this workflow and all of its steps/rules?')) return;
    await deleteMutation.mutateAsync(workflowId);
  };

  const pagination = data?.pagination;

  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workflow Library</h1>
          <p style={{ color: 'var(--slate-500)', marginTop: '4px' }}>Create, version, execute, and audit workflow definitions.</p>
        </div>
        <button onClick={() => navigate('/workflows/new')} className="btn-primary">
          <Plus size={20} /> Create Workflow
        </button>
      </div>

      <div className="table-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '16px' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--slate-400)' }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search workflow by name"
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid var(--slate-200)' }}
            />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ minWidth: '180px', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Steps</th>
              <th>Version</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((workflow) => (
              <tr key={workflow._id}>
                <td className="workflow-name">{workflow.name}</td>
                <td>{workflow.steps_count || 0}</td>
                <td><span className="badge badge-info">v{workflow.version}</span></td>
                <td>
                  <span className={`badge ${workflow.is_active ? 'badge-success' : 'badge-error'}`}>
                    {workflow.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                    <button onClick={() => navigate(`/execute/${workflow._id}`)} className="icon-btn" style={{ color: '#166534' }} title="Execute">
                      <Play size={18} />
                    </button>
                    <button onClick={() => navigate(`/workflows/${workflow._id}`)} className="icon-btn" style={{ color: 'var(--primary-600)' }} title="Edit">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(workflow._id)} className="icon-btn btn-delete" title="Delete" disabled={deleteMutation.isPending}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!data?.data || data.data.length === 0) && (
              <tr>
                <td colSpan="5" className="empty-table-msg">No workflows available yet. Create your first workflow to begin automation.</td>
              </tr>
            )}
          </tbody>
        </table>
        {pagination?.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
            <span style={{ color: 'var(--slate-500)' }}>Page {pagination.currentPage} of {pagination.pages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-ghost-primary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
              <button className="btn-ghost-primary" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowList;

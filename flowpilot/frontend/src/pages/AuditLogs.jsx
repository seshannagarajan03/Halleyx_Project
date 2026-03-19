import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { executionApi } from '../api/services';
import { Clock, CheckCircle, XCircle, Play, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AuditLogs.css';

const AuditLogs = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['executions'],
    queryFn: () => executionApi.getAll(),
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { class: 'badge-success', icon: <CheckCircle size={14} /> },
      failed: { class: 'badge-error', icon: <XCircle size={14} /> },
      pending: { class: 'badge-warning', icon: <Clock size={14} /> },
      in_progress: { class: 'badge-info', icon: <Play size={14} /> },
      resuming: { class: 'badge-info', icon: <Play size={14} /> },
      canceled: { class: 'badge-error', icon: <XCircle size={14} /> },
    };

    const current = statusMap[status] || {
      class: 'badge-info',
      icon: <Clock size={14} />
    };

    return (
      <span
        className={`badge ${current.class}`}
        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        {current.icon} {String(status || 'unknown').toUpperCase()}
      </span>
    );
  };

  const handleOpenExecution = (execution) => {
    const workflowId = execution?.workflow_id?._id || execution?.workflow_id;
    const executionId = execution?._id;

    if (!workflowId || !executionId) {
      return;
    }

    navigate(`/execute/${workflowId}?executionId=${executionId}`);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Execution History</h1>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Status</th>
              <th>Triggered By</th>
              <th>Started At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((execution) => (
              <tr key={execution._id}>
                <td className="workflow-name">
                  {execution.workflow_id?.name || 'Workflow'}
                </td>
                <td>{getStatusBadge(execution.status)}</td>
                <td>{execution.triggered_by?.name || 'User'}</td>
                <td style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
                  {execution.createdAt
                    ? new Date(execution.createdAt).toLocaleString()
                    : '-'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => handleOpenExecution(execution)}
                    className="icon-btn"
                    style={{ color: 'var(--primary-600)' }}
                    title="Open execution"
                  >
                    <ArrowRight size={18} />
                  </button>
                </td>
              </tr>
            ))}

            {(!data?.data || data.data.length === 0) && (
              <tr>
                <td colSpan="5" className="empty-table-msg">
                  No executions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
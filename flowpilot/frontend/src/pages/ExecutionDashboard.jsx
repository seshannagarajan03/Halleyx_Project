import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { workflowApi, executionApi } from '../api/services';
import io from 'socket.io-client';
import { Play, CircleCheck, CircleX, Clock, RotateCcw, Ban } from 'lucide-react';
import { SOCKET_URL } from '../api/client';
import './ExecutionDashboard.css';

const getInitialFormData = (inputSchema = {}) => {
  const initialData = {};
  Object.entries(inputSchema || {}).forEach(([fieldName, config]) => {
    initialData[fieldName] = config.type === 'boolean' ? false : '';
  });
  return initialData;
};

const buildPayloadFromSchema = (formData, inputSchema = {}) => {
  const payload = {};
  Object.entries(inputSchema || {}).forEach(([fieldName, config]) => {
    const rawValue = formData[fieldName];
    if (config.type === 'number') payload[fieldName] = rawValue === '' ? null : Number(rawValue);
    else if (config.type === 'boolean') payload[fieldName] = Boolean(rawValue);
    else payload[fieldName] = rawValue;
  });
  return payload;
};

const statusLabel = {
  pending: 'Awaiting Approval',
  in_progress: 'In Progress',
  resuming: 'Resuming',
  completed: 'Completed',
  failed: 'Failed',
  canceled: 'Canceled'
};

const ExecutionDashboard = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialExecutionId = searchParams.get('executionId');
  const [execution, setExecution] = useState(null);
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState('');

  const { data: workflow, refetch: refetchWorkflow } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowApi.getOne(id),
    enabled: !!id,
  });

  const { data: fetchedExecution, refetch: refetchExecution } = useQuery({
    queryKey: ['execution', initialExecutionId],
    queryFn: () => executionApi.getOne(initialExecutionId),
    enabled: !!initialExecutionId && initialExecutionId !== 'null',
  });

  useEffect(() => {
    if (fetchedExecution?.data) setExecution(fetchedExecution.data);
  }, [fetchedExecution]);

  useEffect(() => {
    const schema = workflow?.data?.input_schema || {};
    setFormData(getInitialFormData(schema));
  }, [workflow?.data?.input_schema]);

  const runMutation = useMutation({
    mutationFn: (data) => workflowApi.execute(id, data),
    onSuccess: (res) => {
      setExecution(res.data);
      setFormError('');
    },
    onError: (error) => {
      setFormError(error?.response?.data?.message || 'Failed to start workflow execution.');
    }
  });

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('execution_update', (data) => {
      setExecution((prev) => {
        if (!prev) return prev;
        if (String(data.id) !== String(prev._id)) return prev;
        return { ...prev, ...data };
      });
    });
    return () => socket.close();
  }, []);

  const stats = useMemo(() => {
    if (!execution) return { stepsCompleted: 0, rulesEvaluated: 0, duration: '-', retries: 0 };
    const rulesEvaluated = (execution.logs || []).reduce((acc, log) => acc + (log.evaluated_rules?.length || 0), 0);
    const startedAt = execution.createdAt ? new Date(execution.createdAt).getTime() : null;
    const endedAt = (execution.ended_at || execution.updatedAt) ? new Date(execution.ended_at || execution.updatedAt).getTime() : null;
    const duration = startedAt && endedAt ? `${((endedAt - startedAt) / 1000).toFixed(1)}s` : '-';
    return { stepsCompleted: execution.logs?.length || 0, rulesEvaluated, duration, retries: execution.retries || 0 };
  }, [execution]);

  const handleRefresh = () => {
    refetchWorkflow();
    if (initialExecutionId && initialExecutionId !== 'null') refetchExecution();
  };

  const handleApprove = async () => {
    if (!execution?._id) return;
    const response = await executionApi.resume(execution._id, { approved: true });
    setExecution(response.data);
  };

  const handleRetry = async () => {
    if (!execution?._id) return;
    const response = await executionApi.retry(execution._id);
    setExecution(response.data);
  };

  const handleCancel = async () => {
    if (!execution?._id) return;
    const response = await executionApi.cancel(execution._id);
    setExecution(response.data);
  };

  const handleChange = (e, fieldType) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: fieldType === 'boolean' ? checked : value }));
  };

  const validateForm = () => {
    const schema = workflow?.data?.input_schema || {};
    for (const [fieldName, config] of Object.entries(schema)) {
      const value = formData[fieldName];
      if (config.required && (value === '' || value === null || value === undefined)) {
        return `${fieldName} is required`;
      }
      if (Array.isArray(config.allowed_values) && value && !config.allowed_values.includes(value)) {
        return `${fieldName} must be one of ${config.allowed_values.join(', ')}`;
      }
    }
    return '';
  };

  const handleRunWorkflow = () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const payload = buildPayloadFromSchema(formData, workflow?.data?.input_schema || {});
    runMutation.mutate(payload);
  };

  const renderInputField = (fieldName, config) => {
    const value = formData[fieldName];
    if (Array.isArray(config.allowed_values) && config.allowed_values.length > 0) {
      return (
        <select name={fieldName} value={value ?? ''} onChange={(e) => handleChange(e, config.type)}>
          <option value="">Select {fieldName}</option>
          {config.allowed_values.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    if (config.type === 'boolean') {
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" name={fieldName} checked={Boolean(value)} onChange={(e) => handleChange(e, config.type)} />
          <span>{fieldName}</span>
        </label>
      );
    }
    return (
      <input type={config.type === 'number' ? 'number' : 'text'} name={fieldName} placeholder={`${fieldName}${config.required ? ' *' : ''}`} value={value ?? ''} onChange={(e) => handleChange(e, config.type)} />
    );
  };

  const inputSchema = workflow?.data?.input_schema || {};

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">{workflow?.data?.name || 'Workflow'}</h1>
          <p className="dashboard-subtitle">Execution view, logs, retries, and manual approval actions.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="btn-ghost-primary">Refresh</button>
        </div>
      </div>

      {!execution ? (
        <div className="dashboard-grid">
          <div className="dashboard-main">
            <div className="side-card">
              <h3 className="side-card-title">Enter Input Data</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {Object.keys(inputSchema).length === 0 ? <p>No input schema found for this workflow.</p> : Object.entries(inputSchema).map(([fieldName, config]) => (
                  <div key={fieldName} style={{ display: 'grid', gap: '6px' }}>
                    <label style={{ fontWeight: 600 }}>{fieldName}{config.required ? ' *' : ''}</label>
                    {renderInputField(fieldName, config)}
                  </div>
                ))}
                {formError && <div style={{ color: 'red', fontSize: '14px' }}>{formError}</div>}
                <button onClick={handleRunWorkflow} className="btn-run" disabled={runMutation.isPending || Object.keys(inputSchema).length === 0}>
                  <Play size={20} /> {runMutation.isPending ? 'Starting...' : 'Start Execution'}
                </button>
              </div>
            </div>
          </div>
          <div className="dashboard-sidebar">
            <div className="side-card">
              <h3 className="side-card-title">Execution Payload</h3>
              <pre className="data-preview">{JSON.stringify(buildPayloadFromSchema(formData, inputSchema), null, 2)}</pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="dashboard-main">
            <div className={`status-banner status-${String(execution.status).replace('_', '-')}`}>
              <div className="status-content">
                <div className="status-icon-wrapper">
                  {execution.status === 'completed' && <CircleCheck style={{ color: 'var(--success)' }} />}
                  {execution.status === 'failed' && <CircleX style={{ color: 'var(--error)' }} />}
                  {(execution.status === 'pending' || execution.status === 'in_progress' || execution.status === 'resuming') && <Clock style={{ color: 'var(--warning)' }} />}
                </div>
                <div className="status-text">
                  <h3>{statusLabel[execution.status] || execution.status}</h3>
                  <p className="status-id">Execution ID: {execution._id}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {execution.status === 'pending' && <button onClick={handleApprove} className="btn-approve">APPROVE</button>}
                {execution.status === 'failed' && <button onClick={handleRetry} className="btn-approve"><RotateCcw size={16} /> RETRY</button>}
                {(execution.status === 'pending' || execution.status === 'in_progress') && <button onClick={handleCancel} className="btn-ghost-primary"><Ban size={16} /> Cancel</button>}
              </div>
            </div>

            <div className="timeline-card">
              <div className="timeline-header">Execution Logs</div>
              <div className="timeline-body">
                <div className="timeline-connector"></div>
                {(execution.logs || []).map((log, index) => (
                  <div key={`${log.step_id || index}-${index}`} className="timeline-item">
                    <div className={`timeline-dot ${log.status?.startsWith('completed') ? 'dot-completed' : 'dot-in-progress'}`}></div>
                    <div className="timeline-content">
                      <div className="timeline-item-header">
                        <h4 className="timeline-item-title">{log.step_name}</h4>
                        <span className="timeline-item-time">{log.ended_at ? new Date(log.ended_at).toLocaleTimeString() : '-'}</span>
                      </div>
                      <div style={{ color: 'var(--slate-500)', marginBottom: '8px' }}>
                        Status: {log.status} · Next step: {workflow?.data?.steps?.find((step) => step._id === log.selected_next_step || step._id === String(log.selected_next_step))?.name || (log.selected_next_step ? 'Mapped step' : 'End Workflow')}
                      </div>
                      {log.error_message && <div style={{ color: 'var(--error)', marginBottom: '8px' }}>{log.error_message}</div>}
                      <div className="rules-log">
                        {(log.evaluated_rules || []).map((rule, idx) => (
                          <div key={idx} className="rule-log-item">
                            {rule.result ? <CircleCheck size={12} className="rule-match" /> : <CircleX size={12} className="rule-skip" />}
                            <span className="rule-condition">{rule.condition}:</span>
                            <span className={rule.result ? 'rule-match' : 'rule-skip'}>{rule.result ? 'MATCH' : 'SKIP'}</span>
                            {rule.error_message && <span style={{ color: 'var(--error)' }}>({rule.error_message})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-sidebar">
            <div className="side-card">
              <h3 className="side-card-title">Execution Payload</h3>
              <pre className="data-preview">{JSON.stringify(execution.data, null, 2)}</pre>
            </div>
            <div className="side-card">
              <h3 className="side-card-title">Real-time Metrics</h3>
              <div className="stats-list">
                <div className="stat-item"><span className="stat-label">Steps Completed</span><span className="stat-value">{stats.stepsCompleted}</span></div>
                <div className="stat-item"><span className="stat-label">Rules Evaluated</span><span className="stat-value">{stats.rulesEvaluated}</span></div>
                <div className="stat-item"><span className="stat-label">Retries</span><span className="stat-value">{stats.retries}</span></div>
                <div className="stat-item"><span className="stat-label">Duration</span><span className="stat-value">{stats.duration}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionDashboard;

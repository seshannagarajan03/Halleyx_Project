import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi } from '../api/services';
import { Save, Plus } from 'lucide-react';
import StepCard from '../components/StepCard';
import './WorkflowEditor.css';

const defaultRuleDraft = {
  priority: 1,
  condition: '',
  next_step_id: '',
  is_default: false,
};

const WorkflowEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowApi.getOne(id),
    enabled: !isNew,
  });

  const steps = useMemo(() => workflow?.data?.steps || [], [workflow]);
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    input_schema: '{\n  "amount": { "type": "number", "required": true },\n  "country": { "type": "string", "required": true },\n  "priority": { "type": "string", "required": true, "allowed_values": ["High", "Medium", "Low"] }\n}',
    is_active: true,
  });
  const [ruleDraft, setRuleDraft] = useState(defaultRuleDraft);
  const [ruleError, setRuleError] = useState('');

  useEffect(() => {
    if (workflow?.data) {
      setFormData({
        name: workflow.data.name,
        input_schema: JSON.stringify(workflow.data.input_schema, null, 2),
        is_active: workflow.data.is_active,
      });
      if (!selectedStepId && workflow.data.steps?.length) {
        setSelectedStepId(workflow.data.steps[0]._id);
      }
    }
  }, [workflow, selectedStepId]);

  const selectedStep = steps.find((step) => step._id === selectedStepId) || null;

  const mutation = useMutation({
    mutationFn: (data) => (isNew ? workflowApi.create(data) : workflowApi.update(id, data)),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      const workflowId = response?.data?._id;
      if (workflowId) {
        navigate(`/workflows/${workflowId}`);
        return;
      }
      navigate('/workflows');
    },
  });

  const handleSave = () => {
    let parsedSchema;
    try {
      parsedSchema = JSON.parse(formData.input_schema || '{}');
    } catch {
      window.alert('Input schema must be valid JSON.');
      return;
    }

    mutation.mutate({ ...formData, input_schema: parsedSchema });
  };

  const handleAddStep = async () => {
    if (isNew) {
      window.alert('Save the workflow first, then add steps.');
      return;
    }

    const name = window.prompt('Step name', 'New Step');
    if (!name) return;

    const stepType = window.prompt('Step type (task, approval, notification)', 'task') || 'task';
    const metadataText = window.prompt('Step metadata JSON', '{}') || '{}';

    let metadata;
    try {
      metadata = JSON.parse(metadataText);
    } catch {
      window.alert('Metadata must be valid JSON');
      return;
    }

    await workflowApi.createStep(id, {
      name,
      step_type: stepType,
      order: steps.length + 1,
      metadata,
    });

    queryClient.invalidateQueries({ queryKey: ['workflow', id] });
  };

  const handleEditStep = async (step) => {
    const name = window.prompt('Step name', step.name);
    if (!name) return;

    const stepType = window.prompt('Step type (task, approval, notification)', step.step_type) || step.step_type;
    const metadataText = window.prompt('Step metadata JSON', JSON.stringify(step.metadata || {}, null, 2));
    if (metadataText === null) return;

    let metadata;
    try {
      metadata = JSON.parse(metadataText);
    } catch {
      window.alert('Metadata must be valid JSON');
      return;
    }

    await workflowApi.updateStep(step._id, { name, step_type: stepType, metadata, order: step.order });
    queryClient.invalidateQueries({ queryKey: ['workflow', id] });
  };

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Delete this step?')) return;
    await workflowApi.deleteStep(stepId);
    queryClient.invalidateQueries({ queryKey: ['workflow', id] });
    if (selectedStepId === stepId) setSelectedStepId(null);
  };

  const handleCreateRule = async () => {
    if (!selectedStep) return;
    setRuleError('');

    try {
      await workflowApi.createRule(selectedStep._id, {
        ...ruleDraft,
        next_step_id: ruleDraft.next_step_id || null,
      });
      setRuleDraft(defaultRuleDraft);
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
    } catch (error) {
      setRuleError(error?.response?.data?.message || 'Unable to create rule');
    }
  };

  const handleEditRule = async (rule) => {
    const priority = window.prompt('Priority', rule.priority);
    if (priority === null) return;
    const condition = window.prompt('Condition', rule.condition);
    if (condition === null) return;
    const nextStepId = window.prompt('Next Step ID (leave empty to end workflow)', rule.next_step_id || '');
    if (nextStepId === null) return;

    try {
      await workflowApi.updateRule(rule._id, {
        priority: Number(priority),
        condition,
        next_step_id: nextStepId || null,
        is_default: condition.trim().toUpperCase() === 'DEFAULT',
      });
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
    } catch (error) {
      window.alert(error?.response?.data?.message || 'Unable to update rule');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Delete this rule?')) return;
    await workflowApi.deleteRule(ruleId);
    queryClient.invalidateQueries({ queryKey: ['workflow', id] });
  };

  if (isLoading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h1 className="editor-title">{isNew ? 'Create Workflow' : 'Workflow Editor'}</h1>
        <button onClick={handleSave} className="btn-save" disabled={mutation.isPending}>
          <Save size={20} /> {mutation.isPending ? 'Saving...' : isNew ? 'Create Workflow' : 'Save as New Version'}
        </button>
      </div>

      <div className="editor-grid">
        <div className="editor-sidebar">
          <div className="settings-card">
            <h2 className="section-title">Workflow Settings</h2>
            <div className="form-field">
              <label className="field-label">Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="field-input" />
            </div>
            <div className="form-field">
              <label className="field-label">Input Schema (JSON)</label>
              <textarea rows={12} value={formData.input_schema} onChange={(e) => setFormData({ ...formData, input_schema: e.target.value })} className="field-input field-textarea" />
            </div>
          </div>

          {!isNew && selectedStep && (
            <div className="settings-card" style={{ marginTop: '16px' }}>
              <h2 className="section-title">Rule Editor</h2>
              <p style={{ color: 'var(--slate-500)', marginBottom: '12px' }}>Selected step: <strong>{selectedStep.name}</strong></p>
              <div className="form-field">
                <label className="field-label">Priority</label>
                <input type="number" className="field-input" value={ruleDraft.priority} onChange={(e) => setRuleDraft((prev) => ({ ...prev, priority: Number(e.target.value) }))} />
              </div>
              <div className="form-field">
                <label className="field-label">Condition</label>
                <input type="text" className="field-input" value={ruleDraft.condition} onChange={(e) => setRuleDraft((prev) => ({ ...prev, condition: e.target.value }))} placeholder="amount > 100 && country == 'US'" />
              </div>
              <div className="form-field">
                <label className="field-label">Next Step</label>
                <select className="field-input" value={ruleDraft.next_step_id} onChange={(e) => setRuleDraft((prev) => ({ ...prev, next_step_id: e.target.value }))}>
                  <option value="">End Workflow</option>
                  {steps.filter((step) => step._id !== selectedStep._id).map((step) => (
                    <option key={step._id} value={step._id}>{step.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={ruleDraft.is_default} onChange={(e) => setRuleDraft((prev) => ({ ...prev, is_default: e.target.checked, condition: e.target.checked ? 'DEFAULT' : '' }))} />
                <label className="field-label" style={{ margin: 0 }}>Mark as default rule</label>
              </div>
              {ruleError && <div style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{ruleError}</div>}
              <button className="btn-ghost-primary" onClick={handleCreateRule}>Add Rule</button>
            </div>
          )}
        </div>

        <div className="editor-main">
          <div className="steps-header">
            <h2 className="section-title" style={{ marginBottom: 0 }}>Steps & Rules</h2>
            <button onClick={handleAddStep} className="btn-ghost-primary"><Plus size={18} /> Add Step</button>
          </div>

          <div className="steps-list">
            {steps.map((step, idx) => (
              <div key={step._id} className="step-item">
                <div className="step-number">{idx + 1}</div>
                <div className="step-card-wrapper" style={{ border: selectedStepId === step._id ? '2px solid var(--primary-200)' : undefined, borderRadius: '18px' }} onClick={() => setSelectedStepId(step._id)}>
                  <StepCard
                    step={step}
                    onDelete={() => handleDeleteStep(step._id)}
                    onEdit={() => handleEditStep(step)}
                    onManageRules={() => setSelectedStepId(step._id)}
                  />
                  {selectedStepId === step._id && step.rules?.length > 0 && (
                    <div style={{ padding: '0 18px 18px' }}>
                      <h4 style={{ marginBottom: '10px' }}>Configured Rules</h4>
                      {step.rules.map((rule) => (
                        <div key={rule._id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr auto', gap: '10px', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--slate-100)' }}>
                          <span className="badge badge-info">P{rule.priority}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{rule.condition}</span>
                          <span>{steps.find((candidate) => candidate._id === String(rule.next_step_id) || candidate._id === rule.next_step_id)?.name || 'End Workflow'}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-icon-sm" onClick={() => handleEditRule(rule)}>Edit</button>
                            <button className="btn-icon-sm" onClick={() => handleDeleteRule(rule._id)}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {steps.length === 0 && <div className="empty-steps">No steps defined. Click “Add Step” to begin.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;

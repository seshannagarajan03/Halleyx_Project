import React from 'react';
import { Settings, GitBranch, Bell, Trash2, Pencil, ListTree } from 'lucide-react';
import './StepCard.css';

const StepCard = ({ step, onDelete, onEdit, onManageRules }) => {
  return (
    <div className="step-card">
      <div className="step-card-header">
        <div className="step-info-container">
          <div className="step-type-icon">
            {step.step_type === 'task' && <Settings size={20} />}
            {step.step_type === 'approval' && <GitBranch size={20} />}
            {step.step_type === 'notification' && <Bell size={20} />}
          </div>
          <div className="step-title-group">
            <h4 className="step-name">{step.name}</h4>
            <span className="step-type-label">{step.step_type}</span>
          </div>
        </div>
        <div className="step-actions">
          <button onClick={onEdit} className="btn-icon-sm" title="Edit step"><Pencil size={16} /></button>
          <button onClick={onDelete} className="btn-icon-sm" title="Delete step"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="step-metadata-section">
        <div className="metadata-label">
          <span>Metadata: </span>
          <span className="metadata-value">{JSON.stringify(step.metadata || {})}</span>
        </div>
      </div>

      <div className="step-card-footer">
        <div className="rules-indicator">
          <span className="rules-count">{step.rules?.length || 0} RULES</span>
          <button className="btn-manage-rules" onClick={onManageRules}>
            <ListTree size={14} /> Manage Rules
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepCard;

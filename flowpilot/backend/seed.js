const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');

const User = require('./models/User');
const Workflow = require('./models/Workflow');
const Step = require('./models/Step');
const Rule = require('./models/Rule');
const Execution = require('./models/Execution');

const expenseInputSchema = {
  employee_name: {
    type: 'string',
    required: true
  },
  employee_email: {
    type: 'string',
    required: true
  },
  department: {
    type: 'string',
    required: true,
    allowed_values: ['Finance', 'HR', 'Engineering', 'Operations', 'Sales']
  },
  expense_type: {
    type: 'string',
    required: true,
    allowed_values: ['Travel Reimbursement', 'Food', 'Accommodation', 'Office Supplies']
  },
  amount: {
    type: 'number',
    required: true
  },
  country: {
    type: 'string',
    required: true,
    allowed_values: ['IN', 'US', 'UK', 'SG']
  },
  priority: {
    type: 'string',
    required: true,
    allowed_values: ['High', 'Medium', 'Low']
  },
  submitted_at: {
    type: 'string',
    required: true
  }
};

const leaveInputSchema = {
  employee_name: {
    type: 'string',
    required: true
  },
  employee_email: {
    type: 'string',
    required: true
  },
  department: {
    type: 'string',
    required: true,
    allowed_values: ['Finance', 'HR', 'Engineering', 'Operations', 'Sales']
  },
  leave_type: {
    type: 'string',
    required: true,
    allowed_values: ['Sick Leave', 'Casual Leave', 'Vacation', 'Emergency Leave']
  },
  leave_days: {
    type: 'number',
    required: true
  },
  country: {
    type: 'string',
    required: true,
    allowed_values: ['IN', 'US', 'UK', 'SG']
  },
  priority: {
    type: 'string',
    required: true,
    allowed_values: ['High', 'Medium', 'Low']
  },
  submitted_at: {
    type: 'string',
    required: true
  }
};

const seedData = async () => {
  try {
    await connectDB();

    await Promise.all([
      Rule.deleteMany({}),
      Step.deleteMany({}),
      Execution.deleteMany({}),
      Workflow.deleteMany({}),
      User.deleteMany({})
    ]);

    const adminUser = await User.create({
      name: 'Operations Admin',
      email: 'admin@flowpilot.app',
      password: 'password123',
      role: 'admin'
    });

    const approverUser = await User.create({
      name: 'Workflow Approver',
      email: 'manager@flowpilot.app',
      password: 'password123',
      role: 'approver'
    });

    const expenseWorkflow = await Workflow.create({
      name: 'Expense Approval',
      version: 1,
      is_active: true,
      input_schema: expenseInputSchema,
      description: 'Expense approval workflow'
    });

    const expenseCheckStep = await Step.create({
      workflow_id: expenseWorkflow._id,
      name: 'Check Amount',
      step_type: 'task',
      order: 1,
      metadata: {
        description: 'Validate expense request and route based on amount'
      }
    });

    const expenseApprovalStep = await Step.create({
      workflow_id: expenseWorkflow._id,
      name: 'Manager Approval',
      step_type: 'approval',
      order: 2,
      metadata: {
        approver_role: 'approver'
      }
    });

    const expenseNotificationStep = await Step.create({
      workflow_id: expenseWorkflow._id,
      name: 'Send Notification',
      step_type: 'notification',
      order: 3,
      metadata: {
        recipient: '{{employee_email}}',
        message: 'Your expense request has been processed.'
      }
    });

    expenseWorkflow.start_step_id = expenseCheckStep._id;
    await expenseWorkflow.save();

    await Rule.create([
      {
        step_id: expenseCheckStep._id,
        priority: 1,
        condition: 'amount > 100',
        next_step_id: expenseApprovalStep._id,
        is_default: false
      },
      {
        step_id: expenseCheckStep._id,
        priority: 2,
        condition: 'DEFAULT',
        next_step_id: expenseNotificationStep._id,
        is_default: true
      },
      {
        step_id: expenseApprovalStep._id,
        priority: 1,
        condition: 'DEFAULT',
        next_step_id: expenseNotificationStep._id,
        is_default: true
      }
    ]);

    const leaveWorkflow = await Workflow.create({
      name: 'Leave Request Approval',
      version: 1,
      is_active: true,
      input_schema: leaveInputSchema,
      description: 'Leave request approval workflow'
    });

    const leaveValidationStep = await Step.create({
      workflow_id: leaveWorkflow._id,
      name: 'Validate Leave Request',
      step_type: 'task',
      order: 1,
      metadata: {
        description: 'Check leave duration and request details'
      }
    });

    const leaveApprovalStep = await Step.create({
      workflow_id: leaveWorkflow._id,
      name: 'Manager Approval',
      step_type: 'approval',
      order: 2,
      metadata: {
        approver_role: 'approver'
      }
    });

    const leaveNotificationStep = await Step.create({
      workflow_id: leaveWorkflow._id,
      name: 'HR Notification',
      step_type: 'notification',
      order: 3,
      metadata: {
        recipient: '{{employee_email}}',
        message: 'Your leave request has been reviewed.'
      }
    });

    leaveWorkflow.start_step_id = leaveValidationStep._id;
    await leaveWorkflow.save();

    await Rule.create([
      {
        step_id: leaveValidationStep._id,
        priority: 1,
        condition: 'leave_days > 3',
        next_step_id: leaveApprovalStep._id,
        is_default: false
      },
      {
        step_id: leaveValidationStep._id,
        priority: 2,
        condition: 'DEFAULT',
        next_step_id: leaveNotificationStep._id,
        is_default: true
      },
      {
        step_id: leaveApprovalStep._id,
        priority: 1,
        condition: 'DEFAULT',
        next_step_id: leaveNotificationStep._id,
        is_default: true
      }
    ]);

    console.log('Seed completed successfully');
    console.log('Demo admin: admin@flowpilot.app / password123');
    console.log('Demo approver: manager@flowpilot.app / password123');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

seedData();
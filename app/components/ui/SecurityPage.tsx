'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Table, Tag, Button, Space, Tabs, Badge, Progress, List, Timeline, Select, Input, Modal, Form, Checkbox, Radio, Tooltip, Empty, Spin } from 'antd';
import { 
  ShieldCheckIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  KeyIcon,
  FingerPrintIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  SecurityScanOutlined, 
  AuditOutlined, 
  FileProtectOutlined, 
  SafetyCertificateOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Search } = Input;

interface VulnerabilityItem {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  resource: string;
  description: string;
  cve?: string;
  discoveredAt: string;
  status: 'open' | 'fixed' | 'mitigated';
  recommendation: string;
}

interface ComplianceCheck {
  id: string;
  standard: string;
  category: string;
  control: string;
  status: 'passed' | 'failed' | 'warning';
  resources: number;
  lastChecked: string;
}

interface SecretItem {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  lastRotated: string;
  rotationDue: string;
  autoRotation: boolean;
  usedBy: string[];
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  ip: string;
}

const SecurityPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedCompliance, setSelectedCompliance] = useState('all');
  const [scanningVulnerabilities, setScanningVulnerabilities] = useState(false);
  const [rotateSecretModalVisible, setRotateSecretModalVisible] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<SecretItem | null>(null);
  const [policyEditorVisible, setPolicyEditorVisible] = useState(false);
  const [form] = Form.useForm();

  // Mock data
  const mockVulnerabilities: VulnerabilityItem[] = [
    {
      id: '1',
      severity: 'critical',
      type: 'Unencrypted Storage',
      resource: 'prod-s3-bucket',
      description: 'S3 bucket does not have encryption enabled',
      discoveredAt: '2025-01-10 09:00:00',
      status: 'open',
      recommendation: 'Enable default encryption on the S3 bucket'
    },
    {
      id: '2',
      severity: 'high',
      type: 'Open Security Group',
      resource: 'prod-sg-web',
      description: 'Security group allows unrestricted access on port 22',
      discoveredAt: '2025-01-09 14:30:00',
      status: 'open',
      recommendation: 'Restrict SSH access to specific IP ranges'
    },
    {
      id: '3',
      severity: 'medium',
      type: 'Outdated Runtime',
      resource: 'lambda-api-handler',
      description: 'Lambda function using deprecated Node.js 12.x runtime',
      cve: 'CVE-2024-1234',
      discoveredAt: '2025-01-08 10:15:00',
      status: 'mitigated',
      recommendation: 'Update to Node.js 18.x or later'
    },
    {
      id: '4',
      severity: 'low',
      type: 'Missing Tags',
      resource: 'dev-ec2-instance',
      description: 'EC2 instance missing required compliance tags',
      discoveredAt: '2025-01-07 16:45:00',
      status: 'fixed',
      recommendation: 'Add required tags: Owner, Environment, Project'
    }
  ];

  const mockComplianceChecks: ComplianceCheck[] = [
    {
      id: '1',
      standard: 'SOC 2',
      category: 'Access Control',
      control: 'AC-2: Account Management',
      status: 'passed',
      resources: 45,
      lastChecked: '2 hours ago'
    },
    {
      id: '2',
      standard: 'SOC 2',
      category: 'Encryption',
      control: 'SC-8: Transmission Confidentiality',
      status: 'failed',
      resources: 12,
      lastChecked: '2 hours ago'
    },
    {
      id: '3',
      standard: 'HIPAA',
      category: 'Physical Safeguards',
      control: '164.310(a)(1): Facility Access Controls',
      status: 'passed',
      resources: 8,
      lastChecked: '1 hour ago'
    },
    {
      id: '4',
      standard: 'HIPAA',
      category: 'Technical Safeguards',
      control: '164.312(a)(1): Access Control',
      status: 'warning',
      resources: 15,
      lastChecked: '1 hour ago'
    },
    {
      id: '5',
      standard: 'PCI-DSS',
      category: 'Network Security',
      control: '1.1: Firewall Configuration Standards',
      status: 'passed',
      resources: 22,
      lastChecked: '30 minutes ago'
    }
  ];

  const mockSecrets: SecretItem[] = [
    {
      id: '1',
      name: 'prod-db-password',
      type: 'Database Credential',
      createdAt: '2024-10-01',
      lastRotated: '2024-12-01',
      rotationDue: '2025-02-01',
      autoRotation: true,
      usedBy: ['prod-api-server', 'prod-worker']
    },
    {
      id: '2',
      name: 'api-key-external-service',
      type: 'API Key',
      createdAt: '2024-11-15',
      lastRotated: '2024-12-15',
      rotationDue: '2025-01-15',
      autoRotation: false,
      usedBy: ['integration-service']
    },
    {
      id: '3',
      name: 'ssl-certificate',
      type: 'SSL Certificate',
      createdAt: '2024-06-01',
      lastRotated: '2024-06-01',
      rotationDue: '2025-06-01',
      autoRotation: true,
      usedBy: ['load-balancer', 'cdn']
    }
  ];

  const mockAuditLogs: AuditLogItem[] = [
    {
      id: '1',
      timestamp: '2025-01-10 10:30:00',
      user: 'admin@company.com',
      action: 'CREATE_RESOURCE',
      resource: 'EC2 Instance i-1234567890',
      result: 'success',
      ip: '192.168.1.100'
    },
    {
      id: '2',
      timestamp: '2025-01-10 10:25:00',
      user: 'dev@company.com',
      action: 'MODIFY_SECURITY_GROUP',
      resource: 'sg-987654321',
      result: 'failure',
      ip: '192.168.1.101'
    },
    {
      id: '3',
      timestamp: '2025-01-10 10:20:00',
      user: 'service-account',
      action: 'READ_SECRET',
      resource: 'prod-db-password',
      result: 'success',
      ip: '10.0.0.5'
    }
  ];

  const vulnerabilityColumns = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const colors = {
          critical: 'red',
          high: 'orange',
          medium: 'gold',
          low: 'blue'
        };
        return <Tag color={colors[severity as keyof typeof colors]}>{severity.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Critical', value: 'critical' },
        { text: 'High', value: 'high' },
        { text: 'Medium', value: 'medium' },
        { text: 'Low', value: 'low' },
      ],
      onFilter: (value: any, record: VulnerabilityItem) => record.severity === value,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      render: (resource: string) => <Tag color="blue">{resource}</Tag>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'CVE',
      dataIndex: 'cve',
      key: 'cve',
      render: (cve: string) => cve ? <Tag color="purple">{cve}</Tag> : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          open: { color: 'red', icon: <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" /> },
          mitigated: { color: 'orange', icon: <ClockIcon className="w-4 h-4 inline mr-1" /> },
          fixed: { color: 'green', icon: <CheckCircleIcon className="w-4 h-4 inline mr-1" /> }
        };
        const { color, icon } = config[status as keyof typeof config];
        return <Tag color={color}>{icon}{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: VulnerabilityItem) => (
        <Space>
          <Button size="small" type="link">View Details</Button>
          {record.status === 'open' && <Button size="small" type="link" danger>Fix Now</Button>}
        </Space>
      )
    }
  ];

  const complianceColumns = [
    {
      title: 'Standard',
      dataIndex: 'standard',
      key: 'standard',
      render: (standard: string) => <Tag>{standard}</Tag>
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Control',
      dataIndex: 'control',
      key: 'control',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          passed: { color: 'green', icon: <CheckCircleOutlined /> },
          failed: { color: 'red', icon: <CloseCircleOutlined /> },
          warning: { color: 'orange', icon: <WarningOutlined /> }
        };
        const { color, icon } = config[status as keyof typeof config];
        return <Tag color={color} icon={icon}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Resources',
      dataIndex: 'resources',
      key: 'resources',
      render: (resources: number) => <Badge count={resources} showZero color="blue" />
    },
    {
      title: 'Last Checked',
      dataIndex: 'lastChecked',
      key: 'lastChecked',
      render: (lastChecked: string) => <span className="text-gray-500">{lastChecked}</span>
    }
  ];

  const secretColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <KeyIcon className="w-4 h-4" />
          <span className="font-medium">{name}</span>
        </Space>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type}</Tag>
    },
    {
      title: 'Last Rotated',
      dataIndex: 'lastRotated',
      key: 'lastRotated',
    },
    {
      title: 'Rotation Due',
      dataIndex: 'rotationDue',
      key: 'rotationDue',
      render: (date: string) => {
        const dueDate = new Date(date);
        const today = new Date();
        const isOverdue = dueDate < today;
        return <Tag color={isOverdue ? 'red' : 'green'}>{date}</Tag>;
      }
    },
    {
      title: 'Auto Rotation',
      dataIndex: 'autoRotation',
      key: 'autoRotation',
      render: (autoRotation: boolean) => (
        <Tag color={autoRotation ? 'green' : 'orange'}>
          {autoRotation ? 'Enabled' : 'Disabled'}
        </Tag>
      )
    },
    {
      title: 'Used By',
      dataIndex: 'usedBy',
      key: 'usedBy',
      render: (usedBy: string[]) => (
        <Tooltip title={usedBy.join(', ')}>
          <Badge count={usedBy.length} />
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: SecretItem) => (
        <Space>
          <Button 
            size="small" 
            icon={<ArrowPathIcon className="w-3 h-3" />}
            onClick={() => {
              setSelectedSecret(record);
              setRotateSecretModalVisible(true);
            }}
          >
            Rotate
          </Button>
          <Button size="small" type="link">View</Button>
        </Space>
      )
    }
  ];

  const auditColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user: string) => <Tag color="blue">{user}</Tag>
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      ellipsis: true,
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => (
        <Tag color={result === 'success' ? 'green' : 'red'}>
          {result === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {result.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'IP Address',
      dataIndex: 'ip',
      key: 'ip',
    }
  ];

  // Calculate statistics
  const vulnerabilityStats = {
    critical: mockVulnerabilities.filter(v => v.severity === 'critical' && v.status === 'open').length,
    high: mockVulnerabilities.filter(v => v.severity === 'high' && v.status === 'open').length,
    medium: mockVulnerabilities.filter(v => v.severity === 'medium' && v.status === 'open').length,
    low: mockVulnerabilities.filter(v => v.severity === 'low' && v.status === 'open').length,
  };

  const complianceScore = {
    passed: mockComplianceChecks.filter(c => c.status === 'passed').length,
    failed: mockComplianceChecks.filter(c => c.status === 'failed').length,
    warning: mockComplianceChecks.filter(c => c.status === 'warning').length,
    total: mockComplianceChecks.length
  };

  const compliancePercentage = Math.round((complianceScore.passed / complianceScore.total) * 100);

  const handleVulnerabilityScan = () => {
    setScanningVulnerabilities(true);
    setTimeout(() => {
      setScanningVulnerabilities(false);
      // Add new vulnerabilities to the list
    }, 3000);
  };

  const handleRotateSecret = () => {
    form.validateFields().then(values => {
      console.log('Rotating secret:', selectedSecret?.name, values);
      setRotateSecretModalVisible(false);
      form.resetFields();
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seguridad & Compliance</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Monitorea vulnerabilidades, compliance y gestiona la seguridad de tu infraestructura
            </p>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<ShieldCheckIcon className="w-4 h-4" />}
              loading={scanningVulnerabilities}
              onClick={handleVulnerabilityScan}
            >
              Scan Vulnerabilities
            </Button>
            <Button icon={<DocumentCheckIcon className="w-4 h-4" />} onClick={() => setPolicyEditorVisible(true)}>
              Policy Editor
            </Button>
          </Space>
        </div>

        {/* Security Overview */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">{vulnerabilityStats.critical}</div>
                <div className="text-sm text-gray-500 mt-1">Critical Vulnerabilities</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="text-center">
                <Progress
                  type="circle"
                  percent={compliancePercentage}
                  width={80}
                  strokeColor={compliancePercentage > 80 ? '#52c41a' : compliancePercentage > 60 ? '#faad14' : '#f5222d'}
                />
                <div className="text-sm text-gray-500 mt-2">Compliance Score</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">{mockSecrets.length}</div>
                <div className="text-sm text-gray-500 mt-1">Managed Secrets</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">
                  {mockAuditLogs.filter(l => l.result === 'success').length}
                </div>
                <div className="text-sm text-gray-500 mt-1">Successful Actions (24h)</div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <Tabs defaultActiveKey="vulnerabilities" type="card">
        <TabPane
          tab={
            <span>
              <Badge count={vulnerabilityStats.critical + vulnerabilityStats.high} offset={[10, 0]}>
                <SecurityScanOutlined className="mr-2" />
                Vulnerabilities
              </Badge>
            </span>
          }
          key="vulnerabilities"
        >
          <Card>
            <div className="mb-4">
              <Alert
                message="Security Scan Results"
                description={`Found ${vulnerabilityStats.critical} critical, ${vulnerabilityStats.high} high, ${vulnerabilityStats.medium} medium, and ${vulnerabilityStats.low} low severity vulnerabilities.`}
                type={vulnerabilityStats.critical > 0 ? "error" : vulnerabilityStats.high > 0 ? "warning" : "info"}
                showIcon
              />
            </div>
            <Table
              columns={vulnerabilityColumns}
              dataSource={mockVulnerabilities}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <FileProtectOutlined className="mr-2" />
              Compliance
            </span>
          }
          key="compliance"
        >
          <Card>
            <div className="mb-4">
              <Space className="w-full justify-between">
                <Select 
                  value={selectedCompliance} 
                  onChange={setSelectedCompliance}
                  style={{ width: 200 }}
                >
                  <Option value="all">All Standards</Option>
                  <Option value="soc2">SOC 2</Option>
                  <Option value="hipaa">HIPAA</Option>
                  <Option value="pci">PCI-DSS</Option>
                  <Option value="iso27001">ISO 27001</Option>
                </Select>
                <Button type="primary">Generate Compliance Report</Button>
              </Space>
            </div>
            <Table
              columns={complianceColumns}
              dataSource={mockComplianceChecks}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <SafetyCertificateOutlined className="mr-2" />
              Secrets Management
            </span>
          }
          key="secrets"
        >
          <Card>
            <div className="mb-4">
              <Alert
                message="Secret Rotation Policy"
                description="All secrets should be rotated every 90 days. Enable auto-rotation for critical secrets."
                type="info"
                showIcon
              />
            </div>
            <Table
              columns={secretColumns}
              dataSource={mockSecrets}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <AuditOutlined className="mr-2" />
              Audit Logs
            </span>
          }
          key="audit"
        >
          <Card>
            <div className="mb-4">
              <Space>
                <Search placeholder="Search logs..." style={{ width: 300 }} />
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Actions</Option>
                  <Option value="create">Create</Option>
                  <Option value="modify">Modify</Option>
                  <Option value="delete">Delete</Option>
                  <Option value="read">Read</Option>
                </Select>
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Results</Option>
                  <Option value="success">Success</Option>
                  <Option value="failure">Failure</Option>
                </Select>
              </Space>
            </div>
            <Table
              columns={auditColumns}
              dataSource={mockAuditLogs}
              rowKey="id"
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Rotate Secret Modal */}
      <Modal
        title={`Rotate Secret: ${selectedSecret?.name}`}
        visible={rotateSecretModalVisible}
        onOk={handleRotateSecret}
        onCancel={() => {
          setRotateSecretModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Alert
            message="Secret Rotation"
            description="Rotating this secret will generate a new value. Make sure to update all services using this secret."
            type="warning"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="confirmRotation"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('Please confirm the rotation')),
              },
            ]}
          >
            <Checkbox>
              I understand that rotating this secret may temporarily affect services using it
            </Checkbox>
          </Form.Item>
          <Form.Item name="notifyServices" valuePropName="checked">
            <Checkbox>Notify affected services after rotation</Checkbox>
          </Form.Item>
          <Form.Item name="rotationMethod" label="Rotation Method" initialValue="automatic">
            <Radio.Group>
              <Radio value="automatic">Automatic (recommended)</Radio>
              <Radio value="manual">Manual</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* Policy Editor Modal */}
      <Modal
        title="Security Policy Editor"
        visible={policyEditorVisible}
        onCancel={() => setPolicyEditorVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setPolicyEditorVisible(false)}>Cancel</Button>,
          <Button key="validate" type="default">Validate</Button>,
          <Button key="save" type="primary">Save Policy</Button>,
        ]}
      >
        <Alert
          message="Policy as Code"
          description="Define security policies that will be automatically enforced across your infrastructure."
          type="info"
          showIcon
          className="mb-4"
        />
        <TextArea
          rows={15}
          placeholder="# Example Security Policy
          
policy 'encryption-at-rest' {
  rule {
    resource_types = ['aws_s3_bucket', 'aws_rds_instance']
    condition {
      encryption_enabled = true
    }
    severity = 'critical'
  }
}

policy 'public-access' {
  rule {
    resource_types = ['aws_s3_bucket']
    condition {
      public_access_block = true
    }
    severity = 'high'
  }
}"
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>
    </div>
  );
};

export default SecurityPage;

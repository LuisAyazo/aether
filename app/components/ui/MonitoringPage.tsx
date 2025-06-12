'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Alert, Table, Tag, Select, DatePicker, Button, Space, Tabs, Badge, Tooltip, Empty, Spin, Timeline, Switch } from 'antd';
// Comentado temporalmente hasta instalar recharts
// import { 
//   LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell 
// } from 'recharts';
import { 
  CloudIcon, 
  ServerIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BellIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CpuChipIcon,
  CircleStackIcon,
  BoltIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { RocketOutlined, AlertOutlined, DatabaseOutlined, ApiOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface MetricData {
  time: string;
  cpu: number;
  memory: number;
  network: number;
  storage: number;
}

interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  resource: string;
  message: string;
  timestamp: string;
  status: 'active' | 'resolved';
}

interface ResourceHealth {
  name: string;
  type: string;
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastCheck: string;
}

const MonitoringPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');

  // Mock data - en producción vendría de la API
  const mockMetricData: MetricData[] = Array.from({ length: 20 }, (_, i) => ({
    time: `${i}:00`,
    cpu: Math.floor(Math.random() * 40) + 30,
    memory: Math.floor(Math.random() * 30) + 50,
    network: Math.floor(Math.random() * 100) + 100,
    storage: Math.floor(Math.random() * 20) + 60,
  }));

  const mockAlerts: AlertItem[] = [
    {
      id: '1',
      severity: 'critical',
      resource: 'prod-api-server',
      message: 'CPU usage above 90% for 5 minutes',
      timestamp: '2025-01-10 10:30:00',
      status: 'active'
    },
    {
      id: '2',
      severity: 'warning',
      resource: 'staging-database',
      message: 'Slow query detected',
      timestamp: '2025-01-10 09:45:00',
      status: 'active'
    },
    {
      id: '3',
      severity: 'info',
      resource: 'dev-loadbalancer',
      message: 'Configuration updated',
      timestamp: '2025-01-10 08:00:00',
      status: 'resolved'
    }
  ];

  const mockResourceHealth: ResourceHealth[] = [
    { name: 'API Gateway', type: 'AWS API Gateway', status: 'healthy', uptime: 99.99, lastCheck: '1 min ago' },
    { name: 'Main Database', type: 'AWS RDS', status: 'healthy', uptime: 99.95, lastCheck: '2 min ago' },
    { name: 'Cache Cluster', type: 'AWS ElastiCache', status: 'warning', uptime: 98.5, lastCheck: '1 min ago' },
    { name: 'Load Balancer', type: 'AWS ALB', status: 'healthy', uptime: 100, lastCheck: '3 min ago' },
    { name: 'Storage Bucket', type: 'AWS S3', status: 'healthy', uptime: 100, lastCheck: '5 min ago' },
  ];

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Refresh data
        console.log('Refreshing monitoring data...');
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const statusDistribution = [
    { name: 'Healthy', value: 12, color: '#52c41a' },
    { name: 'Warning', value: 3, color: '#faad14' },
    { name: 'Critical', value: 1, color: '#f5222d' },
  ];

  const alertColumns = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const colors = {
          critical: 'red',
          warning: 'orange',
          info: 'blue'
        };
        return <Tag color={colors[severity as keyof typeof colors]}>{severity.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'red' : 'green'}>
          {status === 'active' ? 'Active' : 'Resolved'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AlertItem) => (
        <Space>
          <Button size="small" type="link">View</Button>
          {record.status === 'active' && <Button size="small" type="link">Resolve</Button>}
        </Space>
      )
    }
  ];

  const healthColumns = [
    {
      title: 'Resource',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-medium">{name}</span>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          healthy: { color: 'green', icon: <CheckCircleIcon className="w-4 h-4 inline mr-1" /> },
          warning: { color: 'orange', icon: <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" /> },
          critical: { color: 'red', icon: <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" /> }
        };
        const { color, icon } = config[status as keyof typeof config];
        return <Tag color={color}>{icon}{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Uptime',
      dataIndex: 'uptime',
      key: 'uptime',
      render: (uptime: number) => (
        <Progress 
          percent={uptime} 
          size="small" 
          status={uptime > 99 ? 'success' : uptime > 95 ? 'normal' : 'exception'}
          format={percent => `${percent}%`}
        />
      )
    },
    {
      title: 'Last Check',
      dataIndex: 'lastCheck',
      key: 'lastCheck',
      render: (lastCheck: string) => <span className="text-gray-500">{lastCheck}</span>
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monitoreo de Infraestructura</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Visualiza el estado y rendimiento de tus recursos en tiempo real
            </p>
          </div>
          <Space>
            <Select value={selectedEnvironment} onChange={setSelectedEnvironment} style={{ width: 120 }}>
              <Option value="all">Todos</Option>
              <Option value="production">Producción</Option>
              <Option value="staging">Staging</Option>
              <Option value="development">Desarrollo</Option>
            </Select>
            <Select value={timeRange} onChange={setTimeRange} style={{ width: 100 }}>
              <Option value="1h">1 hora</Option>
              <Option value="6h">6 horas</Option>
              <Option value="24h">24 horas</Option>
              <Option value="7d">7 días</Option>
            </Select>
            <Switch
              checkedChildren="Auto Refresh"
              unCheckedChildren="Manual"
              checked={autoRefresh}
              onChange={setAutoRefresh}
            />
            <Button type="primary" icon={<BellIcon className="w-4 h-4" />}>
              Configure Alerts
            </Button>
          </Space>
        </div>

        {/* Overview Stats */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Resources"
                value={16}
                prefix={<ServerIcon className="w-5 h-5" />}
                suffix={
                  <span className="text-sm text-green-500">
                    <ArrowUpIcon className="w-3 h-3 inline" /> 2
                  </span>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Alerts"
                value={2}
                prefix={<ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Avg CPU Usage"
                value={45}
                suffix="%"
                prefix={<CpuChipIcon className="w-5 h-5" />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Uptime"
                value={99.95}
                suffix="%"
                prefix={<SignalIcon className="w-5 h-5 text-green-500" />}
                precision={2}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <Tabs defaultActiveKey="metrics" type="card">
        <TabPane
          tab={
            <span>
              <ChartBarIcon className="w-4 h-4 inline mr-2" />
              Métricas
            </span>
          }
          key="metrics"
        >
          <Row gutter={[16, 16]}>
            {/* CPU & Memory Chart */}
            <Col span={12}>
              <Card title="CPU & Memory Usage" size="small">
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description="Instalar recharts para ver gráficos" />
                </div>
              </Card>
            </Col>

            {/* Network Chart */}
            <Col span={12}>
              <Card title="Network Traffic (MB/s)" size="small">
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description="Instalar recharts para ver gráficos" />
                </div>
              </Card>
            </Col>

            {/* Storage Usage */}
            <Col span={12}>
              <Card title="Storage Usage" size="small">
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description="Instalar recharts para ver gráficos" />
                </div>
              </Card>
            </Col>

            {/* Status Distribution */}
            <Col span={12}>
              <Card title="Resource Status Distribution" size="small">
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description="Instalar recharts para ver gráficos" />
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <Badge count={2} offset={[10, 0]}>
                <AlertOutlined className="mr-2" />
                Alertas
              </Badge>
            </span>
          }
          key="alerts"
        >
          <Card>
            <Table
              columns={alertColumns}
              dataSource={mockAlerts}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <DatabaseOutlined className="mr-2" />
              Health Check
            </span>
          }
          key="health"
        >
          <Card>
            <div className="mb-4">
              <Alert
                message="System Health Status"
                description="15 of 16 resources are operating normally. 1 resource requires attention."
                type="warning"
                showIcon
              />
            </div>
            <Table
              columns={healthColumns}
              dataSource={mockResourceHealth}
              rowKey="name"
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <ApiOutlined className="mr-2" />
              Logs
            </span>
          }
          key="logs"
        >
          <Card>
            <Timeline mode="left">
              <Timeline.Item color="red" label="2025-01-10 10:30:00">
                [ERROR] API Gateway: 502 Bad Gateway - Backend service unavailable
              </Timeline.Item>
              <Timeline.Item color="orange" label="2025-01-10 10:25:00">
                [WARN] Database: Slow query detected (&gt;5s) - SELECT * FROM users...
              </Timeline.Item>
              <Timeline.Item color="blue" label="2025-01-10 10:20:00">
                [INFO] Load Balancer: Health check passed for all targets
              </Timeline.Item>
              <Timeline.Item color="green" label="2025-01-10 10:15:00">
                [SUCCESS] Auto-scaling: New instance launched successfully
              </Timeline.Item>
              <Timeline.Item color="blue" label="2025-01-10 10:10:00">
                [INFO] S3 Bucket: 1000 objects uploaded successfully
              </Timeline.Item>
            </Timeline>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default MonitoringPage;

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Select, DatePicker, Button, Space, Tabs, Progress, Alert, Tooltip, Empty, Radio, Divider, Badge } from 'antd';
import { 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartPieIcon,
  CalculatorIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowDownTrayIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  DollarOutlined,
  LineChartOutlined,
  PieChartOutlined,
  CloudOutlined,
  DatabaseOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface CostByService {
  service: string;
  icon: React.ReactNode;
  currentMonth: number;
  lastMonth: number;
  change: number;
  percentage: number;
  trend: 'up' | 'down';
}

interface CostOptimization {
  id: string;
  type: string;
  resource: string;
  currentCost: number;
  potentialSaving: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface BudgetAlert {
  id: string;
  name: string;
  budget: number;
  spent: number;
  percentage: number;
  status: 'ok' | 'warning' | 'critical';
  period: string;
}

interface CostForecast {
  month: string;
  actual?: number;
  forecast: number;
  budget: number;
}

interface ResourceCost {
  id: string;
  name: string;
  type: string;
  service: string;
  environment: string;
  monthlyCost: number;
  utilization: number;
  tags: Record<string, string>;
}

const CostsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [timeRange, setTimeRange] = useState('current_month');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  // Mock data
  const totalCurrentMonth = 12543.67;
  const totalLastMonth = 11234.89;
  const monthlyChange = ((totalCurrentMonth - totalLastMonth) / totalLastMonth) * 100;

  const costByService: CostByService[] = [
    {
      service: 'AWS EC2',
      icon: <CloudOutlined />,
      currentMonth: 3456.78,
      lastMonth: 3123.45,
      change: 333.33,
      percentage: 10.67,
      trend: 'up'
    },
    {
      service: 'AWS RDS',
      icon: <DatabaseOutlined />,
      currentMonth: 2890.12,
      lastMonth: 2678.90,
      change: 211.22,
      percentage: 7.88,
      trend: 'up'
    },
    {
      service: 'AWS S3',
      icon: <SaveOutlined />,
      currentMonth: 1567.89,
      lastMonth: 1789.23,
      change: -221.34,
      percentage: -12.37,
      trend: 'down'
    },
    {
      service: 'AWS Lambda',
      icon: <ThunderboltOutlined />,
      currentMonth: 890.45,
      lastMonth: 756.32,
      change: 134.13,
      percentage: 17.73,
      trend: 'up'
    },
    {
      service: 'AWS CloudFront',
      icon: <ApiOutlined />,
      currentMonth: 456.78,
      lastMonth: 489.12,
      change: -32.34,
      percentage: -6.61,
      trend: 'down'
    }
  ];

  const costOptimizations: CostOptimization[] = [
    {
      id: '1',
      type: 'Right-sizing',
      resource: 'prod-api-server (t3.2xlarge)',
      currentCost: 456.78,
      potentialSaving: 234.56,
      effort: 'low',
      impact: 'high',
      recommendation: 'Downgrade to t3.xlarge based on 40% average CPU utilization'
    },
    {
      id: '2',
      type: 'Reserved Instances',
      resource: 'RDS Production Cluster',
      currentCost: 1234.56,
      potentialSaving: 456.78,
      effort: 'low',
      impact: 'high',
      recommendation: 'Purchase 1-year reserved instances for 37% savings'
    },
    {
      id: '3',
      type: 'Unused Resources',
      resource: 'dev-test-cluster',
      currentCost: 234.56,
      potentialSaving: 234.56,
      effort: 'low',
      impact: 'medium',
      recommendation: 'Terminate unused EKS cluster in dev environment'
    },
    {
      id: '4',
      type: 'Storage Optimization',
      resource: 'backup-s3-bucket',
      currentCost: 567.89,
      potentialSaving: 123.45,
      effort: 'medium',
      impact: 'medium',
      recommendation: 'Move infrequent access data to Glacier'
    },
    {
      id: '5',
      type: 'Spot Instances',
      resource: 'batch-processing-fleet',
      currentCost: 890.12,
      potentialSaving: 567.89,
      effort: 'high',
      impact: 'high',
      recommendation: 'Use Spot instances for batch processing workloads'
    }
  ];

  const budgetAlerts: BudgetAlert[] = [
    {
      id: '1',
      name: 'Monthly Total Budget',
      budget: 15000,
      spent: 12543.67,
      percentage: 83.6,
      status: 'warning',
      period: 'January 2025'
    },
    {
      id: '2',
      name: 'Production Environment',
      budget: 10000,
      spent: 8934.56,
      percentage: 89.3,
      status: 'warning',
      period: 'January 2025'
    },
    {
      id: '3',
      name: 'Development Environment',
      budget: 3000,
      spent: 2123.45,
      percentage: 70.8,
      status: 'ok',
      period: 'January 2025'
    },
    {
      id: '4',
      name: 'Q1 2025 Budget',
      budget: 45000,
      spent: 12543.67,
      percentage: 27.9,
      status: 'ok',
      period: 'Q1 2025'
    }
  ];

  const costForecast: CostForecast[] = [
    { month: 'Oct 2024', actual: 9876.54, forecast: 9500.00, budget: 10000 },
    { month: 'Nov 2024', actual: 10234.56, forecast: 10000.00, budget: 10000 },
    { month: 'Dec 2024', actual: 11234.89, forecast: 11000.00, budget: 12000 },
    { month: 'Jan 2025', actual: 12543.67, forecast: 12000.00, budget: 15000 },
    { month: 'Feb 2025', forecast: 13200.00, budget: 15000 },
    { month: 'Mar 2025', forecast: 13800.00, budget: 15000 },
    { month: 'Apr 2025', forecast: 14200.00, budget: 15000 }
  ];

  const resourceCosts: ResourceCost[] = [
    {
      id: '1',
      name: 'prod-api-server-1',
      type: 'EC2 Instance',
      service: 'AWS EC2',
      environment: 'Production',
      monthlyCost: 456.78,
      utilization: 45,
      tags: { team: 'backend', project: 'api' }
    },
    {
      id: '2',
      name: 'prod-database-primary',
      type: 'RDS Instance',
      service: 'AWS RDS',
      environment: 'Production',
      monthlyCost: 1234.56,
      utilization: 78,
      tags: { team: 'database', project: 'core' }
    },
    {
      id: '3',
      name: 'static-assets-bucket',
      type: 'S3 Bucket',
      service: 'AWS S3',
      environment: 'Production',
      monthlyCost: 234.56,
      utilization: 92,
      tags: { team: 'frontend', project: 'web' }
    }
  ];

  // Calculate total potential savings
  const totalPotentialSavings = costOptimizations.reduce((sum, opt) => sum + opt.potentialSaving, 0);

  const serviceColumns = [
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (service: string, record: CostByService) => (
        <Space>
          {record.icon}
          <span className="font-medium">{service}</span>
        </Space>
      )
    },
    {
      title: 'Current Month',
      dataIndex: 'currentMonth',
      key: 'currentMonth',
      render: (value: number) => `$${value.toFixed(2)}`,
      sorter: (a: CostByService, b: CostByService) => a.currentMonth - b.currentMonth,
    },
    {
      title: 'Last Month',
      dataIndex: 'lastMonth',
      key: 'lastMonth',
      render: (value: number) => `$${value.toFixed(2)}`
    },
    {
      title: 'Change',
      dataIndex: 'change',
      key: 'change',
      render: (value: number, record: CostByService) => (
        <Space>
          {record.trend === 'up' ? 
            <ArrowTrendingUpIcon className="w-4 h-4 text-red-500" /> : 
            <ArrowTrendingDownIcon className="w-4 h-4 text-green-500" />
          }
          <span className={record.trend === 'up' ? 'text-red-500' : 'text-green-500'}>
            ${Math.abs(value).toFixed(2)} ({record.percentage.toFixed(1)}%)
          </span>
        </Space>
      )
    },
    {
      title: '% of Total',
      key: 'percentage',
      render: (_: any, record: CostByService) => {
        const percentage = (record.currentMonth / totalCurrentMonth) * 100;
        return (
          <Progress 
            percent={percentage} 
            size="small" 
            format={percent => `${percent?.toFixed(1)}%`}
          />
        );
      }
    }
  ];

  const optimizationColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      ellipsis: true,
    },
    {
      title: 'Current Cost',
      dataIndex: 'currentCost',
      key: 'currentCost',
      render: (value: number) => `$${value.toFixed(2)}/mo`,
      sorter: (a: CostOptimization, b: CostOptimization) => a.currentCost - b.currentCost,
    },
    {
      title: 'Potential Saving',
      dataIndex: 'potentialSaving',
      key: 'potentialSaving',
      render: (value: number) => (
        <span className="text-green-600 font-medium">
          -${value.toFixed(2)}/mo
        </span>
      ),
      sorter: (a: CostOptimization, b: CostOptimization) => a.potentialSaving - b.potentialSaving,
    },
    {
      title: 'Effort',
      dataIndex: 'effort',
      key: 'effort',
      render: (effort: string) => {
        const colors = {
          low: 'green',
          medium: 'orange',
          high: 'red'
        };
        return <Tag color={colors[effort as keyof typeof colors]}>{effort.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Impact',
      dataIndex: 'impact',
      key: 'impact',
      render: (impact: string) => {
        const colors = {
          low: 'blue',
          medium: 'orange',
          high: 'green'
        };
        return <Tag color={colors[impact as keyof typeof colors]}>{impact.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Recommendation',
      dataIndex: 'recommendation',
      key: 'recommendation',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CostOptimization) => (
        <Space>
          <Button size="small" type="primary">Apply</Button>
          <Button size="small" type="link">Details</Button>
        </Space>
      )
    }
  ];

  const resourceColumns = [
    {
      title: 'Resource Name',
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
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
    },
    {
      title: 'Environment',
      dataIndex: 'environment',
      key: 'environment',
      render: (env: string) => <Tag color={env === 'Production' ? 'red' : 'blue'}>{env}</Tag>
    },
    {
      title: 'Monthly Cost',
      dataIndex: 'monthlyCost',
      key: 'monthlyCost',
      render: (value: number) => `$${value.toFixed(2)}`,
      sorter: (a: ResourceCost, b: ResourceCost) => a.monthlyCost - b.monthlyCost,
    },
    {
      title: 'Utilization',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (value: number) => (
        <Progress 
          percent={value} 
          size="small"
          status={value < 20 ? 'exception' : value < 50 ? 'normal' : 'success'}
        />
      )
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: Record<string, string>) => (
        <Space size="small">
          {Object.entries(tags).map(([key, value]) => (
            <Tag key={key} color="blue">{`${key}:${value}`}</Tag>
          ))}
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centro de Costos</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Analiza, optimiza y controla los gastos de tu infraestructura cloud
            </p>
          </div>
          <Space>
            <Select value={selectedEnvironment} onChange={setSelectedEnvironment} style={{ width: 120 }}>
              <Option value="all">Todos</Option>
              <Option value="production">Producción</Option>
              <Option value="staging">Staging</Option>
              <Option value="development">Desarrollo</Option>
            </Select>
            <Select value={timeRange} onChange={setTimeRange} style={{ width: 150 }}>
              <Option value="current_month">Mes Actual</Option>
              <Option value="last_month">Mes Anterior</Option>
              <Option value="last_3_months">Últimos 3 Meses</Option>
              <Option value="last_6_months">Últimos 6 Meses</Option>
              <Option value="ytd">Año Actual</Option>
            </Select>
            <Button icon={<ArrowDownTrayIcon className="w-4 h-4" />}>
              Export Report
            </Button>
          </Space>
        </div>

        {/* Cost Overview */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Costo Total (Mes Actual)"
                value={totalCurrentMonth}
                precision={2}
                prefix="$"
                suffix={
                  <span className={`text-sm ${monthlyChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {monthlyChange > 0 ? <RiseOutlined /> : <FallOutlined />}
                    {Math.abs(monthlyChange).toFixed(1)}%
                  </span>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Proyección Mensual"
                value={13200}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Ahorros Potenciales"
                value={totalPotentialSavings}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Presupuesto Usado"
                value={83.6}
                precision={1}
                suffix="%"
                prefix={<Progress type="circle" percent={83.6} width={50} strokeColor="#faad14" />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <Tabs defaultActiveKey="overview" type="card">
        <TabPane
          tab={
            <span>
              <PieChartOutlined className="mr-2" />
              Overview
            </span>
          }
          key="overview"
        >
          <Row gutter={[16, 16]}>
            {/* Cost by Service */}
            <Col span={14}>
              <Card title="Costos por Servicio" size="small">
                <Table
                  columns={serviceColumns}
                  dataSource={costByService}
                  rowKey="service"
                  pagination={false}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <strong>Total</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>${totalCurrentMonth.toFixed(2)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <strong>${totalLastMonth.toFixed(2)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <strong className={monthlyChange > 0 ? 'text-red-500' : 'text-green-500'}>
                          ${Math.abs(totalCurrentMonth - totalLastMonth).toFixed(2)}
                        </strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <strong>100%</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              </Card>
            </Col>

            {/* Budget Alerts */}
            <Col span={10}>
              <Card title="Alertas de Presupuesto" size="small">
                {budgetAlerts.map(alert => (
                  <div key={alert.id} className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{alert.name}</span>
                      <Tag color={
                        alert.status === 'critical' ? 'red' : 
                        alert.status === 'warning' ? 'orange' : 'green'
                      }>
                        {alert.percentage.toFixed(1)}%
                      </Tag>
                    </div>
                    <Progress 
                      percent={alert.percentage} 
                      strokeColor={
                        alert.status === 'critical' ? '#f5222d' : 
                        alert.status === 'warning' ? '#fa8c16' : '#52c41a'
                      }
                      showInfo={false}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>${alert.spent.toFixed(2)}</span>
                      <span>${alert.budget.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <Badge count={costOptimizations.length} offset={[10, 0]}>
                <SaveOutlined className="mr-2" />
                Optimizaciones
              </Badge>
            </span>
          }
          key="optimizations"
        >
          <Card>
            <div className="mb-4">
              <Alert
                message={`${costOptimizations.length} Oportunidades de Ahorro Identificadas`}
                description={`Ahorro potencial total: $${totalPotentialSavings.toFixed(2)}/mes ($${(totalPotentialSavings * 12).toFixed(2)}/año)`}
                type="success"
                showIcon
                icon={<LightBulbIcon className="w-5 h-5" />}
              />
            </div>
            <Table
              columns={optimizationColumns}
              dataSource={costOptimizations}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <DatabaseOutlined className="mr-2" />
              Recursos
            </span>
          }
          key="resources"
        >
          <Card>
            <div className="mb-4">
              <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)}>
                <Radio.Button value="summary">Vista Resumen</Radio.Button>
                <Radio.Button value="detailed">Vista Detallada</Radio.Button>
              </Radio.Group>
            </div>
            <Table
              columns={resourceColumns}
              dataSource={resourceCosts}
              rowKey="id"
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <LineChartOutlined className="mr-2" />
              Forecast
            </span>
          }
          key="forecast"
        >
          <Card>
            <Alert
              message="Proyección de Costos"
              description="Basado en el consumo histórico y las tendencias actuales"
              type="info"
              showIcon
              className="mb-4"
            />
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty description="Gráfico de proyección disponible al instalar recharts" />
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default CostsPage;

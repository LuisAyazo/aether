'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Input, Button, Tag, List, Progress, Alert, Tooltip, Select, Tabs, Space, Badge, Empty, Divider } from 'antd';
import { 
  BookOpenIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  PlayCircleIcon,
  CodeBracketIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  DocumentDuplicateIcon,
  CloudArrowDownIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
  FireIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import {
  FileTextOutlined,
  PlayCircleOutlined,
  CodeOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  CloudDownloadOutlined,
  QuestionCircleOutlined,
  TeamOutlined,
  RocketOutlined,
  TrophyOutlined,
  BookOutlined,
  VideoCameraOutlined,
  ApiOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Search } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'documentation' | 'tutorial' | 'template' | 'guide' | 'video' | 'certification';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  tags: string[];
  popular?: boolean;
  new?: boolean;
  icon?: React.ReactNode;
}

interface Template {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: string;
  downloads: number;
  rating: number;
  tags: string[];
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
  progress: number;
  category: string;
}

interface Certification {
  id: string;
  name: string;
  provider: string;
  level: string;
  estimatedTime: string;
  price: string;
  description: string;
}

const ResourceCenterPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Mock data
  const featuredResources: Resource[] = [
    {
      id: '1',
      title: 'Guía Completa de Terraform',
      description: 'Aprende desde cero hasta nivel avanzado con ejemplos prácticos',
      category: 'Infrastructure as Code',
      type: 'guide',
      difficulty: 'beginner',
      duration: '8 horas',
      tags: ['terraform', 'iac', 'aws'],
      popular: true,
      icon: <CodeBracketIcon className="w-5 h-5" />
    },
    {
      id: '2',
      title: 'AWS Well-Architected Framework',
      description: 'Mejores prácticas para diseñar infraestructura en AWS',
      category: 'Best Practices',
      type: 'documentation',
      difficulty: 'intermediate',
      tags: ['aws', 'architecture', 'best-practices'],
      new: true,
      icon: <AcademicCapIcon className="w-5 h-5" />
    },
    {
      id: '3',
      title: 'Kubernetes en Producción',
      description: 'Tutorial completo para desplegar y gestionar K8s',
      category: 'Containers',
      type: 'tutorial',
      difficulty: 'advanced',
      duration: '12 horas',
      tags: ['kubernetes', 'containers', 'orchestration'],
      popular: true,
      icon: <PlayCircleIcon className="w-5 h-5" />
    }
  ];

  const templates: Template[] = [
    {
      id: '1',
      name: 'Microservices Architecture',
      description: 'Plantilla completa para arquitectura de microservicios con EKS, API Gateway y RDS',
      provider: 'AWS',
      category: 'Applications',
      downloads: 1234,
      rating: 4.8,
      tags: ['microservices', 'eks', 'api-gateway']
    },
    {
      id: '2',
      name: 'Serverless Web App',
      description: 'Aplicación web serverless con Lambda, DynamoDB y CloudFront',
      provider: 'AWS',
      category: 'Serverless',
      downloads: 892,
      rating: 4.6,
      tags: ['serverless', 'lambda', 'dynamodb']
    },
    {
      id: '3',
      name: 'Data Lake Foundation',
      description: 'Infraestructura base para un data lake con S3, Glue y Athena',
      provider: 'AWS',
      category: 'Analytics',
      downloads: 567,
      rating: 4.7,
      tags: ['data-lake', 's3', 'analytics']
    },
    {
      id: '4',
      name: 'High Availability Web Stack',
      description: 'Stack web de alta disponibilidad con auto-scaling y multi-AZ',
      provider: 'AWS',
      category: 'Web',
      downloads: 2341,
      rating: 4.9,
      tags: ['high-availability', 'auto-scaling', 'web']
    }
  ];

  const tutorials: Tutorial[] = [
    {
      id: '1',
      title: 'Introducción a InfraUX',
      description: 'Aprende los conceptos básicos de la plataforma',
      duration: '30 min',
      difficulty: 'beginner',
      completed: true,
      progress: 100,
      category: 'Getting Started'
    },
    {
      id: '2',
      title: 'Creando tu Primer Diagrama',
      description: 'Tutorial paso a paso para crear diagramas de infraestructura',
      duration: '45 min',
      difficulty: 'beginner',
      completed: true,
      progress: 100,
      category: 'Getting Started'
    },
    {
      id: '3',
      title: 'Desplegando con Terraform',
      description: 'Genera y despliega código Terraform desde tus diagramas',
      duration: '1 hora',
      difficulty: 'intermediate',
      completed: false,
      progress: 60,
      category: 'Deployment'
    },
    {
      id: '4',
      title: 'Optimización de Costos',
      description: 'Estrategias avanzadas para reducir costos en cloud',
      duration: '2 horas',
      difficulty: 'advanced',
      completed: false,
      progress: 0,
      category: 'Optimization'
    }
  ];

  const certifications: Certification[] = [
    {
      id: '1',
      name: 'InfraUX Certified Professional',
      provider: 'InfraUX',
      level: 'Professional',
      estimatedTime: '3 meses',
      price: '$299',
      description: 'Certificación oficial que valida tus conocimientos en InfraUX'
    },
    {
      id: '2',
      name: 'AWS Solutions Architect',
      provider: 'Amazon',
      level: 'Associate',
      estimatedTime: '3-6 meses',
      price: '$300',
      description: 'Diseña sistemas distribuidos en AWS'
    },
    {
      id: '3',
      name: 'Terraform Associate',
      provider: 'HashiCorp',
      level: 'Associate',
      estimatedTime: '2-3 meses',
      price: '$70',
      description: 'Domina Infrastructure as Code con Terraform'
    }
  ];

  const quickLinks = [
    { title: 'Getting Started Guide', icon: <RocketOutlined />, color: 'blue' },
    { title: 'API Documentation', icon: <ApiOutlined />, color: 'green' },
    { title: 'Video Tutorials', icon: <VideoCameraOutlined />, color: 'purple' },
    { title: 'Community Forum', icon: <TeamOutlined />, color: 'orange' },
    { title: 'Best Practices', icon: <TrophyOutlined />, color: 'gold' },
    { title: 'FAQ', icon: <QuestionCircleOutlined />, color: 'red' }
  ];

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'green',
      intermediate: 'orange',
      advanced: 'red'
    };
    return colors[difficulty as keyof typeof colors] || 'default';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      documentation: <FileTextOutlined />,
      tutorial: <PlayCircleOutlined />,
      template: <CodeOutlined />,
      guide: <BookOutlined />,
      video: <VideoCameraOutlined />,
      certification: <SafetyCertificateOutlined />
    };
    return icons[type as keyof typeof icons] || <FileTextOutlined />;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centro de Recursos</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Documentación, tutoriales, plantillas y mejores prácticas
            </p>
          </div>
          <Space>
            <Search
              placeholder="Buscar recursos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: 300 }}
              prefix={<MagnifyingGlassIcon className="w-4 h-4" />}
            />
            <Select value={selectedCategory} onChange={setSelectedCategory} style={{ width: 150 }}>
              <Option value="all">Todas las categorías</Option>
              <Option value="documentation">Documentación</Option>
              <Option value="tutorials">Tutoriales</Option>
              <Option value="templates">Plantillas</Option>
              <Option value="guides">Guías</Option>
            </Select>
          </Space>
        </div>

        {/* Quick Links */}
        <Row gutter={16}>
          {quickLinks.map((link, index) => (
            <Col key={index} span={4}>
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                styles={{ body: { padding: '16px' } }}
              >
                <div className="text-center">
                  <div className={`text-3xl mb-2 text-${link.color}-500`}>
                    {link.icon}
                  </div>
                  <p className="text-sm font-medium">{link.title}</p>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Main Content */}
      <Tabs defaultActiveKey="overview" type="card">
        <TabPane
          tab={
            <span>
              <BookOpenIcon className="w-4 h-4 inline mr-2" />
              Overview
            </span>
          }
          key="overview"
        >
          <Row gutter={[16, 16]}>
            {/* Featured Resources */}
            <Col span={16}>
              <Card title="Recursos Destacados" size="small">
                <List
                  dataSource={featuredResources}
                  renderItem={resource => (
                    <List.Item
                      actions={[
                        <Button key="view" type="primary" size="small">Ver</Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                            {resource.icon || getTypeIcon(resource.type)}
                          </div>
                        }
                        title={
                          <Space>
                            <span className="font-medium">{resource.title}</span>
                            {resource.popular && <Badge count={<FireIcon className="w-3 h-3" />} style={{ backgroundColor: '#ff4d4f' }} />}
                            {resource.new && <Tag color="green">Nuevo</Tag>}
                          </Space>
                        }
                        description={
                          <div>
                            <p className="text-gray-500 mb-2">{resource.description}</p>
                            <Space>
                              <Tag>{resource.category}</Tag>
                              {resource.difficulty && (
                                <Tag color={getDifficultyColor(resource.difficulty)}>
                                  {resource.difficulty}
                                </Tag>
                              )}
                              {resource.duration && (
                                <span className="text-xs text-gray-400">
                                  <ClockIcon className="w-3 h-3 inline mr-1" />
                                  {resource.duration}
                                </span>
                              )}
                            </Space>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            {/* Learning Progress */}
            <Col span={8}>
              <Card title="Tu Progreso" size="small" className="mb-4">
                <div className="text-center mb-4">
                  <Progress type="circle" percent={75} />
                  <p className="mt-2 text-gray-500">15 de 20 tutoriales completados</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Nivel Actual</span>
                    <Tag color="orange">Intermedio</Tag>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Puntos XP</span>
                    <Badge count={1250} style={{ backgroundColor: '#52c41a' }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Certificaciones</span>
                    <span className="font-medium">2</span>
                  </div>
                </div>
              </Card>

              <Card title="Recursos Recientes" size="small">
                <List
                  size="small"
                  dataSource={[
                    'Terraform Best Practices',
                    'AWS Cost Optimization',
                    'Kubernetes Security Guide',
                    'CI/CD Pipeline Setup'
                  ]}
                  renderItem={item => (
                    <List.Item>
                      <span className="text-sm">{item}</span>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <CodeBracketIcon className="w-4 h-4 inline mr-2" />
              Plantillas
            </span>
          }
          key="templates"
        >
          <Card>
            <div className="mb-4">
              <Alert
                message="Plantillas de Infraestructura"
                description="Usa estas plantillas pre-configuradas como punto de partida para tus proyectos"
                type="info"
                showIcon
              />
            </div>
            <Row gutter={[16, 16]}>
              {templates.map(template => (
                <Col key={template.id} span={12}>
                  <Card>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{template.name}</h3>
                        <p className="text-gray-500 text-sm mt-1">{template.description}</p>
                      </div>
                      <Tag color="blue">{template.provider}</Tag>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <Space>
                        <span className="text-sm text-gray-500">
                          <CloudArrowDownIcon className="w-4 h-4 inline mr-1" />
                          {template.downloads} descargas
                        </span>
                        <span className="text-sm text-gray-500">
                          <StarIcon className="w-4 h-4 inline mr-1 text-yellow-500" />
                          {template.rating}
                        </span>
                      </Space>
                    </div>
                    <div className="mb-3">
                      {template.tags.map(tag => (
                        <Tag key={tag} className="mb-1">{tag}</Tag>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Button type="primary" block>Usar Plantilla</Button>
                      <Button block>Vista Previa</Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <PlayCircleIcon className="w-4 h-4 inline mr-2" />
              Tutoriales
            </span>
          }
          key="tutorials"
        >
          <Card>
            <List
              dataSource={tutorials}
              renderItem={tutorial => (
                <List.Item
                  actions={[
                    tutorial.completed ? 
                      <Button key="review" type="default">Revisar</Button> :
                      <Button key="continue" type="primary">
                        {tutorial.progress > 0 ? 'Continuar' : 'Comenzar'}
                      </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      tutorial.completed ?
                        <Badge count={<CheckIcon className="w-3 h-3" />} style={{ backgroundColor: '#52c41a' }}>
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <PlayCircleOutlined className="text-xl text-green-600" />
                          </div>
                        </Badge> :
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <PlayCircleOutlined className="text-xl text-blue-600" />
                        </div>
                    }
                    title={
                      <Space>
                        <span className="font-medium">{tutorial.title}</span>
                        <Tag color={getDifficultyColor(tutorial.difficulty)}>
                          {tutorial.difficulty}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <p className="text-gray-500 mb-2">{tutorial.description}</p>
                        <div className="flex items-center space-x-4">
                          <span className="text-xs text-gray-400">
                            <ClockIcon className="w-3 h-3 inline mr-1" />
                            {tutorial.duration}
                          </span>
                          <Progress percent={tutorial.progress} size="small" style={{ width: 100 }} />
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <AcademicCapIcon className="w-4 h-4 inline mr-2" />
              Certificaciones
            </span>
          }
          key="certifications"
        >
          <Card>
            <Alert
              message="Certificaciones Profesionales"
              description="Valida tus conocimientos y avanza en tu carrera con certificaciones reconocidas"
              type="success"
              showIcon
              className="mb-4"
            />
            <Row gutter={[16, 16]}>
              {certifications.map(cert => (
                <Col key={cert.id} span={8}>
                  <Card>
                    <div className="text-center mb-4">
                      <SafetyCertificateOutlined className="text-5xl text-blue-500 mb-3" />
                      <h3 className="font-medium text-lg">{cert.name}</h3>
                      <p className="text-gray-500">{cert.provider}</p>
                    </div>
                    <Divider />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Nivel:</span>
                        <span className="font-medium">{cert.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duración:</span>
                        <span className="font-medium">{cert.estimatedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Precio:</span>
                        <span className="font-medium text-green-600">{cert.price}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">{cert.description}</p>
                    <Button type="primary" block className="mt-4">
                      Más Información
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ResourceCenterPage;

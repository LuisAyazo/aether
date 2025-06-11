'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Avatar, Tag, Tabs, List, Progress, Alert, Tooltip, Select, Switch, Badge, Spin, message, Row, Col } from 'antd';
import { 
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  StopIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import {
  RobotOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined,
  HistoryOutlined,
  SaveOutlined,
  FileTextOutlined,
  CodeOutlined,
  SafetyCertificateOutlined,
  CloudOutlined,
  ApiOutlined,
  DollarOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status?: 'streaming' | 'completed' | 'error';
  suggestions?: string[];
  codeBlocks?: CodeBlock[];
}

interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  prompt: string;
}

interface SavedChat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [activeTab, setActiveTab] = useState('chat');
  const [autoSuggestions, setAutoSuggestions] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Optimizar Infraestructura',
      description: 'Analiza y sugiere mejoras para tu infraestructura actual',
      icon: <WrenchScrewdriverIcon className="w-5 h-5" />,
      category: 'optimization',
      prompt: 'Analiza mi infraestructura actual y sugiere optimizaciones de costos y rendimiento'
    },
    {
      id: '2',
      title: 'Generar Terraform',
      description: 'Genera código Terraform basado en tu diagrama',
      icon: <CodeBracketIcon className="w-5 h-5" />,
      category: 'code',
      prompt: 'Genera código Terraform para mi diagrama actual con mejores prácticas'
    },
    {
      id: '3',
      title: 'Revisión de Seguridad',
      description: 'Evalúa vulnerabilidades y sugiere mejoras de seguridad',
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      category: 'security',
      prompt: 'Realiza una revisión de seguridad de mi infraestructura y sugiere mejoras'
    },
    {
      id: '4',
      title: 'Documentar Arquitectura',
      description: 'Genera documentación técnica de tu arquitectura',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      category: 'documentation',
      prompt: 'Genera documentación técnica detallada de mi arquitectura actual'
    },
    {
      id: '5',
      title: 'Análisis de Costos',
      description: 'Analiza y proyecta costos de tu infraestructura',
      icon: <DollarOutlined className="text-lg" />,
      category: 'costs',
      prompt: 'Analiza los costos actuales y proyecta el gasto mensual de mi infraestructura'
    },
    {
      id: '6',
      title: 'Migración a Cloud',
      description: 'Planifica la migración de on-premise a cloud',
      icon: <CloudOutlined className="text-lg" />,
      category: 'migration',
      prompt: 'Ayúdame a planificar la migración de mi infraestructura on-premise a AWS'
    }
  ];

  const savedChats: SavedChat[] = [
    {
      id: '1',
      title: 'Optimización de Costos AWS',
      lastMessage: 'Implementa instancias reservadas para reducir costos...',
      timestamp: '2025-01-09',
      messageCount: 15
    },
    {
      id: '2',
      title: 'Arquitectura Microservicios',
      lastMessage: 'Para implementar microservicios, considera usar EKS...',
      timestamp: '2025-01-08',
      messageCount: 23
    },
    {
      id: '3',
      title: 'Setup CI/CD Pipeline',
      lastMessage: 'Usa GitHub Actions con AWS CodeDeploy para...',
      timestamp: '2025-01-07',
      messageCount: 18
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);

    // Simular respuesta del asistente
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Analizando tu solicitud...\n\nBasándome en tu infraestructura actual, aquí están mis recomendaciones:\n\n1. **Optimización de Recursos**: He detectado que algunas instancias EC2 están sobredimensionadas.\n2. **Mejoras de Seguridad**: Recomiendo implementar AWS Security Hub.\n3. **Reducción de Costos**: Puedes ahorrar hasta 40% usando instancias Spot para cargas de trabajo no críticas.',
        timestamp: new Date().toLocaleTimeString(),
        status: 'completed',
        suggestions: [
          'Ver detalles de optimización',
          'Implementar cambios sugeridos',
          'Generar reporte completo'
        ],
        codeBlocks: [
          {
            language: 'terraform',
            code: `resource "aws_instance" "optimized_web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium" # Reducido de t3.xlarge
  
  tags = {
    Name        = "OptimizedWebServer"
    Environment = "Production"
  }
}`,
            filename: 'optimized_ec2.tf'
          }
        ]
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsStreaming(false);
    }, 2000);
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.prompt);
    setActiveTab('chat');
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    message.success('Código copiado al portapapeles');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';

    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-3xl`}>
          <Avatar
            size={36}
            className={`${isUser ? 'ml-3' : 'mr-3'}`}
            style={{
              backgroundColor: isUser ? '#1890ff' : '#722ed1',
            }}
          >
            {isUser ? 'U' : <RobotOutlined />}
          </Avatar>
          <div>
            <Card
              className={`${isUser ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}
              styles={{ body: { padding: '12px 16px' } }}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              
              {message.codeBlocks && message.codeBlocks.map((block, index) => (
                <div key={index} className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">{block.filename || block.language}</span>
                    <Button
                      size="small"
                      icon={copiedCode === block.code ? <CheckIcon className="w-3 h-3" /> : <ClipboardDocumentIcon className="w-3 h-3" />}
                      onClick={() => copyToClipboard(block.code)}
                    >
                      {copiedCode === block.code ? 'Copiado' : 'Copiar'}
                    </Button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto">
                    <code className="text-xs">{block.code}</code>
                  </pre>
                </div>
              ))}

              {message.suggestions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      size="small"
                      onClick={() => setInputValue(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </Card>
            <span className="text-xs text-gray-500 mt-1 inline-block">
              {message.timestamp}
              {message.status === 'streaming' && (
                <span className="ml-2">
                  <Spin size="small" />
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <SparklesIcon className="w-7 h-7 mr-2 text-purple-500" />
              AI Assistant
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Tu asistente inteligente para infraestructura como código
            </p>
          </div>
          <Space>
            <Select value={selectedModel} onChange={setSelectedModel} style={{ width: 150 }}>
              <Option value="gpt-4">GPT-4 Turbo</Option>
              <Option value="gpt-3.5">GPT-3.5 Turbo</Option>
              <Option value="claude">Claude 3</Option>
              <Option value="llama">Llama 2</Option>
            </Select>
            <Switch
              checkedChildren="Auto-sugerencias"
              unCheckedChildren="Manual"
              checked={autoSuggestions}
              onChange={setAutoSuggestions}
            />
          </Space>
        </div>

        {/* Model Info */}
        <Alert
          message={
            <Space>
              <ThunderboltOutlined />
              <span>Modelo activo: {selectedModel}</span>
              <Tag color="green">Online</Tag>
              <span className="text-gray-500">• Contexto: 128k tokens • Respuesta &lt; 2s</span>
            </Space>
          }
          type="info"
          showIcon={false}
          className="mb-4"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs activeKey={activeTab} onChange={setActiveTab} className="h-full">
          <TabPane
            tab={
              <span>
                <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-2" />
                Chat
              </span>
            }
            key="chat"
          >
            <div className="flex h-full">
              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <SparklesIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ¡Hola! Soy tu AI Assistant
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Puedo ayudarte con tu infraestructura, generar código, optimizar costos, 
                        revisar seguridad y mucho más. ¿En qué puedo ayudarte hoy?
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map(renderMessage)}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <TextArea
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onPressEnter={e => {
                        if (!e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Escribe tu pregunta o solicitud..."
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      disabled={isStreaming}
                      className="flex-1"
                    />
                    <Button
                      type="primary"
                      icon={isStreaming ? <StopIcon className="w-4 h-4" /> : <PaperAirplaneIcon className="w-4 h-4" />}
                      onClick={isStreaming ? () => setIsStreaming(false) : handleSendMessage}
                      loading={isStreaming}
                      size="large"
                    >
                      {isStreaming ? 'Detener' : 'Enviar'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sidebar - Quick Actions */}
              <div className="w-80 ml-4">
                <Card title="Acciones Rápidas" size="small" className="h-full">
                  <List
                    dataSource={quickActions}
                    renderItem={action => (
                      <List.Item
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2"
                        onClick={() => handleQuickAction(action)}
                      >
                        <List.Item.Meta
                          avatar={
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                              {action.icon}
                            </div>
                          }
                          title={<span className="text-sm font-medium">{action.title}</span>}
                          description={<span className="text-xs">{action.description}</span>}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </div>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <HistoryOutlined className="mr-2" />
                Historial
              </span>
            }
            key="history"
          >
            <Card>
              <List
                dataSource={savedChats}
                renderItem={chat => (
                  <List.Item
                    actions={[
                      <Button key="load" type="link">Cargar</Button>,
                      <Button key="delete" type="link" danger>Eliminar</Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined className="text-2xl text-gray-400" />}
                      title={chat.title}
                      description={
                        <div>
                          <p className="text-gray-500">{chat.lastMessage}</p>
                          <Space className="mt-1">
                            <span className="text-xs text-gray-400">{chat.timestamp}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">{chat.messageCount} mensajes</span>
                          </Space>
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
                <LightBulbIcon className="w-4 h-4 inline mr-2" />
                Capacidades
              </span>
            }
            key="capabilities"
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card>
                  <div className="text-center">
                    <CodeOutlined className="text-4xl text-blue-500 mb-3" />
                    <h3 className="font-medium mb-2">Generación de Código</h3>
                    <p className="text-sm text-gray-500">
                      Terraform, CloudFormation, Pulumi, Ansible y más
                    </p>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <div className="text-center">
                    <SafetyCertificateOutlined className="text-4xl text-green-500 mb-3" />
                    <h3 className="font-medium mb-2">Análisis de Seguridad</h3>
                    <p className="text-sm text-gray-500">
                      Detección de vulnerabilidades y mejores prácticas
                    </p>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <div className="text-center">
                    <DollarOutlined className="text-4xl text-yellow-500 mb-3" />
                    <h3 className="font-medium mb-2">Optimización de Costos</h3>
                    <p className="text-sm text-gray-500">
                      Análisis y recomendaciones para reducir gastos
                    </p>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <div className="text-center">
                    <CloudOutlined className="text-4xl text-purple-500 mb-3" />
                    <h3 className="font-medium mb-2">Multi-Cloud</h3>
                    <p className="text-sm text-gray-500">
                      Soporte para AWS, Azure, GCP y más
                    </p>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <div className="text-center">
                    <ApiOutlined className="text-4xl text-orange-500 mb-3" />
                    <h3 className="font-medium mb-2">Integración API</h3>
                    <p className="text-sm text-gray-500">
                      Conecta con tus herramientas y servicios
                    </p>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <div className="text-center">
                    <FileTextOutlined className="text-4xl text-indigo-500 mb-3" />
                    <h3 className="font-medium mb-2">Documentación</h3>
                    <p className="text-sm text-gray-500">
                      Genera documentación técnica automáticamente
                    </p>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default AIAssistantPage;

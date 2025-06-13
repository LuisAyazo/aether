'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Select, Button, Space, Alert, Badge, Tooltip, Switch } from 'antd';
import { CodeOutlined, EyeOutlined, CopyOutlined, DownloadOutlined, CheckOutlined } from '@ant-design/icons';
import { IaCCodeService } from "../../services/iacCodeService";
import type { Node } from 'reactflow';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const { TabPane } = Tabs;
const { Option } = Select;

interface CodePreviewPanelProps {
  nodes: Node[];
  isVisible?: boolean;
  onClose?: () => void;
}

const CodePreviewPanel: React.FC<CodePreviewPanelProps> = ({ nodes, isVisible = true, onClose }) => {
  const [activeProvider, setActiveProvider] = useState<'terraform' | 'cloudformation' | 'pulumi'>('terraform');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (autoRefresh && nodes.length > 0) {
      generateCode();
      validateCode();
    }
  }, [nodes, activeProvider, autoRefresh]);

  const generateCode = () => {
    let code = '';
    switch (activeProvider) {
      case 'terraform':
        code = generateTerraformCodePreview(nodes);
        break;
      case 'cloudformation':
        code = generateCloudFormationCodePreview(nodes);
        break;
      case 'pulumi':
        code = generatePulumiCodePreview(nodes);
        break;
    }
    setGeneratedCode(code);
  };

  // Funciones simples de generación de código para preview
  const generateTerraformCodePreview = (nodes: any[]) => {
    let code = '# Generated Terraform Configuration\n\n';
    
    nodes.forEach((node: any) => {
      if (node.data?.resourceType) {
        const resourceName = node.data.label || 'resource';
        const resourceType = node.data.resourceType;
        
        if (resourceType === 'ec2Instance') {
          code += `resource "aws_instance" "${resourceName.toLowerCase().replace(/\s+/g, '_')}" {\n`;
          code += `  ami           = "${node.data.ami || 'ami-0c55b159cbfafe1f0'}"\n`;
          code += `  instance_type = "${node.data.instanceType || 't2.micro'}"\n`;
          code += `\n  tags = {\n`;
          code += `    Name = "${resourceName}"\n`;
          code += `  }\n}\n\n`;
        } else if (resourceType === 's3Bucket') {
          code += `resource "aws_s3_bucket" "${resourceName.toLowerCase().replace(/\s+/g, '_')}" {\n`;
          code += `  bucket = "${node.data.bucketName || resourceName.toLowerCase().replace(/\s+/g, '-')}"\n`;
          if (node.data.encryption) {
            code += `\n  server_side_encryption_configuration {\n`;
            code += `    rule {\n`;
            code += `      apply_server_side_encryption_by_default {\n`;
            code += `        sse_algorithm = "AES256"\n`;
            code += `      }\n`;
            code += `    }\n`;
            code += `  }\n`;
          }
          code += `\n  tags = {\n`;
          code += `    Name = "${resourceName}"\n`;
          code += `  }\n}\n\n`;
        } else if (resourceType === 'rdsInstance') {
          code += `resource "aws_db_instance" "${resourceName.toLowerCase().replace(/\s+/g, '_')}" {\n`;
          code += `  allocated_storage    = ${node.data.allocatedStorage || 20}\n`;
          code += `  engine              = "${node.data.engine || 'mysql'}"\n`;
          code += `  engine_version      = "${node.data.engineVersion || '8.0'}"\n`;
          code += `  instance_class      = "${node.data.instanceClass || 'db.t3.micro'}"\n`;
          code += `  db_name             = "${node.data.dbName || 'mydb'}"\n`;
          code += `  username            = "${node.data.username || 'admin'}"\n`;
          code += `  password            = var.db_password\n`;
          if (node.data.backupRetention) {
            code += `  backup_retention_period = ${node.data.backupRetention}\n`;
          }
          code += `\n  tags = {\n`;
          code += `    Name = "${resourceName}"\n`;
          code += `  }\n}\n\n`;
        }
      }
    });
    
    return code || '# No resources defined';
  };

  const generateCloudFormationCodePreview = (nodes: any[]) => {
    const template: any = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Generated CloudFormation Template',
      Resources: {}
    };
    
    nodes.forEach((node: any) => {
      if (node.data?.resourceType) {
        const resourceName = node.data.label || 'Resource';
        const resourceId = resourceName.replace(/\s+/g, '');
        const resourceType = node.data.resourceType;
        
        if (resourceType === 'ec2Instance') {
          template.Resources[resourceId] = {
            Type: 'AWS::EC2::Instance',
            Properties: {
              ImageId: node.data.ami || 'ami-0c55b159cbfafe1f0',
              InstanceType: node.data.instanceType || 't2.micro',
              Tags: [{
                Key: 'Name',
                Value: resourceName
              }]
            }
          };
        } else if (resourceType === 's3Bucket') {
          template.Resources[resourceId] = {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: node.data.bucketName || resourceName.toLowerCase().replace(/\s+/g, '-'),
              Tags: [{
                Key: 'Name',
                Value: resourceName
              }]
            }
          };
          if (node.data.encryption) {
            template.Resources[resourceId].Properties.BucketEncryption = {
              ServerSideEncryptionConfiguration: [{
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256'
                }
              }]
            };
          }
        }
      }
    });
    
    return JSON.stringify(template, null, 2);
  };

  const generatePulumiCodePreview = (nodes: any[]) => {
    let code = `import * as pulumi from "@pulumi/pulumi";\n`;
    code += `import * as aws from "@pulumi/aws";\n\n`;
    
    nodes.forEach((node: any) => {
      if (node.data?.resourceType) {
        const resourceName = node.data.label || 'resource';
        const varName = resourceName.replace(/\s+/g, '').toLowerCase();
        const resourceType = node.data.resourceType;
        
        if (resourceType === 'ec2Instance') {
          code += `const ${varName} = new aws.ec2.Instance("${resourceName}", {\n`;
          code += `    ami: "${node.data.ami || 'ami-0c55b159cbfafe1f0'}",\n`;
          code += `    instanceType: "${node.data.instanceType || 't2.micro'}",\n`;
          code += `    tags: {\n`;
          code += `        Name: "${resourceName}",\n`;
          code += `    },\n`;
          code += `});\n\n`;
        } else if (resourceType === 's3Bucket') {
          code += `const ${varName} = new aws.s3.Bucket("${resourceName}", {\n`;
          code += `    bucket: "${node.data.bucketName || resourceName.toLowerCase().replace(/\s+/g, '-')}",\n`;
          if (node.data.encryption) {
            code += `    serverSideEncryptionConfiguration: {\n`;
            code += `        rule: {\n`;
            code += `            applyServerSideEncryptionByDefault: {\n`;
            code += `                sseAlgorithm: "AES256",\n`;
            code += `            },\n`;
            code += `        },\n`;
            code += `    },\n`;
          }
          code += `    tags: {\n`;
          code += `        Name: "${resourceName}",\n`;
          code += `    },\n`;
          code += `});\n\n`;
        }
      }
    });
    
    return code || '// No resources defined';
  };

  const validateCode = () => {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Validaciones básicas
    nodes.forEach((node: any) => {
      if (node.data?.resourceType === 'ec2Instance' && !node.data.instanceType) {
        errors.push(`EC2 Instance "${node.data.label}" no tiene tipo de instancia definido`);
      }
      if (node.data?.resourceType === 's3Bucket' && !node.data.encryption) {
        suggestions.push(`Considera habilitar encriptación para el bucket S3 "${node.data.label}"`);
      }
      if (node.data?.resourceType === 'rdsInstance' && !node.data.backupRetention) {
        suggestions.push(`Configura retención de backups para RDS "${node.data.label}"`);
      }
    });

    setValidationErrors(errors);
    setSuggestions(suggestions);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infrastructure.${activeProvider === 'cloudformation' ? 'yaml' : activeProvider === 'pulumi' ? 'ts' : 'tf'}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!isVisible) return null;

  return (
    <Card 
      title={
        <div className="flex justify-between items-center">
          <Space>
            <CodeOutlined />
            <span>Preview de Código</span>
            <Badge count={nodes.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
          <Space>
            <Switch
              checkedChildren="Auto"
              unCheckedChildren="Manual"
              checked={autoRefresh}
              onChange={setAutoRefresh}
              size="small"
            />
            {onClose && (
              <Button size="small" onClick={onClose} type="text">✕</Button>
            )}
          </Space>
        </div>
      }
      size="small"
      className="h-full"
      styles={{ body: { padding: 0, height: 'calc(100% - 55px)', overflow: 'hidden' } }}
    >
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <Select value={activeProvider} onChange={setActiveProvider} style={{ width: 150 }}>
            <Option value="terraform">Terraform</Option>
            <Option value="cloudformation">CloudFormation</Option>
            <Option value="pulumi">Pulumi</Option>
          </Select>
          <Space>
            <Tooltip title={copied ? 'Copiado!' : 'Copiar código'}>
              <Button 
                icon={copied ? <CheckOutlined /> : <CopyOutlined />} 
                size="small"
                onClick={copyToClipboard}
              />
            </Tooltip>
            <Tooltip title="Descargar archivo">
              <Button icon={<DownloadOutlined />} size="small" onClick={downloadCode} />
            </Tooltip>
          </Space>
        </div>

        {/* Validaciones y Sugerencias */}
        {(validationErrors.length > 0 || suggestions.length > 0) && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            {validationErrors.length > 0 && (
              <Alert
                message="Errores de validación"
                description={
                  <ul className="list-disc pl-4">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                }
                type="error"
                showIcon
                closable
                className="mb-2"
              />
            )}
            {suggestions.length > 0 && (
              <Alert
                message="Sugerencias de mejores prácticas"
                description={
                  <ul className="list-disc pl-4">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                }
                type="warning"
                showIcon
                closable
              />
            )}
          </div>
        )}

        {/* Code Preview */}
        <div className="flex-1 overflow-auto">
          {generatedCode ? (
            <SyntaxHighlighter
              language={activeProvider === 'terraform' ? 'hcl' : activeProvider === 'cloudformation' ? 'yaml' : 'typescript'}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: '#1e1e1e',
                fontSize: '0.875rem',
                height: '100%',
              }}
              showLineNumbers
            >
              {generatedCode}
            </SyntaxHighlighter>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <CodeOutlined className="text-4xl mb-2" />
                <p>Agrega recursos al diagrama para ver el código generado</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CodePreviewPanel;

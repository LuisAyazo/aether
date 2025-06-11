'use client';

import React from 'react';
import { Button } from 'antd';
import GeneratedCodeModal from './components/ui/GeneratedCodeModal';

export default function TestGeneratedCodeModal() {
  const [visible, setVisible] = React.useState(false);

  // Datos de prueba con nodos mockeados
  const mockNodes = [
    {
      id: 'node-1',
      type: 'aws_s3_bucket',
      position: { x: 100, y: 100 },
      data: {
        provider: 'aws',
        resourceType: 's3_bucket',
        category: 'storage',
        label: 'Mi Bucket S3',
        dynamicProperties: {
          bucketName: 'mi-bucket-test',
          versioning: true,
          publicAccess: false,
          encryption: {
            algorithm: 'AES256'
          }
        }
      }
    },
    {
      id: 'node-2',
      type: 'aws_ec2_instance',
      position: { x: 300, y: 100 },
      data: {
        provider: 'aws',
        resourceType: 'ec2_instance',
        category: 'compute',
        label: 'Mi Servidor EC2',
        config: {
          instanceType: 't3.medium',
          ami: 'ami-12345678',
          monitoring: true
        }
      }
    },
    {
      id: 'node-3',
      type: 'gcp_compute_instance',
      position: { x: 500, y: 100 },
      data: {
        provider: 'gcp',
        resourceType: 'compute_instance',
        category: 'compute',
        label: 'Mi VM GCP',
        config: {
          machineType: 'n1-standard-2',
          zone: 'us-central1-a'
        }
      }
    },
    {
      id: 'node-4',
      type: 'group',
      position: { x: 100, y: 300 },
      data: {
        label: 'Grupo de Recursos'
      }
    },
    {
      id: 'node-5',
      type: 'textNode',
      position: { x: 300, y: 300 },
      data: {
        text: 'Esta es una nota'
      }
    }
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test del GeneratedCodeModal</h1>
      <p className="mb-4">Este es un test con nodos mockeados para verificar el funcionamiento del modal.</p>
      
      <Button 
        type="primary" 
        size="large"
        onClick={() => setVisible(true)}
      >
        Abrir Modal de Código Generado
      </Button>

      <GeneratedCodeModal
        visible={visible}
        onClose={() => setVisible(false)}
        nodes={mockNodes}
      />

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Nodos de prueba:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(mockNodes, null, 2)}
        </pre>
      </div>
    </div>
  );
}

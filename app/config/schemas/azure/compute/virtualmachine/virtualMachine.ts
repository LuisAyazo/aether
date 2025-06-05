import { z } from 'zod';
import { azureVirtualMachineFields } from './virtualMachineFields';
import { generateAzureVirtualMachineTemplates } from './virtualMachineTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

const OsDiskSchema = z.object({
  caching: z.enum(['ReadWrite', 'ReadOnly', 'None']),
  storage_account_type: z.enum(['Standard_LRS', 'StandardSSD_LRS', 'Premium_LRS', 'StandardSSD_ZRS', 'Premium_ZRS']),
  managed_disk_type: z.string().optional(), // Puede ser alias o diferente
});

const SourceImageReferenceSchema = z.object({
  publisher: z.string().min(1),
  offer: z.string().min(1),
  sku: z.string().min(1),
  version: z.string().min(1),
}).optional();

export const AzureVirtualMachineSchema = z.object({
  name: z.string().min(1, "El nombre de la VM es obligatorio."),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  size: z.string().min(1, "El tamaño de la VM es obligatorio."),
  admin_username: z.string().min(1, "El nombre de usuario admin es obligatorio."),
  admin_password: z.string().optional(), // Opcional si se usan claves SSH
  network_interface_ids: z.string().min(1, "Se requiere al menos un ID de interfaz de red."),
  os_disk: OsDiskSchema,
  source_image_reference: SourceImageReferenceSchema,
  // source_image_id: z.string().optional(), // Alternativa a source_image_reference
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type AzureVirtualMachineConfig = z.infer<typeof AzureVirtualMachineSchema>;

export function generateDefaultAzureVirtualMachineConfig(): AzureVirtualMachineConfig {
  return {
    name: 'myazvm',
    resource_group_name: 'my-resources',
    location: 'East US',
    size: 'Standard_DS1_v2',
    admin_username: 'azureuser',
    network_interface_ids: '/subscriptions/YOUR_SUB_ID/resourceGroups/YOUR_RG/providers/Microsoft.Network/networkInterfaces/yournic1', // Placeholder
    os_disk: {
      caching: 'ReadWrite',
      storage_account_type: 'Standard_LRS',
    },
    source_image_reference: {
      publisher: 'Canonical',
      offer: 'UbuntuServer',
      sku: '18.04-LTS',
      version: 'latest',
    },
  };
}

export function generateAzureVirtualMachineResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_virtual_machine',
    displayName: 'Azure Virtual Machine',
    description: 'Crea una Máquina Virtual en Microsoft Azure.',
    category: 'Cómputo', // Categoría dentro de Azure
    fields: azureVirtualMachineFields,
    templates: {
      default: generateDefaultAzureVirtualMachineConfig() as unknown as ResourceTemplate,
      windows_vm: {
        ...generateDefaultAzureVirtualMachineConfig(),
        name: 'mywinvm',
        source_image_reference: {
          publisher: 'MicrosoftWindowsServer',
          offer: 'WindowsServer',
          sku: '2019-Datacenter',
          version: 'latest',
        },
        os_disk: { // Windows a menudo usa Premium
            caching: 'ReadWrite',
            storage_account_type: 'Premium_LRS',
        }
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_virtual_machine de Terraform permite gestionar una Máquina Virtual en Azure.",
      examples: [
        `
resource "azurerm_virtual_machine" "main" {
  name                  = "myvm"
  resource_group_name   = azurerm_resource_group.main.name
  location              = azurerm_resource_group.main.location
  vm_size               = "Standard_DS1_v2"
  network_interface_ids = [azurerm_network_interface.main.id]

  storage_os_disk {
    name              = "myosdisk1"
    caching           = "ReadWrite"
    create_option     = "FromImage"
    managed_disk_type = "Standard_LRS"
  }

  storage_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "16.04-LTS"
    version   = "latest"
  }
  # ... (os_profile, etc.)
}
        `,
      ],
    },
  };
}

export function generateAzureVirtualMachineName(config: AzureVirtualMachineConfig): string {
  return config.name || `azure-vm-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureVirtualMachineGeneratedCode {
  name: string;
  description: string;
  config: AzureVirtualMachineConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureVirtualMachineCode(config: AzureVirtualMachineConfig): AzureVirtualMachineGeneratedCode {
  const parsedConfig = AzureVirtualMachineSchema.parse(config);
  return {
    name: generateAzureVirtualMachineName(parsedConfig),
    description: `Azure Virtual Machine: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureVirtualMachineTemplates(parsedConfig),
  };
}

const azureVirtualMachineResource = {
  type: 'azurerm_virtual_machine',
  name: 'Azure Virtual Machine',
  schema: () => AzureVirtualMachineSchema,
  defaults: generateDefaultAzureVirtualMachineConfig,
  fields: () => azureVirtualMachineFields,
  templates: (config: AzureVirtualMachineConfig) => generateAzureVirtualMachineTemplates(config),

  // Mantener las funciones originales
  originalSchema: AzureVirtualMachineSchema,
  originalGenerateDefaultConfig: generateDefaultAzureVirtualMachineConfig,
  originalGenerateResourceSchema: generateAzureVirtualMachineResourceSchema,
  originalGenerateResourceName: generateAzureVirtualMachineName,
  originalGenerateTemplates: generateAzureVirtualMachineCode,
};

export default azureVirtualMachineResource;

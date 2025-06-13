import { z } from 'zod';
import { azureLinuxVirtualMachineScaleSetFields } from './linuxVirtualMachineScaleSetFields';
import { generateAzureLinuxVirtualMachineScaleSetTemplates } from './linuxVirtualMachineScaleSetTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../../types/resourceConfig";

const OsDiskSchema = z.object({
  caching: z.enum(['ReadWrite', 'ReadOnly', 'None']),
  storage_account_type: z.enum(['Standard_LRS', 'StandardSSD_LRS', 'Premium_LRS']),
});

const SourceImageReferenceSchema = z.object({
  publisher: z.string().min(1),
  offer: z.string().min(1),
  sku: z.string().min(1),
  version: z.string().min(1),
});

export const AzureLinuxVirtualMachineScaleSetSchema = z.object({
  name: z.string().min(1, "El nombre del VM Scale Set es obligatorio."),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  sku: z.string().min(1, "El SKU (tamaño de VM) es obligatorio."),
  instances: z.number().min(0, "El número de instancias no puede ser negativo.").default(2),
  admin_username: z.string().min(1, "El nombre de usuario admin es obligatorio."),
  admin_ssh_key_public_key_path: z.string().optional().describe("Ruta al archivo de clave pública SSH."),
  admin_ssh_key_public_key_content: z.string().optional().describe("Contenido de la clave pública SSH (si no se usa path)."),
  network_interface_name_prefix: z.string().min(1, "El prefijo para el nombre de la NIC es obligatorio."),
  network_interface_ip_configuration_name: z.string().min(1, "El nombre de la configuración IP es obligatorio."),
  network_interface_subnet_id: z.string().min(1, "El ID de la subred es obligatorio."),
  os_disk: OsDiskSchema,
  source_image_reference: SourceImageReferenceSchema,
  upgrade_mode: z.enum(['Manual', 'Automatic', 'Rolling']).optional().default('Manual'),
  health_probe_id: z.string().optional(),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
}).refine(data => !!data.admin_ssh_key_public_key_path || !!data.admin_ssh_key_public_key_content, {
  message: "Debe proporcionar la ruta o el contenido de la clave pública SSH.",
  path: ["admin_ssh_key_public_key_path"], // O un path más general si es apropiado
});

export type AzureLinuxVirtualMachineScaleSetConfig = z.infer<typeof AzureLinuxVirtualMachineScaleSetSchema>;

export function generateDefaultAzureLinuxVirtualMachineScaleSetConfig(): AzureLinuxVirtualMachineScaleSetConfig {
  return {
    name: 'mylinuxvmss',
    resource_group_name: 'my-resources',
    location: 'East US',
    sku: 'Standard_F2',
    instances: 2,
    admin_username: 'azureuser',
    admin_ssh_key_public_key_path: '~/.ssh/id_rsa.pub', // Placeholder
    network_interface_name_prefix: 'nic-',
    network_interface_ip_configuration_name: 'internal',
    network_interface_subnet_id: '/subscriptions/YOUR_SUB_ID/resourceGroups/YOUR_RG/providers/Microsoft.Network/virtualNetworks/YOUR_VNET/subnets/YOUR_SUBNET', // Placeholder
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
    upgrade_mode: 'Manual',
  };
}

export function generateAzureLinuxVirtualMachineScaleSetResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_linux_virtual_machine_scale_set',
    displayName: 'Azure Linux VM Scale Set',
    description: 'Crea un Conjunto de Escalado de Máquinas Virtuales Linux en Azure.',
    category: 'Cómputo',
    fields: azureLinuxVirtualMachineScaleSetFields,
    templates: {
      default: generateDefaultAzureLinuxVirtualMachineScaleSetConfig() as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_linux_virtual_machine_scale_set de Terraform permite gestionar Conjuntos de Escalado de Máquinas Virtuales Linux en Azure.",
      examples: [
        `
resource "azurerm_linux_virtual_machine_scale_set" "example" {
  name                = "example-vmss"
  resource_group_name = azurerm_resource_group.example.name
  location            = azurerm_resource_group.example.location
  sku                 = "Standard_F2"
  instances           = 1
  admin_username      = "adminuser"

  admin_ssh_key {
    username   = "adminuser"
    public_key = file("~/.ssh/id_rsa.pub")
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "16.04-LTS"
    version   = "latest"
  }

  os_disk {
    storage_account_type = "Standard_LRS"
    caching              = "ReadWrite"
  }

  network_interface {
    name    = "example-nic"
    primary = true

    ip_configuration {
      name      = "internal"
      primary   = true
      subnet_id = azurerm_subnet.internal.id
    }
  }
}
        `,
      ],
    },
  };
}

export function generateAzureLinuxVirtualMachineScaleSetName(config: AzureLinuxVirtualMachineScaleSetConfig): string {
  return config.name || `azure-linux-vmss-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureLinuxVirtualMachineScaleSetGeneratedCode {
  name: string;
  description: string;
  config: AzureLinuxVirtualMachineScaleSetConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureLinuxVirtualMachineScaleSetCode(config: AzureLinuxVirtualMachineScaleSetConfig): AzureLinuxVirtualMachineScaleSetGeneratedCode {
  const parsedConfig = AzureLinuxVirtualMachineScaleSetSchema.parse(config);
  return {
    name: generateAzureLinuxVirtualMachineScaleSetName(parsedConfig),
    description: `Azure Linux VM Scale Set: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureLinuxVirtualMachineScaleSetTemplates(parsedConfig),
  };
}

const azureLinuxVirtualMachineScaleSetResource = {
  type: 'azurerm_linux_virtual_machine_scale_set',
  name: 'Azure Linux VM Scale Set',
  schema: () => AzureLinuxVirtualMachineScaleSetSchema,
  defaults: generateDefaultAzureLinuxVirtualMachineScaleSetConfig,
  fields: () => azureLinuxVirtualMachineScaleSetFields,
  templates: (config: AzureLinuxVirtualMachineScaleSetConfig) => generateAzureLinuxVirtualMachineScaleSetTemplates(config),

  originalSchema: AzureLinuxVirtualMachineScaleSetSchema,
  originalGenerateDefaultConfig: generateDefaultAzureLinuxVirtualMachineScaleSetConfig,
  originalGenerateResourceSchema: generateAzureLinuxVirtualMachineScaleSetResourceSchema,
  originalGenerateResourceName: generateAzureLinuxVirtualMachineScaleSetName,
  originalGenerateTemplates: generateAzureLinuxVirtualMachineScaleSetCode,
};

export default azureLinuxVirtualMachineScaleSetResource;

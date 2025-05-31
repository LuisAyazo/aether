export interface Condition {
  condition: string; // e.g., "env == 'prod'"
  value: any;
}

export interface ConditionalProperty {
  property: string;
  conditions: Condition[];
  default?: any;
}

export interface ResourceLoop {
  variable: string; // e.g., "region"
  values: any[]; // e.g., ["us-east1", "us-west1"]
  properties: string[]; // affected properties
}

export interface SmartBehavior {
  conditionals?: ConditionalProperty[];
  loops?: ResourceLoop[];
}

export interface SmartBehaviorValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

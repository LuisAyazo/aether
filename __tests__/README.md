# InfraUX Test Structure

```
infraux/
├── __tests__/
│   ├── unit/
│   │   ├── frontend/
│   │   │   ├── components/
│   │   │   │   ├── flow/
│   │   │   │   │   └── FlowEditor.test.tsx
│   │   │   │   └── ui/
│   │   │   │       └── DiagramTreeSelect.test.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useNavigationStore.test.ts
│   │   │   └── services/
│   │   │       └── diagramService.test.ts
│   │   └── setup.ts
│   ├── integration/
│   │   ├── api/
│   │   │   └── dashboard.integration.test.ts
│   │   └── flow/
│   │       └── diagram-crud.integration.test.tsx
│   ├── e2e/
│   │   ├── auth/
│   │   │   └── login.spec.ts
│   │   ├── diagram/
│   │   │   └── create-diagram.spec.ts
│   │   └── smoke/
│   │       └── critical-path.spec.ts
│   └── fixtures/
│       ├── diagrams.ts
│       └── users.ts
│
backend/
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   └── test_supabase_core_service.py
│   │   └── routes/
│   │       └── test_dashboard.py
│   ├── integration/
│   │   └── test_api_integration.py
│   └── conftest.py

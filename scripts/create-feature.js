#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

// Get feature name from command line
const featureName = process.argv[2];

if (!featureName) {
  console.error('❌ Error: Feature name is required');
  console.log('Usage: npm run create-feature <feature-name>');
  console.log('Example: npm run create-feature parts-search');
  process.exit(1);
}

// Validate feature name (kebab-case)
if (!/^[a-z]+(-[a-z]+)*$/.test(featureName)) {
  console.error('❌ Error: Feature name must be in kebab-case (lowercase with hyphens)');
  console.log('Example: parts-search, job-notes, diagnostic');
  process.exit(1);
}

// Convert feature name to different cases
const featureNamePascal = featureName
  .split('-')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');
const featureNameCamel = featureName
  .split('-')
  .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
  .join('');

const featurePath = path.join(__dirname, '..', 'src', 'features', featureName);

// Check if feature already exists
if (fs.existsSync(featurePath)) {
  console.error(`❌ Error: Feature '${featureName}' already exists at ${featurePath}`);
  process.exit(1);
}

// Create folder structure
const folders = ['components', 'hooks', 'services', 'screens', '__tests__', 'services/__tests__'];

console.log(`📁 Creating feature '${featureName}'...`);

// Create all folders
folders.forEach((folder) => {
  const folderPath = path.join(featurePath, folder);
  fs.mkdirSync(folderPath, { recursive: true });
});

// Create types.ts
const typesContent = `// Types for ${featureName} feature

export interface ${featureNamePascal} {
  id: string;
  // Add your properties here
}

export interface ${featureNamePascal}FormData {
  // Add form fields here
}
`;

fs.writeFileSync(path.join(featurePath, 'types.ts'), typesContent);

// Create index.ts
const indexContent = `// Public API for ${featureName} feature
// Only export what other features need to import

// Export types (type-only exports)
export type { ${featureNamePascal}, ${featureNamePascal}FormData } from './types';

// Export hooks
// export { use${featureNamePascal} } from './hooks/use${featureNamePascal}';

// Export screens
// export { ${featureNamePascal}Screen } from './screens/${featureNamePascal}Screen';

// DO NOT export:
// - Services (other features should use hooks, not services directly)
// - Internal components (only screens are public)
// - Helper functions
`;

fs.writeFileSync(path.join(featurePath, 'index.ts'), indexContent);

// Create service template
const serviceContent = `import { apiClient } from '@/lib/api';
import type { ${featureNamePascal}, ${featureNamePascal}FormData } from '../types';

/**
 * Service for ${featureName} operations
 */
class ${featureNamePascal}Service {
  /**
   * Get all ${featureName} items
   */
  async getAll(): Promise<${featureNamePascal}[]> {
    return apiClient.get<${featureNamePascal}[]>('/${featureName}');
  }

  /**
   * Get ${featureName} by ID
   */
  async getById(id: string): Promise<${featureNamePascal}> {
    return apiClient.get<${featureNamePascal}>(\`/${featureName}/\${id}\`);
  }

  /**
   * Create new ${featureName}
   */
  async create(data: ${featureNamePascal}FormData): Promise<${featureNamePascal}> {
    return apiClient.post<${featureNamePascal}>('/${featureName}', data);
  }

  /**
   * Update existing ${featureName}
   */
  async update(id: string, data: Partial<${featureNamePascal}FormData>): Promise<${featureNamePascal}> {
    return apiClient.put<${featureNamePascal}>(\`/${featureName}/\${id}\`, data);
  }

  /**
   * Delete ${featureName}
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(\`/${featureName}/\${id}\`);
  }
}

export const ${featureNameCamel}Service = new ${featureNamePascal}Service();
`;

fs.writeFileSync(
  path.join(featurePath, 'services', `${featureNameCamel}Service.ts`),
  serviceContent
);

// Create service test template
const serviceTestContent = `import { ${featureNameCamel}Service } from '../${featureNameCamel}Service';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api');

describe('${featureNamePascal}Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all ${featureName} items', async () => {
      const mockData = [{ id: '1' }, { id: '2' }];
      (apiClient.get as jest.Mock).mockResolvedValue(mockData);

      const result = await ${featureNameCamel}Service.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/${featureName}');
      expect(result).toEqual(mockData);
    });
  });

  describe('getById', () => {
    it('should fetch ${featureName} by id', async () => {
      const mockData = { id: '1' };
      (apiClient.get as jest.Mock).mockResolvedValue(mockData);

      const result = await ${featureNameCamel}Service.getById('1');

      expect(apiClient.get).toHaveBeenCalledWith('/${featureName}/1');
      expect(result).toEqual(mockData);
    });
  });

  describe('create', () => {
    it('should create new ${featureName}', async () => {
      const formData = { /* add test data */ };
      const mockResponse = { id: '1', ...formData };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ${featureNameCamel}Service.create(formData as any);

      expect(apiClient.post).toHaveBeenCalledWith('/${featureName}', formData);
      expect(result).toEqual(mockResponse);
    });
  });
});
`;

fs.writeFileSync(
  path.join(featurePath, 'services', '__tests__', `${featureNameCamel}Service.test.ts`),
  serviceTestContent
);

// Create hook template
const hookContent = `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ${featureNameCamel}Service } from '../services/${featureNameCamel}Service';
import type { ${featureNamePascal}, ${featureNamePascal}FormData } from '../types';

/**
 * Query keys for ${featureName}-related queries
 */
const ${featureNameCamel}Keys = {
  all: ['${featureName}'] as const,
  lists: () => [...${featureNameCamel}Keys.all, 'list'] as const,
  list: (filters: string) => [...${featureNameCamel}Keys.lists(), { filters }] as const,
  details: () => [...${featureNameCamel}Keys.all, 'detail'] as const,
  detail: (id: string) => [...${featureNameCamel}Keys.details(), id] as const,
};

/**
 * Hook for getting all ${featureName} items
 */
export function use${featureNamePascal}List() {
  return useQuery({
    queryKey: ${featureNameCamel}Keys.lists(),
    queryFn: () => ${featureNameCamel}Service.getAll(),
  });
}

/**
 * Hook for getting ${featureName} details
 */
export function use${featureNamePascal}(id: string) {
  return useQuery({
    queryKey: ${featureNameCamel}Keys.detail(id),
    queryFn: () => ${featureNameCamel}Service.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook for creating ${featureName}
 */
export function useCreate${featureNamePascal}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ${featureNamePascal}FormData) => ${featureNameCamel}Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ${featureNameCamel}Keys.lists() });
    },
  });
}

/**
 * Hook for updating ${featureName}
 */
export function useUpdate${featureNamePascal}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<${featureNamePascal}FormData> }) =>
      ${featureNameCamel}Service.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ${featureNameCamel}Keys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ${featureNameCamel}Keys.lists() });
    },
  });
}

/**
 * Hook for deleting ${featureName}
 */
export function useDelete${featureNamePascal}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ${featureNameCamel}Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ${featureNameCamel}Keys.lists() });
    },
  });
}
`;

fs.writeFileSync(path.join(featurePath, 'hooks', `use${featureNamePascal}.ts`), hookContent);

// Create README
const readmeContent = `# ${featureNamePascal} Feature

## Overview

[Describe what this feature does]

## Files

- \`types.ts\` - TypeScript interfaces and types
- \`services/${featureNameCamel}Service.ts\` - Business logic (API calls, data transformation)
- \`hooks/use${featureNamePascal}.ts\` - React hooks for state management
- \`components/\` - Feature-specific UI components
- \`screens/\` - Screen components
- \`index.ts\` - Public API (only exports what other features need)

## Usage

\`\`\`typescript
import { use${featureNamePascal} } from '@/features/${featureName}';

function MyComponent() {
  const { data, isLoading } = use${featureNamePascal}('123');

  if (isLoading) return <LoadingSpinner />;

  return <View>{/* Use data */}</View>;
}
\`\`\`

## Development

### Adding a new component

1. Create component in \`components/\` folder
2. Keep under 150 lines
3. Add props interface at the top

### Adding a new screen

1. Create screen in \`screens/\` folder
2. Keep under 200 lines
3. Compose from smaller components
4. Use hooks for data and logic

### Testing

Run tests for this feature:

\`\`\`bash
npm test -- src/features/${featureName}
\`\`\`
`;

fs.writeFileSync(path.join(featurePath, 'README.md'), readmeContent);

// Update package.json with create-feature script if not exists
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.scripts['create-feature']) {
  packageJson.scripts['create-feature'] = 'node scripts/create-feature.js';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

console.log('✅ Feature created successfully!\n');
console.log(`📂 Location: src/features/${featureName}/`);
console.log('\n📝 Files created:');
console.log(`   - types.ts`);
console.log(`   - index.ts`);
console.log(`   - services/${featureNameCamel}Service.ts`);
console.log(`   - services/__tests__/${featureNameCamel}Service.test.ts`);
console.log(`   - hooks/use${featureNamePascal}.ts`);
console.log(`   - README.md`);
console.log('\n🚀 Next steps:');
console.log('   1. Define types in types.ts');
console.log('   2. Implement service methods');
console.log('   3. Add tests for service');
console.log('   4. Create hooks for state management');
console.log('   5. Build UI components');
console.log('   6. Build screen components');
console.log('   7. Export public API in index.ts');
console.log('\n📖 See docs/FEATURE_DEVELOPMENT.md for detailed guidance');

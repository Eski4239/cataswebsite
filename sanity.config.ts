import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {schemaTypes} from './sanity/schemas';

export default defineConfig({
  name: 'luis-torres-catas',
  title: 'Luis Torres Catas',
  projectId: 'wzudpmcs',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {types: schemaTypes},
});

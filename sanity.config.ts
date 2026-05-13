import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {media} from 'sanity-plugin-media'
import {apiVersion, dataset, projectId} from './sanity/env'
import {schemaTypes} from './sanity/schemaTypes'
import {structure} from './sanity/structure'
import {StudioLayout} from './sanity/components/StudioLayout'
import {publishStatusBadge} from './sanity/components/PublishStatusBadge'
import {publishStatusAction} from './sanity/components/PublishStatusAction'
import {resolveProductionUrl} from './sanity/lib/productionUrl'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({structure}),
    visionTool({defaultApiVersion: apiVersion}),
    media(),
  ],
  studio: {
    components: {
      layout: StudioLayout,
    },
  },
  document: {
    // Colored badge in the document list pane ("Draft", "Changes pending")
    badges: [publishStatusBadge],
    // Status indicator button in the document toolbar ("Live on your site", "Not live yet", etc.)
    actions: (prev) => [...prev, publishStatusAction],
    // "View on site" external link icon in the document toolbar
    productionUrl: resolveProductionUrl,
  },
})

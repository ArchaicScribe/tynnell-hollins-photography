'use client'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {media} from 'sanity-plugin-media'
import {apiVersion, dataset, projectId} from './sanity/env'
import {schemaTypes} from './sanity/schemaTypes'
import {structure} from './sanity/structure'
import {StudioLayout} from './sanity/components/StudioLayout'

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
})

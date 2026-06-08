import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import '../custom.css'
import { PayloadCssGuard } from '../../../components/admin/PayloadCssGuard'

import config from '@payload-config'
import { importMap } from './importMap.js'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

export default async function Layout({ children }: Args) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      <PayloadCssGuard />
      {children}
    </RootLayout>
  )
}

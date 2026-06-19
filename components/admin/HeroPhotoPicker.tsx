'use client'
import { PhotoPickerField } from './PhotoPickerField'

export function HeroPhotoPicker() {
  return (
    <PhotoPickerField
      fieldPath="heroPhoto"
      label="Hero Photo"
      hint="Optional - full-bleed banner on the gallery page. Defaults to the cover photo if not set."
    />
  )
}

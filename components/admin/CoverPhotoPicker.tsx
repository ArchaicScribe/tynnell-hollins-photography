'use client'
import { PhotoPickerField } from './PhotoPickerField'

export function CoverPhotoPicker() {
  return (
    <PhotoPickerField
      fieldPath="coverPhoto"
      label="Cover Photo"
      hint="Shown on your portfolio page. Add photos below and use Set as Cover, or pick one here."
    />
  )
}

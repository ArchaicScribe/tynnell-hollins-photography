'use client'
import { PhotoPickerField } from './PhotoPickerField'

export function CoverPhotoPicker() {
  return (
    <PhotoPickerField
      fieldPath="coverPhoto"
      label="Cover Photo"
      hint="Required - shown on your portfolio page"
      required
    />
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

type Props = {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  className?: string
  placeholder?: string
}

let initialized = false

export default function LocationInput({ id, value, onChange, onBlur, className, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || !inputRef.current) return

    // setOptions is idempotent - safe to call multiple times
    if (!initialized) {
      setOptions({ key: apiKey })
      initialized = true
    }

    let autocomplete: google.maps.places.Autocomplete | null = null

    importLibrary('places').then((places) => {
      if (!inputRef.current) return
      const { Autocomplete } = places as google.maps.PlacesLibrary
      autocomplete = new Autocomplete(inputRef.current, {
        types: ['geocode', 'establishment'],
        fields: ['formatted_address', 'name'],
      })
      autocomplete.addListener('place_changed', () => {
        if (!autocomplete) return
        const place = autocomplete.getPlace()
        const selected = place.formatted_address ?? place.name ?? ''
        onChange(selected)
      })
    })

    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={className}
      placeholder={placeholder}
      autoComplete="off"
    />
  )
}

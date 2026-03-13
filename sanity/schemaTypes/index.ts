import { aboutPage } from './aboutPage'
import { gallery } from './gallery'
import { heroSlide } from './heroSlide'
import { page } from './page'
import { photo } from './photo'
import { post } from './post'
import { service } from './service'
import { siteConfig } from './siteConfig'
import { testimonial } from './testimonial'

export const schemaTypes = [
  // Singletons
  siteConfig,
  aboutPage,
  // Collections
  heroSlide,
  photo,
  gallery,
  service,
  testimonial,
  post,
  page,
]

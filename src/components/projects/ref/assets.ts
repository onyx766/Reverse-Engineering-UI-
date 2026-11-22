/*
 * Photoreal pieces cut from the reference render (built by the plate script):
 * the stage plate with the live UI removed, flat card faces with their text
 * removed (art + arrow kept), and a blank face for studies the render never
 * showed.
 */
import plate from '@/assets/ref/plate-projects.webp'
import cardApi from '@/assets/ref/card-api.webp'
import cardBinary from '@/assets/ref/card-binary.webp'
import cardProtocol from '@/assets/ref/card-protocol.webp'
import cardFormat from '@/assets/ref/card-format.webp'
import cardReimpl from '@/assets/ref/card-reimpl.webp'
import cardBlank from '@/assets/ref/card-blank.webp'

export const PLATE = plate

/** card face per project id; anything else gets the blank face plus its drawn illustration */
export const CARD_FACE: Record<string, string> = {
  'undocumented-api': cardApi,
  'binary-case-study': cardBinary,
  'protocol-analyzer': cardProtocol,
  'file-format': cardFormat,
  reimplementation: cardReimpl,
}
export const CARD_BLANK = cardBlank

/** start fetching the plate early on screens that will show it (the chunk is warmed on idle) */
if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches) {
  for (const src of [plate, ...Object.values(CARD_FACE)]) {
    const img = new Image()
    img.decoding = 'async'
    img.src = src
  }
}

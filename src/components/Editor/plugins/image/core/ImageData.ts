declare var tinymce
import Utils from '../core/Utils'
import { IImageData } from 'src/components/Editor/common'

type CssNormalizer = (css: string) => string

const DOM = () => tinymce.dom.domutils

const getHspace = (image: HTMLElement): string => {
  if (
    image.style.marginLeft &&
    image.style.marginRight &&
    image.style.marginLeft === image.style.marginRight
  ) {
    return Utils.removePixelSuffix(image.style.marginLeft)
  } else {
    return ''
  }
}

const getVspace = (image: HTMLElement): string => {
  if (
    image.style.marginTop &&
    image.style.marginBottom &&
    image.style.marginTop === image.style.marginBottom
  ) {
    return Utils.removePixelSuffix(image.style.marginTop)
  } else {
    return ''
  }
}

const getBorder = (image: HTMLElement): string => {
  if (image.style.borderWidth) {
    return Utils.removePixelSuffix(image.style.borderWidth)
  } else {
    return ''
  }
}

const getAttrib = (image: HTMLElement, name: string): string => {
  if (image.hasAttribute(name)) {
    return image.getAttribute(name) || ''
  } else {
    return ''
  }
}

const getStyle = (image: HTMLElement, name: string): string => {
  return image.style[name] ? image.style[name] : ''
}

const hasCaption = (image: HTMLElement): boolean => {
  return image.parentNode !== null && image.parentNode.nodeName === 'FIGURE'
}

const setAttrib = (image: HTMLElement, name: string, value: string) => {
  image.setAttribute(name, value)
}

const wrapInFigure = (image: HTMLElement) => {
  const figureElm = DOM().create('figure', { class: 'image' })
  DOM().insertAfter(figureElm, image)

  figureElm.appendChild(image)
  figureElm.appendChild(
    DOM().create('figcaption', { contentEditable: true }, 'Caption'),
  )
  figureElm.contentEditable = 'false'
}

const removeFigure = (image: HTMLElement) => {
  const figureElm = image.parentNode
  DOM().insertAfter(image, figureElm as Node)
  DOM().remove(figureElm as Node)
}

const toggleCaption = (image: HTMLElement) => {
  if (hasCaption(image)) {
    removeFigure(image)
  } else {
    wrapInFigure(image)
  }
}

const normalizeStyle = (image: HTMLElement, normalizeCss: CssNormalizer) => {
  const attrValue = image.getAttribute('style')
  const value = normalizeCss(attrValue !== null ? attrValue : '')

  if (value.length > 0) {
    image.setAttribute('style', value)
    image.setAttribute('data-mce-style', value)
  } else {
    image.removeAttribute('style')
  }
}

const setSize = (nameIn: string, normalizeCss: CssNormalizer) => {
  return (image: HTMLElement, name: string, value: string) => {
    if (image.style[name]) {
      image.style[name] = Utils.addPixelSuffix(value)
      normalizeStyle(image, normalizeCss)
    } else {
      setAttrib(image, name, value)
    }
  }
}

const getSize = (image: HTMLElement, name: string): string => {
  if (image.style[name]) {
    return Utils.removePixelSuffix(image.style[name])
  } else {
    return getAttrib(image, name)
  }
}

const setHspace = (image: HTMLElement, value: string) => {
  const pxValue = Utils.addPixelSuffix(value)
  image.style.marginLeft = pxValue
  image.style.marginRight = pxValue
}

const setVspace = (image: HTMLElement, value: string) => {
  const pxValue = Utils.addPixelSuffix(value)
  image.style.marginTop = pxValue
  image.style.marginBottom = pxValue
}

const setBorder = (image: HTMLElement, value: string) => {
  const pxValue = Utils.addPixelSuffix(value)
  image.style.borderWidth = pxValue
}

const setBorderStyle = (image: HTMLElement, value: string) => {
  image.style.borderStyle = value
}

const getBorderStyle = (image: HTMLElement) => getStyle(image, 'borderStyle')

const isFigure = (elm: Node) => elm.nodeName === 'FIGURE'

const isImage = (elm: Node) => elm.nodeName === 'IMG'

const defaultData = (): IImageData => {
  return {
    src: '',
    alt: '',
    title: '',
    width: '',
    height: '',
    class: '',
    style: '',
    caption: false,
    hspace: '',
    vspace: '',
    border: '',
    borderStyle: '',
  }
}

const getStyleValue = (
  normalizeCss: CssNormalizer,
  data: IImageData,
): string => {
  const image = document.createElement('img')

  setAttrib(image, 'style', data.style)

  if (getHspace(image) || data.hspace !== '') {
    setHspace(image, data.hspace)
  }

  if (getVspace(image) || data.vspace !== '') {
    setVspace(image, data.vspace)
  }

  if (getBorder(image) || data.border !== '') {
    setBorder(image, data.border)
  }

  if (getBorderStyle(image) || data.borderStyle !== '') {
    setBorderStyle(image, data.borderStyle)
  }

  return normalizeCss(image.getAttribute('style') || '')
}

const create = (normalizeCss: CssNormalizer, data: IImageData): HTMLElement => {
  const image = document.createElement('img')
  write(normalizeCss, { ...data, ...{ caption: false } }, image)

  // Always set alt even if data.alt is an empty string
  setAttrib(image, 'alt', data.alt)

  if (data.caption) {
    const figure = DOM().create('figure', { class: 'image' })

    figure.appendChild(image)
    figure.appendChild(
      DOM().create('figcaption', { contentEditable: true }, 'Caption'),
    )
    figure.contentEditable = 'false'

    return figure
  } else {
    return image
  }
}

const read = (normalizeCss: CssNormalizer, image: HTMLElement): IImageData => {
  return {
    src: getAttrib(image, 'src'),
    alt: getAttrib(image, 'alt'),
    title: getAttrib(image, 'title'),
    width: getSize(image, 'width'),
    height: getSize(image, 'height'),
    class: getAttrib(image, 'class'),
    style: normalizeCss(getAttrib(image, 'style')),
    caption: hasCaption(image),
    hspace: getHspace(image),
    vspace: getVspace(image),
    border: getBorder(image),
    borderStyle: getStyle(image, 'borderStyle'),
  }
}

const updateProp = (
  image: HTMLElement,
  oldData: IImageData,
  newData: IImageData,
  name: string,
  set: (image: HTMLElement, name: string, value: string) => void,
) => {
  if (newData[name] !== oldData[name]) {
    set(image, name, newData[name])
  }
}

const normalized = (
  set: (image: HTMLElement, value: string) => void,
  normalizeCss: CssNormalizer,
) => {
  return (image: HTMLElement, name: string, value: string) => {
    set(image, value)
    normalizeStyle(image, normalizeCss)
  }
}

const write = (
  normalizeCss: CssNormalizer,
  newData: IImageData,
  image: HTMLElement,
) => {
  const oldData = read(normalizeCss, image)

  updateProp(image, oldData, newData, 'caption', (img, name, value) =>
    toggleCaption(image),
  )
  updateProp(image, oldData, newData, 'src', setAttrib)
  updateProp(image, oldData, newData, 'alt', setAttrib)
  updateProp(image, oldData, newData, 'title', setAttrib)
  updateProp(image, oldData, newData, 'width', setSize('width', normalizeCss))
  updateProp(image, oldData, newData, 'height', setSize('height', normalizeCss))
  updateProp(image, oldData, newData, 'class', setAttrib)
  updateProp(
    image,
    oldData,
    newData,
    'style',
    normalized((img, value) => setAttrib(image, 'style', value), normalizeCss),
  )
  updateProp(
    image,
    oldData,
    newData,
    'hspace',
    normalized(setHspace, normalizeCss),
  )
  updateProp(
    image,
    oldData,
    newData,
    'vspace',
    normalized(setVspace, normalizeCss),
  )
  updateProp(
    image,
    oldData,
    newData,
    'border',
    normalized(setBorder, normalizeCss),
  )
  updateProp(
    image,
    oldData,
    newData,
    'borderStyle',
    normalized(setBorderStyle, normalizeCss),
  )
}

export { getStyleValue, defaultData, isFigure, isImage, create, read, write }

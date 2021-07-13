import d from '../data.json'

const pages = d.blocks.map((p) => {
  let pageName = p['page-name']
  if (pageName != null) {
    pageName = pageName.split('/').join(' | ')
  }

  return {
    ...p,
    pageName,
  }
})

const DEFAULT_HOME_PAGE = 'Contents'
export const homepage = d.homepage ?? DEFAULT_HOME_PAGE

export const pageNames = pages.map((b) => b.pageName).sort()
export function getPageByName(name) {
  return pages.find((p) => p.pageName === name)
}

let pageNameToLinkedRefs = {}
export function getLinkedRefs(pageName) {
  return pageNameToLinkedRefs[pageName]
}
function addPageNameToLinkedRefs(inline, block, pageName) {
  const type = getInlineType(inline)
  const content = getInlineContent(inline)
  if (type === 'Link') {
    const linkContent = content.url
    const linkType = linkContent?.[0]
    if (linkType === 'Search') {
      const toPage = linkContent?.[1]

      if (toPage.includes('Gloss')) {
      }

      if (pageNames.includes(toPage)) {
        const param = { block, pageName }
        if (pageNameToLinkedRefs[toPage] == null) {
          pageNameToLinkedRefs[toPage] = [param]
        } else {
          pageNameToLinkedRefs[toPage].push(param)
        }
      }
    }
  }
}

// in case the inline structure changes
export function getInlineType(inline) {
  return inline[0]
}

export function getInlineContent(inline) {
  return inline[1]
}

const CONTAINER_INLINE_TYPES = ['Paragraph']
export function isInlineContainer(inline) {
  const type = getInlineType(inline)
  return CONTAINER_INLINE_TYPES.includes(type)
}

let idToBlock = {}
function addIDToBlock(block, pageName) {
  idToBlock[block.id] = { block, pageName }

  block.children.forEach((b) => addIDToBlock(b, pageName))
}
export function getBlockByID(id) {
  return idToBlock[id].block
}
export function getPageNameByID(id) {
  return idToBlock[id].pageName
}

const blockPipeline = [addIDToBlock]
function runBlockPipeline(block, pageName) {
  blockPipeline.forEach((fun) => fun(block, pageName))
}

const inlinePipeline = [addPageNameToLinkedRefs]
function runInlinePipeline(inline, block, pageName) {
  inlinePipeline.forEach((fun) => fun(inline, block, pageName))
}

function walkPagesTreeAndCreateSupportData() {
  pages.forEach((page) => {
    const pageName = page.pageName
    walkBlocks(page.children, runBlockPipeline, runInlinePipeline, pageName)
  })
}

function walkBlocks(blocks, doBlock, doInline, pageName) {
  blocks.forEach((b) => {
    doBlock(b, pageName)

    if (Array.isArray(b.title)) {
      walkInlines(b.title, b, doInline, pageName)
    }

    if (Array.isArray(b.body)) {
      walkInlines(b.body, b, doInline, pageName)
    }

    walkBlocks(b.children, doBlock, doInline, pageName)
  })
}

function walkInlines(inlines, block, doInline, pageName) {
  inlines.forEach((inline) => walkInline(inline, block, doInline, pageName))
}

function walkInline(inline, block, doInline, pageName) {
  if (isInlineContainer(inline)) {
    walkInlines(getInlineContent(inline), block, doInline, pageName)
  } else {
    doInline(inline, block, pageName)
  }
}

walkPagesTreeAndCreateSupportData()

export function createPagePath(pageName, id) {
  const hash = id != null ? `#${id}` : ''
  return `/pages/${encodeURIComponent(pageName)}${hash}`
}

export function isHeading(b) {
  return b['heading-level'] != null
}

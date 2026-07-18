<script lang="ts">
import { SearchHandler, ThresholdStrategy } from '@lib/search/search-handler'
import type { Category, DndTopicItem } from '@types'
import CategoryRow from '@ui/components/digest/CategoryRow.svelte'
import MobileView from '@ui/components/digest/MobileView.svelte'
import { readDigestCache, writeDigestCache } from '@utils'
import {
  CATEGORY_MINIMIZED_STORAGE_KEY,
  CATEGORY_ORDER_STORAGE_KEY,
  normalizeStoredTopicKey,
  resolveCategoryOrder,
} from '@utils/category-order'
import { activeRegions, debouncedSearchQuery } from '@utils/digest-filter'
import { onMount } from 'svelte'
import { flip } from 'svelte/animate'
import { type DndEvent, dragHandleZone } from 'svelte-dnd-action'
import { browser } from '$app/environment'
import type { Region } from '../../../../../packages/types/digest'
import type { DigestCard } from '../../../../../packages/types/news'
import { type Topic, TOPIC_LABELS, TOPIC_ORDER } from '../../../../../packages/types/topics'

// The digest itself is fetched client-side (not via the server `load`) so a
// repeat visit can paint instantly from localStorage before any network
// request resolves. `+page.server.ts` only supplies cheap, DB-free config.
const { data } = $props<{
  data: {
    fuseThreshold: number
    useMockData: boolean
  }
}>()

let liveDigest = $state<Partial<Record<Topic, DigestCard[]>>>({})
let liveSummaries = $state<Partial<Record<Topic, string[]>>>({})
let digestLoaded = $state(false)

async function fetchDigestData() {
  try {
    const res = await fetch('/api/digest/data')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as {
      digest: Partial<Record<Topic, DigestCard[]>>
      summaries: Partial<Record<Topic, string[]>>
    }
    liveDigest = json.digest ?? {}
    liveSummaries = json.summaries ?? {}
    digestLoaded = true
    writeDigestCache({ digest: liveDigest, summaries: liveSummaries })
  } catch (err) {
    console.error('digest fetch failed', err)
  }
}

let debouncedQ = $state('')
let regions = $state<Set<Region>>(new Set())

$effect(() => {
  const u = debouncedSearchQuery.subscribe(v => {
    debouncedQ = v
  })
  return () => u()
})

$effect(() => {
  const u = activeRegions.subscribe(v => {
    regions = v
  })
  return () => u()
})

const sourceDigest = $derived(liveDigest)

type CardRow = DigestCard & { topic: Topic }

const allCards = $derived(
  Object.entries(sourceDigest).flatMap(([topic, cards]) =>
    (cards ?? []).map(c => ({ ...c, topic: topic as Topic })),
  ) as CardRow[],
)

const handler = $derived(
  new SearchHandler(
    new ThresholdStrategy<CardRow>({
      keys: ['headline', 'whyItMatters', { name: 'bullets', getFn: (c: CardRow) => c.bullets.join(' ') }],
      ignoreLocation: true,
    }),
    data.fuseThreshold,
  ),
)

const searchedCards = $derived(handler.handle(debouncedQ, allCards))

const filteredCards = $derived(regions.size === 0 ? searchedCards : searchedCards.filter(c => regions.has(c.region)))

const filteredDigest = $derived(
  filteredCards.reduce<Partial<Record<Topic, DigestCard[]>>>((acc, card) => {
    const t = card.topic
    if (!acc[t]) acc[t] = []
    const list = acc[t] as DigestCard[]
    list.push(card)
    return acc
  }, {}),
)

const presentTopics = $derived(TOPIC_ORDER.filter(t => sourceDigest[t]?.length) as Topic[])

let savedTopicOrder = $state<Topic[]>([])
let minimizedTopics = $state<Set<Topic>>(new Set())

onMount(() => {
  const mq = window.matchMedia('(max-width: 576px)')
  isMobile = mq.matches
  const mqHandler = (e: MediaQueryListEvent) => {
    isMobile = e.matches
  }
  mq.addEventListener('change', mqHandler)

  try {
    const rawOrder = localStorage.getItem(CATEGORY_ORDER_STORAGE_KEY)
    if (rawOrder) {
      const parsed = JSON.parse(rawOrder) as unknown
      if (Array.isArray(parsed)) {
        savedTopicOrder = parsed
          .map(x => (typeof x === 'string' ? normalizeStoredTopicKey(x) : null))
          .filter((x): x is Topic => x != null)
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const rawMin = localStorage.getItem(CATEGORY_MINIMIZED_STORAGE_KEY)
    if (rawMin) {
      const parsed = JSON.parse(rawMin) as unknown
      if (Array.isArray(parsed)) {
        minimizedTopics = new Set(
          parsed
            .map(x => (typeof x === 'string' ? normalizeStoredTopicKey(x) : null))
            .filter((x): x is Topic => x != null),
        )
      }
    }
  } catch {
    /* ignore */
  }

  const cached = readDigestCache()
  if (cached) {
    liveDigest = cached.digest
    liveSummaries = cached.summaries
    digestLoaded = true
  }
  // Always revalidate in the background, cache hit or not — the digest is
  // idempotent per UTC day, so this just catches genuinely new data quickly.
  fetchDigestData()

  return () => mq.removeEventListener('change', mqHandler)
})

const baseOrder = $derived(resolveCategoryOrder(savedTopicOrder, presentTopics))
const displayOrder = $derived(baseOrder)

function persistTopicOrder(next: Topic[]) {
  savedTopicOrder = next
  if (browser) {
    localStorage.setItem(CATEGORY_ORDER_STORAGE_KEY, JSON.stringify(next))
  }
}

function persistMinimized(next: Set<Topic>) {
  minimizedTopics = next
  if (browser) {
    localStorage.setItem(CATEGORY_MINIMIZED_STORAGE_KEY, JSON.stringify([...next]))
  }
}

function minimizeTopic(topic: Topic) {
  const next = new Set(minimizedTopics)
  next.add(topic)
  persistMinimized(next)
}

function expandTopic(topic: Topic) {
  const next = new Set(minimizedTopics)
  next.delete(topic)
  persistMinimized(next)
}

let isMobile = $state(false)

let dndItems = $state<DndTopicItem[]>([])
let dndDragging = $state(false)
const flipDurationMs = 150

$effect.pre(() => {
  if (dndDragging) return
  dndItems = displayOrder.map(t => ({ id: t, topic: t }))
})

function handleDndConsider(e: CustomEvent<DndEvent<DndTopicItem>>) {
  dndDragging = true
  dndItems = e.detail.items
}

function handleDndFinalize(e: CustomEvent<DndEvent<DndTopicItem>>) {
  dndItems = e.detail.items
  persistTopicOrder(dndItems.map(i => i.topic))
  dndDragging = false
}

function styleCategoryDragPreview(element: HTMLElement, _data: unknown, _index: number) {
  element.style.setProperty('outline', 'none', 'important')
  element.style.setProperty('border', '2px solid #000000', 'important')
  element.style.setProperty('background-color', '#ffffff', 'important')
}

const categoryByTopic = $derived(
  presentTopics.reduce<Partial<Record<Topic, Category>>>((acc, t) => {
    acc[t] = {
      name: TOPIC_LABELS[t],
      summary: liveSummaries[t] ?? (sourceDigest[t] ?? []).slice(0, 5).map(c => c.headline),
      news: (filteredDigest[t] ?? []).map(c => ({
        title: c.headline,
        bullets: c.bullets,
        whyItMatters: c.whyItMatters,
        credits: c.credits,
        tags: c.tags,
      })),
    }
    return acc
  }, {}),
)

const mobileCategories = $derived(
  displayOrder.map((t, i) => ({
    bucket: t,
    index: i,
    summary: categoryByTopic[t]?.summary ?? [],
    news: categoryByTopic[t]?.news ?? [],
  })),
)
</script>

<svelte:head>
  <title>&#x200E;</title>
  <meta
    name="description"
    content="2min.today is a daily, informationally dense Global Digest that summarizes the world's most significant news into a precise two-minute read."
  />
</svelte:head>

{#if !digestLoaded}
  <div class="flex h-[30vh] items-center justify-center px-6">
    <p class="font-mono text-[0.65rem] uppercase tracking-widest text-black/30">Loading digest…</p>
  </div>
{:else if isMobile}
  <MobileView categories={mobileCategories} />
{:else}
  <div
    aria-label="News categories, drag rows to reorder"
    role="region"
    use:dragHandleZone={{
      items: dndItems,
      flipDurationMs,
      dropTargetStyle: { outline: 'none' },
      transformDraggedElement: styleCategoryDragPreview,
    }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
  >
    {#each dndItems as item, i (item.id)}
      <div class="-mt-[2px] border-2 border-black" animate:flip={{ duration: flipDurationMs }}>
        {#if categoryByTopic[item.topic]}
          {@const category = categoryByTopic[item.topic] as Category}
          <CategoryRow
            name={category.name}
            summary={category.summary}
            news={category.news}
            index={i}
            minimized={minimizedTopics.has(item.topic)}
            dragging={dndDragging}
            onMinimize={() => minimizeTopic(item.topic)}
            onExpand={() => expandTopic(item.topic)}
            reorderable
          />
        {/if}
      </div>
    {/each}
  </div>
{/if}

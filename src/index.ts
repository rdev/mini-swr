import { createContext } from 'preact'
import {
  useState,
  useContext,
  useEffect,
  useRef,
  StateUpdater,
} from 'preact/hooks'
import deq from 'fast-deep-equal'

type MiniSWROptions = {
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  refreshInterval?: number
}

type SWRResult<T> = {
  data: T | undefined
  isValidating: boolean
  mutate: (nextData: any) => void
  revalidate: () => void
  error?: any
}

type CacheEntry<T> = {
  data: T | undefined
  isValidating: boolean
  mutate: (nextData: any) => void
  revalidate: () => void
  error?: any
  effects: StateUpdater<SWRResult<T>>[]
}

function isOnline(): boolean {
  if (typeof navigator.onLine !== 'undefined') {
    return navigator.onLine
  }
  // always assume it's online
  return true
}

function isDocumentVisible(): boolean {
  if (
    typeof document !== 'undefined' &&
    typeof document.visibilityState !== 'undefined'
  ) {
    return document.visibilityState !== 'hidden'
  }
  // always assume it's visible
  return true
}

const _fetcher = (url: string) => fetch(url).then((res) => res.json())

let CacheContext = createContext(new Map<string | null, CacheEntry<any>>())

function useSWR<T>(
  key: string | null,
  fetcher?: (key: string) => Promise<T>,
  options?: MiniSWROptions,
) {
  let cache = useContext(CacheContext)
  let [value, setValue] = useState(getNextValue)

  let revalidateInterval = useRef<any>(null)

  function getNextValue() {
    let cacheEntry = getCacheEntry()

    let nextValue: SWRResult<T> = {
      data: cacheEntry.data,
      isValidating: cacheEntry.isValidating,
      mutate,
      revalidate,
    }

    if (nextValue.error) {
      nextValue.error = cacheEntry.error
    }

    return nextValue
  }

  function getCacheEntry(): CacheEntry<T> {
    if (!cache.has(key)) {
      cache.set(key, ({ effects: [] } as unknown) as CacheEntry<T>)
    }

    return cache.get(key) as CacheEntry<T>
  }

  function setCacheValue(nextCacheValuePatch: any) {
    let cacheEntry = getCacheEntry()

    for (let patchKey in nextCacheValuePatch) {
      // @ts-ignore
      cacheEntry[patchKey] = nextCacheValuePatch[patchKey]
    }

    let nextValue = getNextValue()
    cacheEntry.effects.forEach((setEffectValue: any) => {
      setEffectValue({
        ...nextValue,
        data: deq(cacheEntry.data, nextValue.data)
          ? cacheEntry.data
          : nextValue.data,
      })
    })
  }

  function mutate(nextData: T) {
    setCacheValue({ isValidating: false, data: nextData })
  }

  function revalidate() {
    if (isDocumentVisible() && isOnline()) {
      setCacheValue({ isValidating: true })
      const runFetch = fetcher || _fetcher

      if (key) {
        Promise.resolve(runFetch(key))
          .then(mutate)
          .catch((error) => {
            setCacheValue({
              error,
            })
          })
      }
    }
  }

  useEffect(() => {
    let { isValidating, effects } = getCacheEntry()
    effects.push(setValue)

    if (!isValidating && key) revalidate()

    // Revalidate on interval
    if (options?.refreshInterval) {
      revalidateInterval.current = setInterval(
        revalidate,
        options.refreshInterval,
      )
    }

    // Revalidate on focus/reconnect
    if (options?.revalidateOnFocus) {
      window.addEventListener('visibilitychange', revalidate, false)
      window.addEventListener('focus', () => revalidate, false)
    }

    if (options?.revalidateOnReconnect) {
      window.addEventListener('online', revalidate, false)
    }

    return () => {
      effects.splice(effects.indexOf(setValue), 1)
      if (!effects.length) cache.delete(key)

      clearInterval(revalidateInterval.current)

      if (options?.revalidateOnFocus) {
        window.removeEventListener('visibilitychange', revalidate, false)
        window.removeEventListener('focus', () => revalidate, false)
      }

      if (options?.revalidateOnReconnect) {
        window.removeEventListener('online', revalidate, false)
      }
    }
  }, [key])

  return value
}

export default useSWR

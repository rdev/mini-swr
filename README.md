![SWR](https://i.imgur.com/bFWzdSy.png)

<p align="center">
  <a aria-label="NPM version" href="https://www.npmjs.com/package/mini-swr">
    <img alt="" src="https://badgen.net/npm/v/mini-swr">
  </a>
  <a aria-label="Package size" href="https://bundlephobia.com/result?p=mini-swr">
    <img alt="" src="https://badgen.net/bundlephobia/minzip/mini-swr">
  </a>
  <a aria-label="License" href="https://github.com/rdev/mini-swr/blob/master/LICENSE">
    <img alt="" src="https://badgen.net/npm/license/mini-swr">
  </a>
</p>

## Introduction

miniSWR is a tiny (<1kb gzipped) baseline implementation of [SWR](https://swr.vercel.com) by Vercel, intended for use with Preact.

## Features

- SWR-like API
- Interval polling
- Revalidate on focus
- Revalidate on reconnect
- Conditional fetching
- TypeScript support

## Not features, but maybe eventually features

- Pagination
- Global Configuration
- Error Retry
- Initial Data


## Getting Started

1. Install the package:

```bash
yarn add mini-swr
```

2. Use the same API as SWR:

```js
import useSWR from 'mini-swr'

const useProfile = (userId) => {
  // Fetcher won't fire if userId isn't ready yet
  return useSWR(userId ? `/api/user/${userId}` : null, fetcher)
}

function Profile(userId) {
  const { data, error } = useProfile(userId)

  if (error) return <div>failed to load</div>
  if (!data) return <div>loading...</div>

  return <div>hello {data.name}!</div>
}
```

## API

```js
const { data, error, isValidating, mutate } = useSWR(key, fetcher, options)
```

#### Parameters

- `key`: a unique key string for the request (or a function / array / null)
- `fetcher`: (_optional_) a Promise returning function to fetch your data
- `options`: (_optional_) an object of options for this SWR hook

#### Return Values

- `data`: data for the given key resolved by `fetcher` (or undefined if not loaded)
- `error`: error thrown by `fetcher` (or undefined)
- `isValidating`: if there's a request or revalidation loading
- `mutate(data?, shouldRevalidate?)`: function to mutate the cached data

#### Options

- `revalidateOnFocus = true`: auto revalidate when window gets focused
- `revalidateOnReconnect = true`: automatically revalidate when the browser regains a network connection (via `navigator.onLine`)
- `refreshInterval = 0`: polling interval (disabled by default)

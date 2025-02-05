import getRethink from '../database/rethinkDriver'
import * as fs from 'fs'

const storePersistedQueries = async () => {
  const queryMap = require('../graphql/queryMap.json')
  const hashes = Object.keys(queryMap)
  const records = hashes.map((hash) => ({
    id: hash,
    query: queryMap[hash]
  }))

  const r = getRethink()
  const res = await r.table('QueryMap').insert(records, {conflict: 'replace'})
  r.getPoolMaster().drain()
  fs.unlinkSync('packages/server/graphql/queryMap.json')
  console.log(`Added ${res.inserted} records to the queryMap`)
}

storePersistedQueries().catch()

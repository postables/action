import getDotenv from '../../server/utils/dotenv'
import migrate from 'migrate-rethinkdb'
import {parse} from 'url'

getDotenv()

const startMigration = () => {
  const [, , direction, count] = process.argv
  const all = count === '--all'
  if (process.env.NODE_ENV === 'test') {
    console.log('NODE_ENV is test, loading .env.test...')
  }

  const {hostname, port, path} = parse(process.env.RETHINKDB_URL)
  process.env.host = hostname
  process.env.port = port
  process.env.db = path.slice(1)
  process.env.r = process.cwd()
  const close = () => {
    process.exit()
  }
  migrate[direction]({all, root: __dirname}).then(close, close)
}

startMigration()

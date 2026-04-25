import 'server-only'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: false,
  max: 10,
  idle_timeout: 30,
})

export default sql

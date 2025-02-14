import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import materialsApp from './app/materials/materials.controller';

const app = new Hono()
app.route('/api', materialsApp);

app.get('/', (c) => {
  return c.text('Hello from webhooks-poc!')
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})

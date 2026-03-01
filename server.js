const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
const hostname = process.env.HOSTNAME || '0.0.0.0'

const app = next({ dev: false })
const handle = app.getRequestHandler()

app.prepare().then(() => {
    createServer((req, res) => {
        const parsedUrl = parse(req.url, true)
        handle(req, res, parsedUrl)
    }).listen(port, hostname, (err) => {
        if (err) throw err
        console.log(`> Next.js server ready on http://${hostname}:${port}`)
    })
}).catch((err) => {
    console.error('Failed to start Next.js server:', err)
    process.exit(1)
})

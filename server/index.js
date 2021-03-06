const express = require('express')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const bodyParser = require('body-parser')
const { check, validationResult} = require('express-validator')
const bcrypt = require('bcryptjs')
const app = express()
const session = require('express-session')
const Web3 = require('web3')

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = process.env.NODE_ENV !== 'production'

const models = require('./models/index.js')

async function start() {

  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  await nuxt.ready()
  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(session({
    secret: '010b4cb83bf8b1e96b49bd28',
    resave: false,
    saveUninitialized: false
  })
  )

  app.post(
    '/api/users', 
    [
      check('email')
        .isEmail()
        .normalizeEmail(), 
        check('password').isLength({min: 6})
      ],
      async (req,res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log(errors)
      return res.status(422).json({ errors: errors.array(
      )   })
    }
    console.log(req.body)

    try {
      const salt = await bcrypt.genSalt(10)
      console.log(salt)

      const hash = await bcrypt.hash(req.body.password, salt)
      models.User.create({
        email: req.body.email, 
        password: hash
      })

      req.session.user ={
        isAuthenticated: true
      }

      res.status(200).json(req.session.user)
    } catch (err) {
      console.log(err)
    }
  }
)

  app.post('/api/logout', (req,res) => {
    req.session.destroy((err) => {
      console.log('12345')
      res.end()
    })
  })
 
  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()

/** @file Index file. */
import App from "./app.js"

const app = new App()

try {
  app.run()
} catch (/** @type {any} */ err) {
  console.error(err.message)
}

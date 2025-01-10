import fsp from "fs/promises"
import fs from "fs"
import path from "path"
import archiver from "archiver"

const args = process.argv.slice(2)

if (args.length !== 1) {
  console.error("Usage: node script.js <directory>.epub")
  process.exit(1)
}

const inputDir = args[0]

if (!inputDir.endsWith(".epub")) {
  console.error("The directory name must end with .epub")
  process.exit(1)
}

const dirName = path.basename(inputDir, ".epub")
const parentDir = path.dirname(inputDir)
const newDir = path.join(parentDir, dirName)
const zipFileName = `${inputDir}.zip`

async function renameAndZip() {
  try {
    await fsp.rename(inputDir, newDir)
    console.log(`Directory renamed to ${newDir}`)

    const output = fs.createWriteStream(zipFileName)
    const archive = archiver("zip", { zlib: { level: 9 } })

    output.on("close", async () => {
      console.log(`Zipped ${archive.pointer()} total bytes`)

      try {
        await fsp.rename(zipFileName, `${parentDir}/${dirName}.epub`)
        console.log("Zipping and renaming completed successfully.")
      } catch (err) {
        console.error(`Failed to rename zip file: ${err}`)
        process.exit(1)
      }
    })

    archive.on("error", (err) => {
      console.error(`Archive error: ${err}`)
      process.exit(1)
    })

    archive.pipe(output)
    archive.directory(newDir, false)
    await archive.finalize()
  } catch (err) {
    console.error(`Error: ${err}`)
    process.exit(1)
  }
}

renameAndZip()

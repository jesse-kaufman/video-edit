import { exec } from "child_process"
import { existsSync } from "fs"
import { extname, basename } from "path"

// Function to execute an ffmpeg command
function runFFmpegCommand(command, callback) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`)
      return
    }
    console.log(`stdout: ${stdout}`)
    if (callback) callback()
  })
}

// Get command line arguments
const args = process.argv.slice(2)
const timeToTrim = parseInt(args[0], 10)
const inputFile = args[1]

if (!inputFile || isNaN(timeToTrim)) {
  console.error("Usage: node trimVideo.js <timeToTrimInSeconds> <videoFile>")
  process.exit(1)
}

// Check if file exists
if (!existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`)
  process.exit(1)
}

// Get the output file name
const ext = extname(inputFile)
const baseName = basename(inputFile, ext)
const outputFile = `${baseName}_trimmed${ext}`

// Get the duration of the input video
const getDurationCommand = `ffprobe -i "${inputFile}" -show_entries format=duration -v quiet -of csv="p=0"`

exec(getDurationCommand, (error, stdout) => {
  if (error) {
    console.error(`Error fetching video duration: ${error.message}`)
    return
  }

  const duration = parseFloat(stdout)
  if (isNaN(duration) || duration <= timeToTrim) {
    console.error("Invalid duration or time to trim exceeds video length.")
    return
  }

  const trimDuration = duration - timeToTrim

  // Construct the ffmpeg command
  const ffmpegCommand = `ffmpeg -i "${inputFile}" -t ${trimDuration} -c copy "${outputFile}"`

  // Execute the ffmpeg command
  runFFmpegCommand(ffmpegCommand, () =>
    console.log(`Trimmed video saved as ${outputFile}`)
  )
})

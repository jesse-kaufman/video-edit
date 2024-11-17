# Video Edit

A wrapper to ffmpeg that simplifies repetative tasks related to managing downloaded movies.

`npm start [command] [inputFile]`

## Commands

### `extract-subs`

Extracts all text-based English subtitles from input file to subrip format.

### `set-metadata`\*

Sets metadata on streams in input file. _(TODO)_

### `cleanup`

- Runs `extract-subs`
- Strips all non-English audio streams
- Strips all non-English subtitles
- Sets language to "eng" on all streams
- Sets audio / subtitle stream titles appropriately

### `convert-audio`

- Removes all non-English audio streams
- Converts all remaining audio streams to AAC (if not already in AAC format)
  - _Uses `libfdk_aac` encoder if present, otherwise falls back to the default `aac` encoder_
- Sets language metadata on audio stream to "eng"

### `convert-video`

- Converts main video stream to h265

### `full`

- Runs `extract-subs`
- Removes all non-English audio streams
- Removes all non-English subtitle streams
- Removes all text-based subtitle streams
- Converts all remaining audio streams to AAC (if not already in that format)
- Converts primary video stream to h265 (if not already in that format)

_\* Commands marked with an asterisk are not yet implemented._

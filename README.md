# Video Edit
A wrapper to ffmpeg that simplifies repetative tasks related to managing downloaded movies.

## Commands
### ```extract-subs```
Extracts text-based English subtitles from input file to subrip format.

### ```set-metadata```
Sets metadata on streams in input file. _(TODO)_

### ```cleanup```
Cleans up input file by doing the following:
  - strips all non-English audio streams
  - strips all non-English subtitles
  - strips all text-based subtitles (e.g. SRT, ASS, SSA)
  - sets language to "eng" globally
  - sets audio / subtitle stream titles appropriately

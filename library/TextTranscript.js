import * as Text from "./Text.js";

function padded(text, marker) {
  return Text.padLines(String(text).split("\n"), 2, marker).join("\n") + "\n";
}

function wrapped(marker, text, width, prose = false) {
  let lines = String(text).split("\n");
  let wrapped = Text.wrapLines(lines, width - 4, prose);
  let padded = Text.padLines(wrapped, 2, marker);
  return padded.join("\n") + "\n";
}

function writeEntry(out, entry, width) {
  switch (entry.type) {
    case "agent":
      out.write(wrapped("⏵", entry.text, width, true));
      break;

    case "tool":
      out.write(wrapped(entry.marker, entry.text, width));
      if (entry.result?.output !== undefined)
        out.write(padded(entry.result.output));
      if (entry.result?.error !== undefined)
        out.write("Tool failed: " + padded(entry.result.error));
      break;
  }
}

export function write(out, transcript, options = {}) {
  let width = options.width ?? 80;

  if (transcript.prompt.user.length > 0) {
    transcript.prompt.user.forEach(text => out.write(wrapped(">", text, width, true)));
    out.write("\n");
  }

  if (transcript.prompt.system.length > 0) {
    transcript.prompt.system.forEach(text => out.write(wrapped("#", text, width, true)));
    out.write("\n");
  }

  out.write(wrapped("●", `${transcript.session}: ${transcript.start.join(", ")}`, width));
  out.write("\n");

  for (let entry of transcript.entries) {
    writeEntry(out, entry, width);
    out.write("\n");
  }

  if (transcript.error !== undefined) {
    out.write(padded(transcript.error, "✕"));
    out.write("\n");
  }

  out.write(wrapped("■", transcript.done.join(", "), width));
}

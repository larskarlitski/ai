export function wrap(text, options = {}) {
  let margin = Number(options.margin ?? 0);
  let width = Number(options.width ?? 80) - (2 * margin);
  let marker = String(options.marker ?? "").padEnd(margin);
  let prefixRegExp = (options.prefixPatterns
    ? new RegExp("^((?:" + options.prefixPatterns.join("|") + "))")
    : new RegExp("^()")
  );

  let lines = [];
  let current = marker;

  for (let line of String(text).split("\n")) {
    let m = line.match(prefixRegExp);
    let leading = m !== null ? m[1] : "";
    let words = line.substring(leading.length).split(/\s+/);

    if (leading.length === 0 && words.length === 0) {
      lines.push("");
      continue;
    }

    current += `${leading}${words[0]}`;

    for (let i = 1; i < words.length; i++) {
      let word = words[i];
      if (current.length + 1 + word.length <= width) {
        current += ` ${word}`;
      } else {
        lines.push(current);
        current = `${"".padStart(margin + leading.length)}${word}`;
      }
    }
    lines.push(current);
    current = "".padStart(margin);
  }

  return lines.join("\n");
}

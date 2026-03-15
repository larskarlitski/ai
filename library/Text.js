export function wrapLines(lines, width, prose = false) {
  let pattern = (prose
    ? /^(\s*)((?:#+|[-*]|\d+\.) )?(.*)$/
    : /^(\s*)()(.*)$/
  );

  let out = [];
  for (let line of lines) {
    let m = line.match(pattern);
    let indent = m[1];
    let leading = m[2] ?? "";
    let words = m[3].trim().split(/\s+/);

    if (words.length === 1 && words[0] === "") {
      out.push("");
      continue;
    }

    let current = `${indent}${leading}${words[0]}`;
    for (let i = 1; i < words.length; i++) {
      let word = words[i];
      if (current.length + 1 + word.length <= width) {
        current += ` ${word}`;
      } else {
        out.push(current);
        current = `${indent}${"".padStart(leading.length)}${word}`;
      }
    }

    out.push(current);
  }

  return out;
}

export function truncateLines(lines, width) {
  let out = [];

  for (let line of lines) {
    if (line.length <= width)
      out.push(line);
    else
      out.push(line.slice(0, width - 1) + "…");
  }

  return out;
}

export function padLines(lines, padding, marker = "") {
  if (lines.length === 0)
    return [];

  let out = [ marker.padEnd(padding) + lines[0] ];
  let indent = "".padEnd(padding);

  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];
    if (lines[i].length > 0)
      out.push(indent + lines[i]);
    else
      out.push("");
  }

  return out;
}

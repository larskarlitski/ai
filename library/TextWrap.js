function spaces(n) {
  return "".padStart(n);
}

function wrapLine(line, margin, width, prefixRegExp) {
  let end = width - margin;
  let m = line.match(prefixRegExp);
  let leading = m !== null ? m[1] : "";
  let words = line.substring(leading.length).split(/\s+/);

  if (leading.length === 0 && words.length === 0)
    return "";

  let lines = [];
  let current = `${spaces(margin)}${leading}${words[0]}`;

  for (let i = 1; i < words.length; i++) {
    let word = words[i];
    if (current.length + 1 + word.length <= end) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = `${spaces(margin + leading.length)}${word}`;
    }
  }
  lines.push(current);

  return lines.join("\n");
}

export function wrap(text, options = {}) {
  let margin = options.margin ?? 0;
  let width = options.width ?? 80;
  let prefixRegExp = (options.prefixPatterns
    ? new RegExp("^((?:" + options.prefixPatterns.join("|") + ")\\s*)")
    : new RegExp("^()")
  );

  return String(text).split("\n").map(
    line => wrapLine(line, margin, width, prefixRegExp)
  ).join("\n");
}

export function browserCommand(platform, url) {
  if (platform === "darwin") return ["/usr/bin/open", [url]];
  if (platform === "linux") return ["xdg-open", [url]];
  if (platform === "win32")
    return ["rundll32.exe", ["url.dll,FileProtocolHandler", url]];
  return null;
}

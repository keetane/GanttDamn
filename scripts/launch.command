#!/bin/zsh -l
cd -- "${0:A:h:h}" || exit 1
if ! command -v node >/dev/null 2>&1; then
  for candidate in "$HOME"/.nvm/versions/node/*/bin/node(NOn); do
    export PATH="${candidate:h}:$PATH"
    break
  done
fi
if ! command -v node >/dev/null 2>&1; then
  print 'Node.js 22.12以降をインストールしてください。'
  read '?Enterで閉じる'
  exit 1
fi
node scripts/launcher.mjs
if [[ $? -ne 0 ]]; then
  read '?起動できませんでした。Enterで閉じる'
fi

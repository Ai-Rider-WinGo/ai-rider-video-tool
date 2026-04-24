#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")/.."

export ELECTRON_MIRROR="${ELECTRON_MIRROR:-https://npmmirror.com/mirrors/electron/}"

npm install

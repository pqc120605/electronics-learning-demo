#!/usr/bin/env bash
set +x
set -euo pipefail
umask 077

dir="$HOME/.config/mach-mo"
config="$dir/guide-openai-staging.env"
if [[ -L $dir || -L $config || -e $config ]]; then
  printf '%s\n' 'Đã có cấu hình thử hoặc đường dẫn không phù hợp. Dừng để giữ cấu hình hiện có.' >&2
  exit 1
fi
if [[ ! -d $dir ]]; then install -d -m 700 "$dir"; fi

printf '%s' 'Dán OpenAI API key rồi nhấn Enter (ký tự sẽ ẩn): ' > /dev/tty
IFS= read -rs openai_key < /dev/tty
printf '\n' > /dev/tty
if [[ ! $openai_key =~ ^sk-[A-Za-z0-9_-]{20,}$ ]]; then
  printf '%s\n' 'Định dạng API key không phù hợp.' >&2
  exit 1
fi

draft=$(mktemp "$dir/guide-openai-staging.XXXXXXXX")
trap 'unlink -- "$draft"' EXIT
printf '%s\n' 'GUIDE_AI_PROVIDER=openai' 'OPENAI_MODEL=gpt-6-luna' \
  'OPENAI_REASONING_EFFORT=none' 'GUIDE_AI_DAILY_REQUEST_CAP=20' \
  "OPENAI_API_KEY=$openai_key" > "$draft"
unset openai_key GUIDE_AI_PROVIDER OPENAI_MODEL OPENAI_REASONING_EFFORT OPENAI_API_KEY
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
node --env-file="$draft" "$script_dir/check-guide-openai.mjs"
ln -T -- "$draft" "$config"
printf '%s\n' 'Đã lưu cấu hình OpenAI staging mode 600. Bản thử chưa nối vào Vercel.'

#!/usr/bin/env bash

set -euo pipefail

BOT_TOKEN=""
CHAT_ID=""

DOCKER="/usr/bin/docker"
OFFSET=0

TEST_MODE=false

MAX_LOG_LINES=2000
MAX_FILE_SIZE=45000000

command -v jq >/dev/null 2>&1 || exit 1
command -v curl >/dev/null 2>&1 || exit 1

send_msg() {
  [[ "$TEST_MODE" == true ]] && return

  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    --data-urlencode "text=$1" >/dev/null
}

send_main_menu() {
  [[ "$TEST_MODE" == true ]] && return

  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=Select action:" \
    -d 'reply_markup={"inline_keyboard":[[{"text":"Logs","callback_data":"logs"},{"text":"Restart","callback_data":"restart"}]]}' >/dev/null
}

send_containers() {
  [[ "$TEST_MODE" == true ]] && return

  mode="$1"

  containers=$($DOCKER ps -a --format '{{.Names}}')

  keyboard=$(echo "$containers" | jq -R -s -c --arg mode "$mode" '
    split("\n")[:-1] |
    map([{"text": ., "callback_data": ($mode + ":" + .)}])
  ')

  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=Select container:" \
    -d "reply_markup={\"inline_keyboard\": $keyboard}" >/dev/null
}

send_file() {
  [[ "$TEST_MODE" == true ]] && return

  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendDocument" \
    -F "chat_id=${CHAT_ID}" \
    -F "document=@$1" \
    -F "caption=$2" >/dev/null
}

get_logs() {
  container="$1"
  file="$2"

  log_path=$($DOCKER inspect --format='{{.LogPath}}' "$container" 2>/dev/null || true)

  if [[ -z "$log_path" || ! -f "$log_path" ]]; then
    echo "log file not found for $container" > "$file"
    return
  fi

  tail -n "$MAX_LOG_LINES" "$log_path" | jq -r '.log' > "$file" 2>/dev/null || true

  if [[ ! -s "$file" ]]; then
    echo "log not available for $container" > "$file"
    return
  fi

  size=$(stat -c%s "$file")

  if [[ "$size" -gt "$MAX_FILE_SIZE" ]]; then
    tail -c "$MAX_FILE_SIZE" "$file" > "${file}.tmp"
    mv "${file}.tmp" "$file"
  fi
}

send_msg "BOT STARTED"

while true; do

  res=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${OFFSET}")

  count=$(echo "$res" | jq '.result | length')

  if [[ "$count" -eq 0 ]]; then
    sleep 1
    continue
  fi

  OFFSET=$(echo "$res" | jq -r '.result[-1].update_id + 1')

  echo "$res" | jq -c '.result[]' | while read -r update; do

    text=$(echo "$update" | jq -r '.message.text // empty')
    cb=$(echo "$update" | jq -r '.callback_query.data // empty')

    if [[ "$cb" == logs:* ]]; then

      container="${cb#logs:}"

      file="/tmp/${container}.log"

      get_logs "$container" "$file"

      send_file "$file" "$container"

      rm -f "$file"

      continue
    fi


    if [[ "$text" =~ ^/list(@[a-zA-Z0-9_]+)?$ ]]; then
      send_main_menu
      continue
    fi


    if [[ "$cb" == "logs" ]]; then
      send_containers "logs"
      continue
    fi


    if [[ "$cb" == "restart" ]]; then
      send_containers "restart"
      continue
    fi


    if [[ "$cb" == restart:* ]]; then

      container="${cb#restart:}"

      $DOCKER restart "$container" >/dev/null 2>&1

      send_msg "Restarted: $container"

      continue
    fi

  done

  sleep 1

done

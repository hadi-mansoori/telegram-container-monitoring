#!/usr/bin/env bash

exec >>/var/log/app-bot.log 2>&1

set -uo pipefail

BOT_TOKEN=""
CHAT_ID=""

DOCKER="/usr/bin/docker"

OFFSET_FILE="/tmp/app-bot.offset"
LOCK_FILE="/tmp/app-bot.lock"

MAX_LOG_LINES=2000
MAX_FILE_SIZE=45000000


exec 200>"$LOCK_FILE"

if ! flock -n 200; then
    echo "$(date) another instance is running"
    exit 0
fi


OFFSET=0

if [[ -f "$OFFSET_FILE" ]]; then
    OFFSET=$(cat "$OFFSET_FILE" 2>/dev/null || echo 0)
fi


send_api()
{
    curl -s --max-time 30 "$@" || true
}


send_msg()
{
    send_api \
    -X POST \
    "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    --data-urlencode "text=$1" >/dev/null
}


answer_callback()
{
    local callback_id="$1"

    [[ -z "$callback_id" ]] && return

    send_api \
    -X POST \
    "https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery" \
    -d "callback_query_id=${callback_id}" >/dev/null
}


send_main_menu()
{
    send_api \
    -X POST \
    "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=Select action:" \
    -d 'reply_markup={"inline_keyboard":[[{"text":"Logs","callback_data":"logs"},{"text":"Restart","callback_data":"restart"}]]}' >/dev/null
}


send_containers()
{
    mode="$1"

    containers=$(
        $DOCKER ps -a --format '{{.Names}}' 2>/dev/null || true
    )


    keyboard=$(echo "$containers" | jq -R -s -c --arg mode "$mode" '
    split("\n")
    | map(select(length>0))
    | map([{"text":., "callback_data":($mode+":"+.)}])
    ')


    send_api \
    -X POST \
    "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=Select container:" \
    -d "reply_markup={\"inline_keyboard\":$keyboard}" >/dev/null
}


send_file()
{
    file="$1"
    caption="$2"


    send_api \
    -X POST \
    "https://api.telegram.org/bot${BOT_TOKEN}/sendDocument" \
    -F "chat_id=${CHAT_ID}" \
    -F "document=@${file}" \
    -F "caption=${caption}" >/dev/null
}


get_logs()
{
    container="$1"
    output="$2"


    log_path=$(
        $DOCKER inspect \
        --format='{{.LogPath}}' \
        "$container" 2>/dev/null || true
    )


    if [[ -z "$log_path" || ! -f "$log_path" ]]; then
        echo "log file not found" > "$output"
        return
    fi


    tail -n "$MAX_LOG_LINES" "$log_path" 2>/dev/null \
    | jq -r '.log' > "$output" 2>/dev/null || true


    if [[ ! -s "$output" ]]; then
        echo "log unavailable" > "$output"
        return
    fi


    size=$(stat -c%s "$output" 2>/dev/null || echo 0)


    if [[ "$size" -gt "$MAX_FILE_SIZE" ]]; then
        tail -c "$MAX_FILE_SIZE" "$output" > "${output}.tmp"
        mv "${output}.tmp" "$output"
    fi
}



send_msg "BOT STARTED"


while true
do

    response=$(
        curl -s --max-time 40 \
        "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${OFFSET}" \
        || true
    )


    if echo "$response" | jq -e '.error_code == 409' >/dev/null 2>&1
    then
        echo "$(date) telegram 409 conflict"
        sleep 10
        continue
    fi


    if ! echo "$response" | jq -e '.ok == true' >/dev/null 2>&1
    then
        echo "$(date) telegram api error"
        sleep 5
        continue
    fi


    count=$(echo "$response" | jq '.result | length')


    if [[ "$count" -eq 0 ]]
    then
        sleep 1
        continue
    fi


    while IFS= read -r update
    do

        update_id=$(echo "$update" | jq -r '.update_id')


        OFFSET=$((update_id + 1))
        echo "$OFFSET" > "$OFFSET_FILE"


        text=$(echo "$update" | jq -r '.message.text // empty')

        callback=$(echo "$update" | jq -r '.callback_query.data // empty')

        callback_id=$(echo "$update" | jq -r '.callback_query.id // empty')


        answer_callback "$callback_id"


        if [[ "$text" =~ ^/list(@[a-zA-Z0-9_]+)?$ ]]
        then
            send_main_menu
            continue
        fi


        case "$callback" in

            logs)
                send_containers "logs"
                ;;


            restart)
                send_containers "restart"
                ;;


            logs:*)
                container="${callback#logs:}"

                file="/tmp/${container}.log"

                get_logs "$container" "$file"

                send_file "$file" "$container"

                rm -f "$file"
                ;;


            restart:*)
                container="${callback#restart:}"

                $DOCKER restart "$container" >/dev/null 2>&1 || true

                send_msg "Restarted: $container"
                ;;

        esac


    done < <(echo "$response" | jq -c '.result[]')


done

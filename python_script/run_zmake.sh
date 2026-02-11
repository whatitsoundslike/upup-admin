#!/bin/bash
LOG_DIR="/Users/jiseong-in/workspace/upup-admin/python_script/logs"
SCRIPT_PATH="/Users/jiseong-in/workspace/upup-admin/python_script/zmake_all_json.py"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
LOG_FILE="${LOG_DIR}/run_${TIMESTAMP}.log"

echo "===== 실행 시작: $(date '+%Y-%m-%d %H:%M:%S') =====" > "$LOG_FILE"
echo "스크립트: $SCRIPT_PATH" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

python3 "$SCRIPT_PATH" >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

echo "" >> "$LOG_FILE"
echo "===== 실행 완료: $(date '+%Y-%m-%d %H:%M:%S') =====" >> "$LOG_FILE"
echo "종료 코드: $EXIT_CODE" >> "$LOG_FILE"

# 30일 이상된 로그 삭제
find "$LOG_DIR" -name 'run_*.log' -mtime +30 -delete


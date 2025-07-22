#!/bin/bash

# scripts/scaffold-ai.sh - AI助手友好的脚手架工具包装器 (TypeScript版本)

# 设置JSON输出模式
export SCAFFOLD_JSON_OUTPUT=true

# 脚手架工具的路径
SCAFFOLD_BIN="flexible-scaffold"

# 检查是否在开发模式
if [ -f "dist/index.js" ]; then
    SCAFFOLD_BIN="node dist/index.js"
elif [ -f "src/index.ts" ]; then
    SCAFFOLD_BIN="npx tsx src/index.ts"
fi

# 检查参数
if [ $# -eq 0 ]; then
    echo '{"success": false, "error": "需要提供命令参数", "usage": "scaffold-ai <command> [args...]"}'
    exit 1
fi

# 创建临时文件存储输出
temp_file=$(mktemp)
temp_error=$(mktemp)

# 清理函数
cleanup() {
    rm -f "$temp_file" "$temp_error"
}

# 设置清理陷阱
trap cleanup EXIT

# 执行命令并捕获输出
timeout 300 $SCAFFOLD_BIN "$@" >"$temp_file" 2>"$temp_error"
exit_code=$?

# 读取输出和错误
output=$(cat "$temp_file")
error_output=$(cat "$temp_error")

# 如果命令超时
if [ $exit_code -eq 124 ]; then
    echo '{"success": false, "error": "命令执行超时（5分钟）"}'
    exit 1
fi

# 合并标准输出和错误输出
combined_output="$output"
if [ -n "$error_output" ]; then
    if [ -n "$combined_output" ]; then
        combined_output="$combined_output\n$error_output"
    else
        combined_output="$error_output"
    fi
fi

# 尝试解析JSON输出，如果不是JSON则包装成JSON
if echo "$combined_output" | jq . >/dev/null 2>&1; then
    # 已经是有效的JSON
    echo "$combined_output"
else
    # 不是JSON，包装成JSON格式
    if [ $exit_code -eq 0 ]; then
        jq -n --arg output "$combined_output" '{"success": true, "output": $output}'
    else
        jq -n --arg error "$combined_output" '{"success": false, "error": $error}'
    fi
fi

exit $exit_code
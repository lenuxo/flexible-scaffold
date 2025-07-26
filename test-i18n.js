#!/usr/bin/env node

// 测试国际化功能的简单脚本
const { spawn } = require('child_process');

function testLanguage(lang) {
  console.log(`\n=== 测试 ${lang} 语言 ===`);
  
  const child = spawn('node', ['dist/index.js', '--help', '--lang', lang], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  child.stdout.on('data', (data) => {
    output += data.toString();
  });

  child.stderr.on('data', (data) => {
    output += data.toString();
  });

  child.on('close', (code) => {
    console.log(`语言 ${lang} 测试完成，退出码: ${code}`);
    
    // 检查关键字符串
    if (lang === 'zh') {
      if (output.includes('灵活的项目脚手架工具')) {
        console.log('✅ 中文语言包加载成功');
      } else {
        console.log('❌ 中文语言包加载失败');
      }
    } else {
      if (output.includes('Flexible project scaffolding tool')) {
        console.log('✅ 英文语言包加载成功');
      } else {
        console.log('❌ 英文语言包加载失败');
      }
    }
    
    console.log('输出预览:');
    console.log(output.split('\n').slice(0, 5).join('\n'));
  });
}

// 测试两种语言
testLanguage('en');
setTimeout(() => testLanguage('zh'), 1000);
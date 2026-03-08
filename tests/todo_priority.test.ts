
import assert from 'assert';

// 模拟未来的类型
enum TodoPriority {
  P0 = 'P0', // 重要且紧急
  P1 = 'P1', // 重要不紧急
  P2 = 'P2', // 紧急不重要
  P3 = 'P3'  // 不重要不紧急
}

function mapOldPriority(old: string | undefined): TodoPriority {
  // 目前还没有实现，先返回固定值导致测试失败
  return TodoPriority.P3;
}

try {
  console.log('Running Priority Mapping Tests...');
  
  assert.strictEqual(mapOldPriority('high'), TodoPriority.P0, 'high should map to P0');
  assert.strictEqual(mapOldPriority('medium'), TodoPriority.P1, 'medium should map to P1');
  assert.strictEqual(mapOldPriority('low'), TodoPriority.P3, 'low should map to P3');
  assert.strictEqual(mapOldPriority(undefined), TodoPriority.P3, 'undefined should map to P3');

  console.log('✅ All mapping tests passed!');
} catch (error: any) {
  console.error('❌ Test failed:');
  console.error(error.message);
  process.exit(1);
}

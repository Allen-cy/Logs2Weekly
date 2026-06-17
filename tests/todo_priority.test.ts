
import assert from 'assert';
import { TodoPriority } from '../types.ts';
import { normalizeTodoPriority } from '../utils/todoPriority.ts';

try {
  console.log('Running Priority Mapping Tests...');
  
  assert.strictEqual(normalizeTodoPriority('high'), TodoPriority.P0, 'high should map to P0');
  assert.strictEqual(normalizeTodoPriority('medium'), TodoPriority.P1, 'medium should map to P1');
  assert.strictEqual(normalizeTodoPriority('low'), TodoPriority.P3, 'low should map to P3');
  assert.strictEqual(normalizeTodoPriority(TodoPriority.P2), TodoPriority.P2, 'current P2 should stay P2');
  assert.strictEqual(normalizeTodoPriority(undefined), TodoPriority.P3, 'undefined should map to P3');
  assert.strictEqual(normalizeTodoPriority('unknown'), TodoPriority.P3, 'unknown values should map to P3');

  console.log('✅ All mapping tests passed!');
} catch (error: any) {
  console.error('❌ Test failed:');
  console.error(error.message);
  process.exit(1);
}

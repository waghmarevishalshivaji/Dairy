// Test script for billing cycle calculation logic
// Run with: node test-billing-cycle.js

function calculateBillingPeriod(date, billingDays) {
  const currentDate = new Date(date);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  const monthEnd = new Date(year, month + 1, 0).getDate();

  // Calculate all periods for the month
  const periods = [];
  let start = 1;
  
  while (start <= monthEnd) {
    let end = Math.min(start + billingDays - 1, monthEnd);
    periods.push({ start, end });
    start = end + 1;
  }
  
  // If the last period has only 1 day, merge it with the previous period
  if (periods.length > 1 && periods[periods.length - 1].end - periods[periods.length - 1].start === 0) {
    const lastPeriod = periods.pop();
    periods[periods.length - 1].end = lastPeriod.end;
  }
  
  // Find which period the day falls into
  let periodStart = 1;
  let periodEnd = billingDays;
  
  for (const period of periods) {
    if (day >= period.start && day <= period.end) {
      periodStart = period.start;
      periodEnd = period.end;
      break;
    }
  }

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(periodStart).padStart(2, '0')}`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(periodEnd).padStart(2, '0')}`;

  return {
    date,
    billingDays,
    monthEnd,
    periodStart,
    periodEnd,
    startDate,
    endDate,
    range: `${periodStart}-${periodEnd}`
  };
}

// Test cases
const testCases = [
  // 10-day cycle tests
  { date: '2025-11-22', days: 10, expected: '21-30', desc: '10-day cycle, Nov 22 (30-day month)' },
  { date: '2025-10-31', days: 10, expected: '21-31', desc: '10-day cycle, Oct 31 (31-day month)' },
  { date: '2025-10-01', days: 10, expected: '1-10', desc: '10-day cycle, Oct 1 (first period)' },
  { date: '2025-10-10', days: 10, expected: '1-10', desc: '10-day cycle, Oct 10 (end of first period)' },
  { date: '2025-10-11', days: 10, expected: '11-20', desc: '10-day cycle, Oct 11 (start of second period)' },
  { date: '2025-10-20', days: 10, expected: '11-20', desc: '10-day cycle, Oct 20 (end of second period)' },
  { date: '2025-10-21', days: 10, expected: '21-31', desc: '10-day cycle, Oct 21 (start of third period)' },
  
  // 15-day cycle tests
  { date: '2025-11-22', days: 15, expected: '16-30', desc: '15-day cycle, Nov 22 (30-day month)' },
  { date: '2025-10-31', days: 15, expected: '16-31', desc: '15-day cycle, Oct 31 (31-day month)' },
  { date: '2025-10-01', days: 15, expected: '1-15', desc: '15-day cycle, Oct 1 (first period)' },
  { date: '2025-10-15', days: 15, expected: '1-15', desc: '15-day cycle, Oct 15 (end of first period)' },
  { date: '2025-10-16', days: 15, expected: '16-31', desc: '15-day cycle, Oct 16 (start of second period)' },
  
  // February tests (28 days) - last period is whatever remains
  { date: '2025-02-22', days: 10, expected: '21-28', desc: '10-day cycle, Feb 22 (28-day month)' },
  { date: '2025-02-28', days: 10, expected: '21-28', desc: '10-day cycle, Feb 28 (last day of 28-day month)' },
  { date: '2025-02-15', days: 15, expected: '1-15', desc: '15-day cycle, Feb 15 (28-day month)' },
  { date: '2025-02-16', days: 15, expected: '16-28', desc: '15-day cycle, Feb 16 (28-day month)' },
  { date: '2025-02-01', days: 10, expected: '1-10', desc: '10-day cycle, Feb 1 (28-day month)' },
  { date: '2025-02-11', days: 10, expected: '11-20', desc: '10-day cycle, Feb 11 (28-day month)' },
  
  // Leap year February (29 days)
  { date: '2024-02-29', days: 10, expected: '21-29', desc: '10-day cycle, Feb 29 (leap year)' },
  { date: '2024-02-16', days: 15, expected: '16-29', desc: '15-day cycle, Feb 16 (leap year)' },
  
  // 30-day month tests
  { date: '2025-11-30', days: 10, expected: '21-30', desc: '10-day cycle, Nov 30 (last day of 30-day month)' },
  { date: '2025-11-01', days: 10, expected: '1-10', desc: '10-day cycle, Nov 1 (30-day month)' },
];

console.log('='.repeat(80));
console.log('BILLING CYCLE CALCULATION TEST');
console.log('='.repeat(80));
console.log();

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = calculateBillingPeriod(test.date, test.days);
  const success = result.range === test.expected;
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: PASSED`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: FAILED`);
  }
  
  console.log(`   ${test.desc}`);
  console.log(`   Date: ${test.date}, Billing Days: ${test.days}, Month End: ${result.monthEnd}`);
  console.log(`   Expected: ${test.expected}, Got: ${result.range}`);
  console.log(`   Period: ${result.startDate} to ${result.endDate}`);
  console.log();
});

console.log('='.repeat(80));
console.log(`SUMMARY: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
console.log('='.repeat(80));

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed!');
  process.exit(1);
}

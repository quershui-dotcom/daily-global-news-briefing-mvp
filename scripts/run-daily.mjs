import { generateDailyBriefing } from '../src/services/briefing-service.mjs';
import { publishBriefingToHuawei } from '../src/services/huawei-push.mjs';
import { toIsoDate } from '../src/utils/text.mjs';

const date = process.argv[2] || toIsoDate();
const shouldPublish = process.argv.includes('--publish');

const briefing = await generateDailyBriefing({ date });
console.log(`[daily] generated briefing ${briefing.date} with ${briefing.items.length} items`);

if (shouldPublish) {
  const result = await publishBriefingToHuawei(date);
  console.log('[daily] publish result');
  console.log(JSON.stringify(result, null, 2));
}

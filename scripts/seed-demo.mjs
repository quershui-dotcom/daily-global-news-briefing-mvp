import { generateDailyBriefing } from '../src/services/briefing-service.mjs';
import { toIsoDate } from '../src/utils/text.mjs';

const date = process.argv[2] || toIsoDate();
const briefing = await generateDailyBriefing({ date, demo: true });

console.log(`Seeded demo briefing for ${briefing.date}`);

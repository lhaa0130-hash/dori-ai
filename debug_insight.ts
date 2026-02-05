
import { getAllTrends } from './lib/trends';
import { getAllGuides } from './lib/guides';
import path from 'path';

console.log('--- Debugging Insight Data ---');
console.log('CWD:', process.cwd());

try {
    const trends = getAllTrends();
    console.log(`Trends count: ${trends.length}`);
    if (trends.length > 0) {
        console.log('First Trend:', JSON.stringify(trends[0], null, 2));
    } else {
        console.log('No trends found.');
    }
} catch (error) {
    console.error('Error fetching trends:', error);
}

try {
    const guides = getAllGuides();
    console.log(`Guides count: ${guides.length}`);
    if (guides.length > 0) {
        console.log('First Guide:', JSON.stringify(guides[0], null, 2));
    } else {
        console.log('No guides found.');
    }
} catch (error) {
    console.error('Error fetching guides:', error);
}

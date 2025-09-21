import { spawnSync } from 'node:child_process';

const isVercel = !!process.env.VERCEL;
const isProd = process.env.VERCEL_ENV === 'production';
const should = process.env.RUN_LOAD_DATA_ON_BUILD === 'true';

if (!isVercel || !isProd || !should) {
    console.log('[load-data] skip → isVercel:', isVercel, 'isProd:', isProd, 'flag:', should);
    process.exit(0);
}

console.log('[load-data] running...');
const res = spawnSync('npm', ['run', 'run:load-data'], { stdio: 'inherit' });
if (res.status !== 0) process.exit(res.status);
console.log('[load-data] done ✔');

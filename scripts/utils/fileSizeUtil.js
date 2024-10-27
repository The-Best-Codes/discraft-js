import fs from 'fs';
import path from 'path';
import { info, success } from '../../common/utils/logger.js';

export function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function getFileSizes(dir, originalSizes = new Map()) {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });
    const sizes = new Map();

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            const subSizes = await getFileSizes(fullPath, originalSizes);
            for (const [subPath, size] of subSizes) {
                sizes.set(subPath, size);
            }
        } else if (file.name.endsWith('.js')) {
            const stats = await fs.promises.stat(fullPath);
            sizes.set(fullPath, stats.size);
        }
    }
    return sizes;
}

export function displaySizeComparison(originalSizes, newSizes, distPath) {
    let totalOriginal = 0;
    let totalNew = 0;
    const comparisons = [];

    for (const [file, newSize] of newSizes) {
        const relPath = path.relative(distPath, file);
        const srcPath = path.join(process.cwd(), 'src', relPath);
        const originalSize = originalSizes.get(srcPath) || 0;

        totalOriginal += originalSize;
        totalNew += newSize;

        const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
        comparisons.push({
            file: relPath,
            original: formatBytes(originalSize),
            new: formatBytes(newSize),
            reduction: reduction
        });
    }

    info('\nBuild Statistics:');
    info('================');
    comparisons.forEach(({ file, original, new: newSize, reduction }) => {
        info(`${file}:`);
        info(`  Original: ${original}`);
        info(`  Built   : ${newSize}`);
        info(`  Saved   : ${reduction}%\n`);
    });

    const totalReduction = ((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1);
    success('\nTotal Results:');
    success(`Original Size: ${formatBytes(totalOriginal)}`);
    success(`Final Size  : ${formatBytes(totalNew)}`);
    success(`Total Saved : ${totalReduction}%`);
}

import fs from 'fs';
import path from 'path';

const dirs = [
    path.join(process.cwd(), 'content/trend'),
    path.join(process.cwd(), 'content/guides'),
];

function getAllMdFiles(dirPath: string, arrayOfFiles: string[] = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);
    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllMdFiles(fullPath, arrayOfFiles);
        } else {
            if (file.endsWith(".md")) {
                arrayOfFiles.push(fullPath);
            }
        }
    });
    return arrayOfFiles;
}

function fixFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    let modified = false;

    const newLines = lines.map(line => {
        // Check for block math $$ or inline math with potentially bad chars
        if (line.includes('$$') || (line.includes('$') && (line.includes('{') || line.includes('\\')))) {
            modified = true;
            return '[Math Formula Removed]';
        }
        // Also remove the previous failed attempt's HTML comments if any
        if (line.includes('<!-- Math Removed')) {
            modified = true;
            return '[Math Formula Removed]';
        }
        return line;
    });

    if (modified) {
        console.log(`Cleaning math in ${path.basename(filePath)}`);
        fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    }
}

console.log('Starting MDX Math Removal...');
dirs.forEach(dir => {
    const files = getAllMdFiles(dir);
    files.forEach(file => fixFile(file));
});
console.log('Done.');

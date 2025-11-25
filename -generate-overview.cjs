/**
 * _project-scanner.js - Generic project scanner for generating overview documentation
 * Version: 2025.09.25 - Generic project configuration
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const CURRENT_DIR = '.';

class Scanner {
    #projectName;
    #startTime;

    constructor(folderName = CURRENT_DIR, customConfig = {}) {
        // Auto-detect project name from folder or current directory
        this.#projectName = folderName === CURRENT_DIR ?
            path.basename(process.cwd()) :
            path.basename(path.resolve(folderName));
        this.#startTime = Date.now();

        const defaultConfig = {
            rootDir: path.resolve(__dirname, folderName),
            outputFile: path.join(__dirname, `_${this.#projectName}Overview.txt`),
            ignoredPaths: ['LICENCE', '-generate-overview.cjs', 'package-lock.json', `_${this.#projectName}Overview.txt`, 'node_modules', '.git', 'dist', 'build', '.idea', 'target'],
            acceptedExtensions: ['.js', '.css', '.html', '.jsx', '.ts', '.tsx', '.json', '.md', '.java', '.xml', '.properties'],
            encoding: 'utf8',
            maxFileSize: 10 * 1024 * 1024,
            includeHashes: true,
            includeTOC: true,
            includeLineCount: true,
            verboseLogging: true
        };

        this.config = { ...defaultConfig, ...customConfig };
        this.stats = {
            filesProcessed: 0,
            skippedFiles: 0,
            totalSize: 0,
            totalLines: 0,
            errors: [],
            warnings: [],
            fileTypes: new Map(),
            largestFiles: [],
            processingTime: 0
        };
    }

    async #calculateFileHash(filePath) {
        if (!this.config.includeHashes) return null;
        try {
            const fileBuffer = await fs.readFile(filePath);
            const hashSum = crypto.createHash('md5');
            hashSum.update(fileBuffer);
            return hashSum.digest('hex');
        } catch (error) {
            this.stats.warnings.push(`Hash failed for ${filePath}: ${error.message}`);
            return null;
        }
    }

    #countLines(content) {
        return content.split('\n').length;
    }

    #log(message, level = 'info') {
        if (!this.config.verboseLogging && level === 'info') return;
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
        const prefix = { info: '→', warn: '⚠ ', error: '✗' }[level] || '•';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    generateInitialContent() {
        return [
            `# ${this.#projectName} Project Overview\n`,
            '## 1. Development Guidelines',
            '- **DRY** - Don\'t Repeat Yourself',
            '- **KISS** - Keep It Simple & Smart',
            '- **No Overengineering** - Avoid complexity, avoid verbosity',
            '- Use **English** for all code and documentation',
            '- **Vanilla JavaScript only** (NO React)',
            '- **Tailwind CSS** for styling (CDN)',
            '- **Flowbite** for UI components (CDN)',
            '- **Lucide** for icons (CDN)',
            '- **Qry.js** for DOM manipulation (CDN)',
            '- Private fields/methods with # prefix',
            '- Clean, minimal code with clear naming\n',

            '## 2. AI Instructions',
            '- Do NOT give an instant analysis of this overview in the chat!',
            '- Simply respond with "OK, I\'m ready :-)" after processing this overview.',
            '- And wait for further chat request about the project.\n',

            '## 3. Configuration',
            `- **Project Name:** ${this.#projectName}`,
            `- **Generated on:** ${new Date().toISOString()}`,
            `- **Max File Size:** ${this.formatFileSize(this.config.maxFileSize)}\n`,

            '## 4. Technology Stack',
            '- **Frontend:** Vanilla JavaScript, Tailwind CSS, Flowbite, Lucide Icons, Qry.js',
            '- **Backend:** Java/Javalin, Maven/Gradle\n',

            '## 5. CDN Resources\n',
            '```html',
            '<!-- Tailwind CSS -->',
            '<script src="https://cdn.tailwindcss.com"></script>',
            '<!-- Flowbite -->',
            '<script defer src="https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.js"></script>',
            '<!-- Lucide Icons -->',
            '<script defer src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>',
            '<!-- Qry.js -->',
            '<script defer src="https://cdn.jsdelivr.net/gh/Bloechle/qry@latest/Qry.js"></script>',
            '```\n',

            '## 6. Directory Structure\n'
        ].join('\n');
    }

    async shouldProcessContent(filePath, rootDir) {
        const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
        const extension = path.extname(filePath).toLowerCase();
        const filename = path.basename(filePath);

        const isIgnored = this.config.ignoredPaths.some(ignoredPath => {
            if (ignoredPath.includes('*')) {
                const pattern = ignoredPath.replace(/\*/g, '.*');
                const regex = new RegExp(pattern);
                return regex.test(relativePath);
            }
            return relativePath === ignoredPath ||
                relativePath.startsWith(ignoredPath + '/') ||
                relativePath.includes('/' + ignoredPath + '/') ||
                filename === ignoredPath;
        });

        const isDocFile = filename === `_${this.#projectName}Overview.txt` || filename === '-generate-overview.cjs';

        try {
            const stat = await fs.stat(filePath);
            if (stat.size > this.config.maxFileSize) {
                this.stats.warnings.push(`File too large: ${relativePath}`);
                return false;
            }
        } catch (error) {
            return false;
        }

        return !isIgnored && !isDocFile &&
            this.config.acceptedExtensions.includes(extension) &&
            !path.basename(filePath).startsWith('.');
    }

    async generateDirectoryStructure(dir, rootDir, depth = 0, isLast = true, parentPrefixes = []) {
        try {
            const files = await fs.readdir(dir);
            let structure = '';

            const validFiles = [];
            for (const file of files) {
                const filePath = path.join(dir, file);
                const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');

                if (file === '-generate-overview.cjs' || file === `_${this.#projectName}Overview.txt`) continue;

                const isIgnored = this.config.ignoredPaths.some(ignoredPath => {
                    if (ignoredPath.includes('*')) {
                        const pattern = ignoredPath.replace(/\*/g, '.*');
                        const regex = new RegExp(pattern);
                        return regex.test(file) || regex.test(relativePath);
                    }
                    return file === ignoredPath || relativePath.startsWith(ignoredPath + '/');
                });

                if (!isIgnored) {
                    try {
                        const stat = await fs.stat(filePath);
                        validFiles.push({
                            name: file,
                            path: filePath,
                            isDirectory: stat.isDirectory(),
                            size: stat.size
                        });
                    } catch (error) {
                        this.#log(`Cannot stat ${filePath}: ${error.message}`, 'warn');
                    }
                }
            }

            validFiles.sort((a, b) => (b.isDirectory - a.isDirectory) || a.name.localeCompare(b.name));

            for (let i = 0; i < validFiles.length; i++) {
                const item = validFiles[i];
                const isLastItem = i === validFiles.length - 1;

                let prefix = parentPrefixes.map(isParentLast =>
                    isParentLast ? '    ' : '│   ').join('');
                prefix += isLastItem ? '└── ' : '├── ';

                const sizeInfo = !item.isDirectory && item.size < 1024 * 1024
                    ? ` (${this.formatFileSize(item.size)})`
                    : '';

                structure += `${prefix}${item.name}${item.isDirectory ? '/' : sizeInfo}\n`;

                if (item.isDirectory) {
                    structure += await this.generateDirectoryStructure(
                        item.path, rootDir, depth + 1, isLastItem, [...parentPrefixes, isLastItem]
                    );
                }
            }

            return structure;
        } catch (error) {
            this.stats.errors.push(`Error reading directory ${dir}: ${error.message}`);
            return '';
        }
    }

    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes, unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    async processFiles(dir, rootDir, outputFile) {
        const processedFiles = [];

        const processDirectory = async (currentDir) => {
            try {
                const files = await fs.readdir(currentDir);

                for (const file of files) {
                    const filePath = path.join(currentDir, file);

                    try {
                        const stat = await fs.stat(filePath);

                        if (file === '-generate-overview.cjs' || file === `_${this.#projectName}Overview.txt`) continue;

                        if (stat.isDirectory()) {
                            await processDirectory(filePath);
                        } else {
                            if (await this.shouldProcessContent(filePath, rootDir)) {
                                const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
                                const fileContent = await fs.readFile(filePath, this.config.encoding);
                                const extension = path.extname(filePath).toLowerCase();
                                const fileSize = stat.size;
                                const hash = await this.#calculateFileHash(filePath);
                                const lines = this.#countLines(fileContent);

                                this.stats.totalSize += fileSize;
                                this.stats.totalLines += lines;

                                const fileType = extension.slice(1).toUpperCase() || 'NONE';
                                this.stats.fileTypes.set(fileType, (this.stats.fileTypes.get(fileType) || 0) + 1);

                                this.stats.largestFiles.push({ path: relativePath, size: fileSize });
                                this.stats.largestFiles.sort((a, b) => b.size - a.size);
                                this.stats.largestFiles = this.stats.largestFiles.slice(0, 10);

                                const separatorParts = [
                                    '\n' + '='.repeat(80),
                                    `FILE: ${relativePath}`,
                                    `Type: ${fileType} | Size: ${this.formatFileSize(fileSize)} | Lines: ${lines}`,
                                    hash ? `MD5: ${hash}` : null,
                                    '='.repeat(80) + '\n'
                                ].filter(Boolean);

                                await fs.appendFile(outputFile, separatorParts.join('\n') + fileContent + '\n');

                                processedFiles.push({
                                    path: relativePath,
                                    type: fileType,
                                    size: this.formatFileSize(fileSize),
                                    lines: lines
                                });

                                this.stats.filesProcessed++;
                                this.#log(`Processed: ${relativePath}`);
                            } else {
                                this.stats.skippedFiles++;
                            }
                        }
                    } catch (error) {
                        this.stats.errors.push(`Error processing ${filePath}: ${error.message}`);
                    }
                }
            } catch (error) {
                this.stats.errors.push(`Error reading directory ${currentDir}: ${error.message}`);
            }
        };

        await processDirectory(dir);
        return processedFiles;
    }

    generateSummaryReport() {
        this.stats.processingTime = Date.now() - this.#startTime;

        let report = '\n## 7. Summary Report\n\n';
        report += `- **Files Processed:** ${this.stats.filesProcessed}\n`;
        report += `- **Files Skipped:** ${this.stats.skippedFiles}\n`;
        report += `- **Total Size:** ${this.formatFileSize(this.stats.totalSize)}\n`;
        report += `- **Total Lines:** ${this.stats.totalLines.toLocaleString()}\n`;
        report += `- **Processing Time:** ${(this.stats.processingTime / 1000).toFixed(2)} seconds\n`;

        if (this.stats.fileTypes.size > 0) {
            report += '\n### File Types\n';
            const sortedTypes = Array.from(this.stats.fileTypes.entries()).sort((a, b) => b[1] - a[1]);
            sortedTypes.forEach(([type, count]) => {
                const percentage = ((count / this.stats.filesProcessed) * 100).toFixed(1);
                report += `- **${type}:** ${count} files (${percentage}%)\n`;
            });
        }

        if (this.stats.errors.length > 0 || this.stats.warnings.length > 0) {
            report += `\n**Errors:** ${this.stats.errors.length} | **Warnings:** ${this.stats.warnings.length}\n`;
        }

        return report;
    }

    async generateOverview() {
        console.log(`\n📄 Starting ${this.#projectName} project documentation...\n`);

        try {
            await fs.unlink(this.config.outputFile).catch(() => {});

            const initialContent = this.generateInitialContent();
            await fs.writeFile(this.config.outputFile, initialContent);

            const directoryStructure = `${this.#projectName}/\n${
                await this.generateDirectoryStructure(this.config.rootDir, this.config.rootDir)
            }`;
            await fs.appendFile(this.config.outputFile, directoryStructure + '\n\n## 7. File Contents\n');

            const processedFiles = await this.processFiles(this.config.rootDir, this.config.rootDir, this.config.outputFile);
            const summaryReport = this.generateSummaryReport();
            await fs.appendFile(this.config.outputFile, summaryReport);

            console.log(`✅ ${this.#projectName} project documentation generated!`);
            console.log(`📄 Saved: _${this.#projectName}Overview.txt`);
            console.log(`📊 ${this.stats.filesProcessed} files processed, ${this.stats.skippedFiles} skipped`);
            console.log(`💾 ${this.formatFileSize(this.stats.totalSize)} total, ${this.stats.totalLines.toLocaleString()} lines`);
            console.log(`⏱️ ${(this.stats.processingTime / 1000).toFixed(2)}s processing time\n`);

        } catch (error) {
            console.error('❌ Failed to generate documentation:', error);
            throw error;
        }
    }
}

async function main() {
    const scanner = new Scanner(CURRENT_DIR);
    await scanner.generateOverview();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = Scanner;
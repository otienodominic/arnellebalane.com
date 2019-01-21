import path from 'path';
import {
    sortObjectsByKey,
    paginate,
    getFilesWithExtension,
    readFileContents,
    separateFrontMatterAndContent
} from './utils';
import JSONAsset from './assets/JSONAsset';
import MarkdownAsset from './assets/MarkdownAsset';

export default class Resource {
    constructor(resourcePath, options, plugin) {
        this.name = path.basename(resourcePath, '.json');
        this.baseUrl = plugin.baseUrl;
        this.outputBaseUrl = plugin.outputRelativePath;
        this.inputAbsolutePath = resourcePath;

        this.options = options;
        this.plugin = plugin;
        this.assets = new Map();
    }

    async apply() {
        let contents = this.options.sourceDir
            ? await this.constructResourceContents()
            : require(this.inputAbsolutePath);

        const {orderBy, itemsPerPage} = this.options;

        if (orderBy) {
            contents = sortObjectsByKey(contents, orderBy);
        }

        if (itemsPerPage) {
            const getAssetPath = page => path.join(this.outputBaseUrl, this.name, 'pages', `${page}.json`);
            const getPageUrl = page => this.plugin.getAbsoluteUrl(getAssetPath(page));

            paginate(contents, itemsPerPage).forEach((entries, i, arr) => {
                const totalPages = arr.length;
                const page = i + 1;
                const assetPath = getAssetPath(page);

                /* eslint camelcase: ['error', {allow: ['next_page', 'previous_page']}] */
                const content = {
                    data: entries,
                    next_page: page < totalPages ? getPageUrl(page + 1) : null,
                    previous_page: page > 1 ? getPageUrl(page - 1) : null
                };

                if (page === 1) {
                    const indexAsset = new JSONAsset(this.inputAbsolutePath, content, this);
                    this.assets.set(indexAsset.outputKey, indexAsset);
                }

                const asset = new JSONAsset(assetPath, content, this);
                this.assets.set(asset.outputKey, asset);
            });
        } else {
            const asset = new JSONAsset(this.inputAbsolutePath, {data: contents}, this);
            this.assets.set(asset.outputKey, asset);
        }
    }

    async constructResourceContents() {
        const entryFiles = await getFilesWithExtension(this.options.sourceDir, 'md');
        const shouldInclude = this.options.shouldInclude || (() => true);

        return Promise.all(entryFiles.map(async entry => {
            const entryPath = path.join(this.options.sourceDir, entry);
            const entryContent = await readFileContents(entryPath);

            const extracted = separateFrontMatterAndContent(entryContent);
            if (!extracted || !shouldInclude(extracted.frontMatter)) {
                return null;
            }

            const asset = new MarkdownAsset(entryPath, {data: extracted.content}, this);
            this.assets.set(asset.outputKey, asset);

            return {
                ...extracted.frontMatter,
                url: this.plugin.getAbsoluteUrl(asset.outputKey)
            };
        })).then(entries => entries.filter(Boolean));
    }
}

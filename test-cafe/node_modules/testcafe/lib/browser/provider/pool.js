"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const built_in_1 = __importDefault(require("./built-in"));
const plugin_host_1 = __importDefault(require("./plugin-host"));
const parse_provider_name_1 = __importDefault(require("./parse-provider-name"));
const _1 = __importDefault(require("./"));
const connection_1 = __importDefault(require("../connection"));
const runtime_1 = require("../../errors/runtime");
const types_1 = require("../../errors/types");
const BROWSER_PROVIDER_RE = /^([^:\s]+):?(.*)?$/;
exports.default = {
    providersCache: {},
    async _handlePathAndCmd(alias) {
        const browserName = JSON.stringify(alias);
        const providerName = 'path';
        const provider = await this.getProvider(providerName);
        return { provider, providerName, browserName };
    },
    async _parseAliasString(alias) {
        const providerRegExpMatch = BROWSER_PROVIDER_RE.exec(alias);
        if (!providerRegExpMatch)
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.cannotFindBrowser, alias);
        let providerName = providerRegExpMatch[1];
        let browserName = providerRegExpMatch[2] || '';
        let provider = await this.getProvider(providerName);
        if (!provider && providerRegExpMatch[2])
            provider = await this.getProvider(providerName + ':');
        if (!provider) {
            providerName = 'locally-installed';
            provider = await this.getProvider(providerName);
            browserName = providerRegExpMatch[1] || '';
        }
        return { provider, providerName, browserName };
    },
    async _parseAlias(alias) {
        if (alias.browserName && alias.providerName && alias.provider)
            return alias;
        if (alias && alias.path)
            return this._handlePathAndCmd(alias);
        if (typeof alias === 'string')
            return this._parseAliasString(alias);
        throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.cannotFindBrowser, alias);
    },
    async _getInfoForAllBrowserNames(provider, providerName) {
        const allBrowserNames = provider.isMultiBrowser ?
            await provider.getBrowserList() :
            [];
        if (!allBrowserNames.length)
            return { provider, providerName, browserName: '' };
        return allBrowserNames
            .map(browserName => ({ provider, providerName, browserName }));
    },
    _getProviderModule(providerName, moduleName) {
        try {
            // First, just check if the module exists
            require.resolve(moduleName);
        }
        catch (e) {
            // Module does not exist. Return null, and let the caller handle
            return null;
        }
        // Load the module
        const providerObject = require(moduleName);
        this.addProvider(providerName, providerObject);
        return this._getProviderFromCache(providerName);
    },
    _getProviderFromCache(providerName) {
        return this.providersCache[providerName] || null;
    },
    _getBuiltinProvider(providerName) {
        const providerObject = built_in_1.default[providerName];
        if (!providerObject)
            return null;
        this.addProvider(providerName, providerObject);
        return this._getProviderFromCache(providerName);
    },
    async getBrowserInfo(alias) {
        if (alias instanceof connection_1.default)
            return alias;
        const browserInfo = await this._parseAlias(alias);
        const { provider, providerName, browserName } = browserInfo;
        if (browserName === 'all')
            return await this._getInfoForAllBrowserNames(provider, providerName);
        if (!await provider.isValidBrowserName(browserName))
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.cannotFindBrowser, alias);
        if (typeof alias !== 'string')
            alias = JSON.stringify(alias);
        return Object.assign({ alias }, browserInfo);
    },
    addProvider(providerName, providerObject) {
        providerName = parse_provider_name_1.default(providerName).providerName;
        this.providersCache[providerName] = new _1.default(new plugin_host_1.default(providerObject, providerName));
    },
    removeProvider(providerName) {
        providerName = parse_provider_name_1.default(providerName).providerName;
        delete this.providersCache[providerName];
    },
    async getProvider(providerName) {
        const parsedProviderName = parse_provider_name_1.default(providerName);
        const moduleName = parsedProviderName.moduleName;
        providerName = parsedProviderName.providerName;
        const provider = this._getProviderFromCache(providerName) ||
            this._getProviderModule(providerName, moduleName) ||
            this._getBuiltinProvider(providerName);
        if (provider)
            await this.providersCache[providerName].init();
        return provider;
    },
    dispose() {
        return Promise.all(Object.values(this.providersCache).map(item => item.dispose()));
    }
};
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9icm93c2VyL3Byb3ZpZGVyL3Bvb2wuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwwREFBNEM7QUFDNUMsZ0VBQXNEO0FBQ3RELGdGQUFzRDtBQUN0RCwwQ0FBaUM7QUFDakMsK0RBQThDO0FBQzlDLGtEQUFvRDtBQUNwRCw4Q0FBb0Q7QUFFcEQsTUFBTSxtQkFBbUIsR0FBRyxvQkFBb0IsQ0FBQztBQUVqRCxrQkFBZTtJQUNYLGNBQWMsRUFBRSxFQUFFO0lBRWxCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBRSxLQUFLO1FBQzFCLE1BQU0sV0FBVyxHQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDO1FBQzVCLE1BQU0sUUFBUSxHQUFPLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUUxRCxPQUFPLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsQ0FBQztJQUNuRCxDQUFDO0lBRUQsS0FBSyxDQUFDLGlCQUFpQixDQUFFLEtBQUs7UUFDMUIsTUFBTSxtQkFBbUIsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFNUQsSUFBSSxDQUFDLG1CQUFtQjtZQUNwQixNQUFNLElBQUksc0JBQVksQ0FBQyxzQkFBYyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXBFLElBQUksWUFBWSxHQUFHLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFDLElBQUksV0FBVyxHQUFJLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUVoRCxJQUFJLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFcEQsSUFBSSxDQUFDLFFBQVEsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7WUFDbkMsUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFFMUQsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNYLFlBQVksR0FBRyxtQkFBbUIsQ0FBQztZQUNuQyxRQUFRLEdBQU8sTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3BELFdBQVcsR0FBSSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDL0M7UUFFRCxPQUFPLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsQ0FBQztJQUNuRCxDQUFDO0lBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBRSxLQUFLO1FBQ3BCLElBQUksS0FBSyxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsWUFBWSxJQUFJLEtBQUssQ0FBQyxRQUFRO1lBQ3pELE9BQU8sS0FBSyxDQUFDO1FBRWpCLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxJQUFJO1lBQ25CLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXpDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUTtZQUN6QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV6QyxNQUFNLElBQUksc0JBQVksQ0FBQyxzQkFBYyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFRCxLQUFLLENBQUMsMEJBQTBCLENBQUUsUUFBUSxFQUFFLFlBQVk7UUFDcEQsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sUUFBUSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7WUFDakMsRUFBRSxDQUFDO1FBRVAsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNO1lBQ3ZCLE9BQU8sRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUV2RCxPQUFPLGVBQWU7YUFDakIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRCxrQkFBa0IsQ0FBRSxZQUFZLEVBQUUsVUFBVTtRQUN4QyxJQUFJO1lBQ0EseUNBQXlDO1lBQ3pDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDL0I7UUFDRCxPQUFPLENBQUMsRUFBRTtZQUNOLGdFQUFnRTtZQUNoRSxPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsa0JBQWtCO1FBQ2xCLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUzQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztRQUMvQyxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQscUJBQXFCLENBQUUsWUFBWTtRQUMvQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxDQUFDO0lBQ3JELENBQUM7SUFFRCxtQkFBbUIsQ0FBRSxZQUFZO1FBQzdCLE1BQU0sY0FBYyxHQUFHLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXhELElBQUksQ0FBQyxjQUFjO1lBQ2YsT0FBTyxJQUFJLENBQUM7UUFFaEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFL0MsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVELEtBQUssQ0FBQyxjQUFjLENBQUUsS0FBSztRQUN2QixJQUFJLEtBQUssWUFBWSxvQkFBaUI7WUFDbEMsT0FBTyxLQUFLLENBQUM7UUFFakIsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRWxELE1BQU0sRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxHQUFHLFdBQVcsQ0FBQztRQUU1RCxJQUFJLFdBQVcsS0FBSyxLQUFLO1lBQ3JCLE9BQU8sTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRXpFLElBQUksQ0FBQyxNQUFNLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUM7WUFDL0MsTUFBTSxJQUFJLHNCQUFZLENBQUMsc0JBQWMsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVwRSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVE7WUFDekIsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbEMsdUJBQVMsS0FBSyxJQUFLLFdBQVcsRUFBRztJQUNyQyxDQUFDO0lBRUQsV0FBVyxDQUFFLFlBQVksRUFBRSxjQUFjO1FBQ3JDLFlBQVksR0FBRyw2QkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxZQUFZLENBQUM7UUFFNUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLFVBQWUsQ0FDbkQsSUFBSSxxQkFBeUIsQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQzlELENBQUM7SUFDTixDQUFDO0lBRUQsY0FBYyxDQUFFLFlBQVk7UUFDeEIsWUFBWSxHQUFHLDZCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDLFlBQVksQ0FBQztRQUU1RCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELEtBQUssQ0FBQyxXQUFXLENBQUUsWUFBWTtRQUMzQixNQUFNLGtCQUFrQixHQUFHLDZCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzNELE1BQU0sVUFBVSxHQUFXLGtCQUFrQixDQUFDLFVBQVUsQ0FBQztRQUV6RCxZQUFZLEdBQUcsa0JBQWtCLENBQUMsWUFBWSxDQUFDO1FBRS9DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLENBQUM7WUFDMUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFlBQVksRUFBRSxVQUFVLENBQUM7WUFDakQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXRELElBQUksUUFBUTtZQUNSLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUVuRCxPQUFPLFFBQVEsQ0FBQztJQUNwQixDQUFDO0lBRUQsT0FBTztRQUNILE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7Q0FDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJVSUxUX0lOX1BST1ZJREVSUyBmcm9tICcuL2J1aWx0LWluJztcbmltcG9ydCBCcm93c2VyUHJvdmlkZXJQbHVnaW5Ib3N0IGZyb20gJy4vcGx1Z2luLWhvc3QnO1xuaW1wb3J0IHBhcnNlUHJvdmlkZXJOYW1lIGZyb20gJy4vcGFyc2UtcHJvdmlkZXItbmFtZSc7XG5pbXBvcnQgQnJvd3NlclByb3ZpZGVyIGZyb20gJy4vJztcbmltcG9ydCBCcm93c2VyQ29ubmVjdGlvbiBmcm9tICcuLi9jb25uZWN0aW9uJztcbmltcG9ydCB7IEdlbmVyYWxFcnJvciB9IGZyb20gJy4uLy4uL2Vycm9ycy9ydW50aW1lJztcbmltcG9ydCB7IFJVTlRJTUVfRVJST1JTIH0gZnJvbSAnLi4vLi4vZXJyb3JzL3R5cGVzJztcblxuY29uc3QgQlJPV1NFUl9QUk9WSURFUl9SRSA9IC9eKFteOlxcc10rKTo/KC4qKT8kLztcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHByb3ZpZGVyc0NhY2hlOiB7fSxcblxuICAgIGFzeW5jIF9oYW5kbGVQYXRoQW5kQ21kIChhbGlhcykge1xuICAgICAgICBjb25zdCBicm93c2VyTmFtZSAgPSBKU09OLnN0cmluZ2lmeShhbGlhcyk7XG4gICAgICAgIGNvbnN0IHByb3ZpZGVyTmFtZSA9ICdwYXRoJztcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgICAgID0gYXdhaXQgdGhpcy5nZXRQcm92aWRlcihwcm92aWRlck5hbWUpO1xuXG4gICAgICAgIHJldHVybiB7IHByb3ZpZGVyLCBwcm92aWRlck5hbWUsIGJyb3dzZXJOYW1lIH07XG4gICAgfSxcblxuICAgIGFzeW5jIF9wYXJzZUFsaWFzU3RyaW5nIChhbGlhcykge1xuICAgICAgICBjb25zdCBwcm92aWRlclJlZ0V4cE1hdGNoID0gQlJPV1NFUl9QUk9WSURFUl9SRS5leGVjKGFsaWFzKTtcblxuICAgICAgICBpZiAoIXByb3ZpZGVyUmVnRXhwTWF0Y2gpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKFJVTlRJTUVfRVJST1JTLmNhbm5vdEZpbmRCcm93c2VyLCBhbGlhcyk7XG5cbiAgICAgICAgbGV0IHByb3ZpZGVyTmFtZSA9IHByb3ZpZGVyUmVnRXhwTWF0Y2hbMV07XG4gICAgICAgIGxldCBicm93c2VyTmFtZSAgPSBwcm92aWRlclJlZ0V4cE1hdGNoWzJdIHx8ICcnO1xuXG4gICAgICAgIGxldCBwcm92aWRlciA9IGF3YWl0IHRoaXMuZ2V0UHJvdmlkZXIocHJvdmlkZXJOYW1lKTtcblxuICAgICAgICBpZiAoIXByb3ZpZGVyICYmIHByb3ZpZGVyUmVnRXhwTWF0Y2hbMl0pXG4gICAgICAgICAgICBwcm92aWRlciA9IGF3YWl0IHRoaXMuZ2V0UHJvdmlkZXIocHJvdmlkZXJOYW1lICsgJzonKTtcblxuICAgICAgICBpZiAoIXByb3ZpZGVyKSB7XG4gICAgICAgICAgICBwcm92aWRlck5hbWUgPSAnbG9jYWxseS1pbnN0YWxsZWQnO1xuICAgICAgICAgICAgcHJvdmlkZXIgICAgID0gYXdhaXQgdGhpcy5nZXRQcm92aWRlcihwcm92aWRlck5hbWUpO1xuICAgICAgICAgICAgYnJvd3Nlck5hbWUgID0gcHJvdmlkZXJSZWdFeHBNYXRjaFsxXSB8fCAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IHByb3ZpZGVyLCBwcm92aWRlck5hbWUsIGJyb3dzZXJOYW1lIH07XG4gICAgfSxcblxuICAgIGFzeW5jIF9wYXJzZUFsaWFzIChhbGlhcykge1xuICAgICAgICBpZiAoYWxpYXMuYnJvd3Nlck5hbWUgJiYgYWxpYXMucHJvdmlkZXJOYW1lICYmIGFsaWFzLnByb3ZpZGVyKVxuICAgICAgICAgICAgcmV0dXJuIGFsaWFzO1xuXG4gICAgICAgIGlmIChhbGlhcyAmJiBhbGlhcy5wYXRoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZVBhdGhBbmRDbWQoYWxpYXMpO1xuXG4gICAgICAgIGlmICh0eXBlb2YgYWxpYXMgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcnNlQWxpYXNTdHJpbmcoYWxpYXMpO1xuXG4gICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoUlVOVElNRV9FUlJPUlMuY2Fubm90RmluZEJyb3dzZXIsIGFsaWFzKTtcbiAgICB9LFxuXG4gICAgYXN5bmMgX2dldEluZm9Gb3JBbGxCcm93c2VyTmFtZXMgKHByb3ZpZGVyLCBwcm92aWRlck5hbWUpIHtcbiAgICAgICAgY29uc3QgYWxsQnJvd3Nlck5hbWVzID0gcHJvdmlkZXIuaXNNdWx0aUJyb3dzZXIgP1xuICAgICAgICAgICAgYXdhaXQgcHJvdmlkZXIuZ2V0QnJvd3Nlckxpc3QoKSA6XG4gICAgICAgICAgICBbXTtcblxuICAgICAgICBpZiAoIWFsbEJyb3dzZXJOYW1lcy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4geyBwcm92aWRlciwgcHJvdmlkZXJOYW1lLCBicm93c2VyTmFtZTogJycgfTtcblxuICAgICAgICByZXR1cm4gYWxsQnJvd3Nlck5hbWVzXG4gICAgICAgICAgICAubWFwKGJyb3dzZXJOYW1lID0+ICh7IHByb3ZpZGVyLCBwcm92aWRlck5hbWUsIGJyb3dzZXJOYW1lIH0pKTtcbiAgICB9LFxuXG4gICAgX2dldFByb3ZpZGVyTW9kdWxlIChwcm92aWRlck5hbWUsIG1vZHVsZU5hbWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIEZpcnN0LCBqdXN0IGNoZWNrIGlmIHRoZSBtb2R1bGUgZXhpc3RzXG4gICAgICAgICAgICByZXF1aXJlLnJlc29sdmUobW9kdWxlTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIE1vZHVsZSBkb2VzIG5vdCBleGlzdC4gUmV0dXJuIG51bGwsIGFuZCBsZXQgdGhlIGNhbGxlciBoYW5kbGVcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTG9hZCB0aGUgbW9kdWxlXG4gICAgICAgIGNvbnN0IHByb3ZpZGVyT2JqZWN0ID0gcmVxdWlyZShtb2R1bGVOYW1lKTtcblxuICAgICAgICB0aGlzLmFkZFByb3ZpZGVyKHByb3ZpZGVyTmFtZSwgcHJvdmlkZXJPYmplY3QpO1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0UHJvdmlkZXJGcm9tQ2FjaGUocHJvdmlkZXJOYW1lKTtcbiAgICB9LFxuXG4gICAgX2dldFByb3ZpZGVyRnJvbUNhY2hlIChwcm92aWRlck5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvdmlkZXJzQ2FjaGVbcHJvdmlkZXJOYW1lXSB8fCBudWxsO1xuICAgIH0sXG5cbiAgICBfZ2V0QnVpbHRpblByb3ZpZGVyIChwcm92aWRlck5hbWUpIHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXJPYmplY3QgPSBCVUlMVF9JTl9QUk9WSURFUlNbcHJvdmlkZXJOYW1lXTtcblxuICAgICAgICBpZiAoIXByb3ZpZGVyT2JqZWN0KVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgdGhpcy5hZGRQcm92aWRlcihwcm92aWRlck5hbWUsIHByb3ZpZGVyT2JqZWN0KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0UHJvdmlkZXJGcm9tQ2FjaGUocHJvdmlkZXJOYW1lKTtcbiAgICB9LFxuXG4gICAgYXN5bmMgZ2V0QnJvd3NlckluZm8gKGFsaWFzKSB7XG4gICAgICAgIGlmIChhbGlhcyBpbnN0YW5jZW9mIEJyb3dzZXJDb25uZWN0aW9uKVxuICAgICAgICAgICAgcmV0dXJuIGFsaWFzO1xuXG4gICAgICAgIGNvbnN0IGJyb3dzZXJJbmZvID0gYXdhaXQgdGhpcy5fcGFyc2VBbGlhcyhhbGlhcyk7XG5cbiAgICAgICAgY29uc3QgeyBwcm92aWRlciwgcHJvdmlkZXJOYW1lLCBicm93c2VyTmFtZSB9ID0gYnJvd3NlckluZm87XG5cbiAgICAgICAgaWYgKGJyb3dzZXJOYW1lID09PSAnYWxsJylcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9nZXRJbmZvRm9yQWxsQnJvd3Nlck5hbWVzKHByb3ZpZGVyLCBwcm92aWRlck5hbWUpO1xuXG4gICAgICAgIGlmICghYXdhaXQgcHJvdmlkZXIuaXNWYWxpZEJyb3dzZXJOYW1lKGJyb3dzZXJOYW1lKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5lcmFsRXJyb3IoUlVOVElNRV9FUlJPUlMuY2Fubm90RmluZEJyb3dzZXIsIGFsaWFzKTtcblxuICAgICAgICBpZiAodHlwZW9mIGFsaWFzICE9PSAnc3RyaW5nJylcbiAgICAgICAgICAgIGFsaWFzID0gSlNPTi5zdHJpbmdpZnkoYWxpYXMpO1xuXG4gICAgICAgIHJldHVybiB7IGFsaWFzLCAuLi5icm93c2VySW5mbyB9O1xuICAgIH0sXG5cbiAgICBhZGRQcm92aWRlciAocHJvdmlkZXJOYW1lLCBwcm92aWRlck9iamVjdCkge1xuICAgICAgICBwcm92aWRlck5hbWUgPSBwYXJzZVByb3ZpZGVyTmFtZShwcm92aWRlck5hbWUpLnByb3ZpZGVyTmFtZTtcblxuICAgICAgICB0aGlzLnByb3ZpZGVyc0NhY2hlW3Byb3ZpZGVyTmFtZV0gPSBuZXcgQnJvd3NlclByb3ZpZGVyKFxuICAgICAgICAgICAgbmV3IEJyb3dzZXJQcm92aWRlclBsdWdpbkhvc3QocHJvdmlkZXJPYmplY3QsIHByb3ZpZGVyTmFtZSlcbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlUHJvdmlkZXIgKHByb3ZpZGVyTmFtZSkge1xuICAgICAgICBwcm92aWRlck5hbWUgPSBwYXJzZVByb3ZpZGVyTmFtZShwcm92aWRlck5hbWUpLnByb3ZpZGVyTmFtZTtcblxuICAgICAgICBkZWxldGUgdGhpcy5wcm92aWRlcnNDYWNoZVtwcm92aWRlck5hbWVdO1xuICAgIH0sXG5cbiAgICBhc3luYyBnZXRQcm92aWRlciAocHJvdmlkZXJOYW1lKSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZFByb3ZpZGVyTmFtZSA9IHBhcnNlUHJvdmlkZXJOYW1lKHByb3ZpZGVyTmFtZSk7XG4gICAgICAgIGNvbnN0IG1vZHVsZU5hbWUgICAgICAgICA9IHBhcnNlZFByb3ZpZGVyTmFtZS5tb2R1bGVOYW1lO1xuXG4gICAgICAgIHByb3ZpZGVyTmFtZSA9IHBhcnNlZFByb3ZpZGVyTmFtZS5wcm92aWRlck5hbWU7XG5cbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSB0aGlzLl9nZXRQcm92aWRlckZyb21DYWNoZShwcm92aWRlck5hbWUpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dldFByb3ZpZGVyTW9kdWxlKHByb3ZpZGVyTmFtZSwgbW9kdWxlTmFtZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2V0QnVpbHRpblByb3ZpZGVyKHByb3ZpZGVyTmFtZSk7XG5cbiAgICAgICAgaWYgKHByb3ZpZGVyKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5wcm92aWRlcnNDYWNoZVtwcm92aWRlck5hbWVdLmluaXQoKTtcblxuICAgICAgICByZXR1cm4gcHJvdmlkZXI7XG4gICAgfSxcblxuICAgIGRpc3Bvc2UgKCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoT2JqZWN0LnZhbHVlcyh0aGlzLnByb3ZpZGVyc0NhY2hlKS5tYXAoaXRlbSA9PiBpdGVtLmRpc3Bvc2UoKSkpO1xuICAgIH1cbn07XG4iXX0=
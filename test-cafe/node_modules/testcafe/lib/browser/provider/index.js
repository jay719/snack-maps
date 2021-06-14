"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const testcafe_browser_tools_1 = __importDefault(require("testcafe-browser-tools"));
const os_family_1 = __importDefault(require("os-family"));
const path_1 = require("path");
const make_dir_1 = __importDefault(require("make-dir"));
const connection_1 = __importDefault(require("../connection"));
const delay_1 = __importDefault(require("../../utils/delay"));
const client_functions_1 = require("./utils/client-functions");
const warning_message_1 = __importDefault(require("../../notifications/warning-message"));
const DEBUG_LOGGER = debug_1.default('testcafe:browser:provider');
const BROWSER_OPENING_DELAY = 2000;
const RESIZE_DIFF_SIZE = {
    width: 100,
    height: 100
};
function sumSizes(sizeA, sizeB) {
    return {
        width: sizeA.width + sizeB.width,
        height: sizeA.height + sizeB.height
    };
}
function subtractSizes(sizeA, sizeB) {
    return {
        width: sizeA.width - sizeB.width,
        height: sizeA.height - sizeB.height
    };
}
class BrowserProvider {
    constructor(plugin) {
        this.plugin = plugin;
        this.initPromise = Promise.resolve(false);
        this.isMultiBrowser = this.plugin.isMultiBrowser;
        // HACK: The browser window has different border sizes in normal and maximized modes. So, we need to be sure that the window is
        // not maximized before resizing it in order to keep the mechanism of correcting the client area size working. When browser is started,
        // we are resizing it for the first time to switch the window to normal mode, and for the second time - to restore the client area size.
        this.localBrowsersInfo = {};
    }
    _ensureLocalBrowserInfo(browserId) {
        if (this.localBrowsersInfo[browserId])
            return;
        this.localBrowsersInfo[browserId] = {
            windowDescriptor: null,
            maxScreenSize: null,
            resizeCorrections: null
        };
    }
    async _findWindow(browserId) {
        const pageTitle = this._getPageTitle(browserId);
        return testcafe_browser_tools_1.default.findWindow(pageTitle);
    }
    _getPageTitle(browserId) {
        if (this.plugin.getPageTitle)
            return this.plugin.getPageTitle(browserId);
        return browserId;
    }
    _getWindowDescriptor(browserId) {
        if (this.plugin.getWindowDescriptor)
            return this.plugin.getWindowDescriptor(browserId);
        return this.localBrowsersInfo[browserId] && this.localBrowsersInfo[browserId].windowDescriptor;
    }
    _setWindowDescriptor(browserId, windowDescriptor) {
        if (this.plugin.setWindowDescriptor) {
            this.plugin.setWindowDescriptor(browserId, windowDescriptor);
            return;
        }
        this.localBrowsersInfo[browserId].windowDescriptor = windowDescriptor;
    }
    _getMaxScreenSize(browserId) {
        return this.localBrowsersInfo[browserId] && this.localBrowsersInfo[browserId].maxScreenSize;
    }
    _getResizeCorrections(browserId) {
        return this.localBrowsersInfo[browserId] && this.localBrowsersInfo[browserId].resizeCorrections;
    }
    _isBrowserIdle(browserId) {
        const connection = connection_1.default.getById(browserId);
        return connection.idle;
    }
    async _calculateResizeCorrections(browserId) {
        if (!this._isBrowserIdle(browserId))
            return;
        const title = await this.plugin.runInitScript(browserId, client_functions_1.GET_TITLE_SCRIPT);
        if (!await testcafe_browser_tools_1.default.isMaximized(title))
            return;
        const currentSize = await this.plugin.runInitScript(browserId, client_functions_1.GET_WINDOW_DIMENSIONS_INFO_SCRIPT);
        const etalonSize = subtractSizes(currentSize, RESIZE_DIFF_SIZE);
        await testcafe_browser_tools_1.default.resize(title, currentSize.width, currentSize.height, etalonSize.width, etalonSize.height);
        let resizedSize = await this.plugin.runInitScript(browserId, client_functions_1.GET_WINDOW_DIMENSIONS_INFO_SCRIPT);
        let correctionSize = subtractSizes(resizedSize, etalonSize);
        await testcafe_browser_tools_1.default.resize(title, resizedSize.width, resizedSize.height, etalonSize.width, etalonSize.height);
        resizedSize = await this.plugin.runInitScript(browserId, client_functions_1.GET_WINDOW_DIMENSIONS_INFO_SCRIPT);
        correctionSize = sumSizes(correctionSize, subtractSizes(resizedSize, etalonSize));
        if (this.localBrowsersInfo[browserId])
            this.localBrowsersInfo[browserId].resizeCorrections = correctionSize;
        await testcafe_browser_tools_1.default.maximize(title);
    }
    async _calculateMacSizeLimits(browserId) {
        if (!this._isBrowserIdle(browserId))
            return;
        const sizeInfo = await this.plugin.runInitScript(browserId, client_functions_1.GET_WINDOW_DIMENSIONS_INFO_SCRIPT);
        if (this.localBrowsersInfo[browserId]) {
            this.localBrowsersInfo[browserId].maxScreenSize = {
                width: sizeInfo.availableWidth - (sizeInfo.outerWidth - sizeInfo.width),
                height: sizeInfo.availableHeight - (sizeInfo.outerHeight - sizeInfo.height)
            };
        }
    }
    async _ensureBrowserWindowDescriptor(browserId) {
        if (this._getWindowDescriptor(browserId))
            return;
        await this._ensureLocalBrowserInfo(browserId);
        // NOTE: delay to ensure the window finished the opening
        await this.plugin.waitForConnectionReady(browserId);
        await delay_1.default(BROWSER_OPENING_DELAY);
        if (this.localBrowsersInfo[browserId]) {
            const connection = connection_1.default.getById(browserId);
            let windowDescriptor = null;
            try {
                windowDescriptor = await this._findWindow(browserId);
            }
            catch (err) {
                // NOTE: We can suppress the error here since we can just disable window manipulation functions
                // when we cannot find a local window descriptor
                DEBUG_LOGGER(err);
                connection.addWarning(warning_message_1.default.cannotFindWindowDescriptorError, connection.browserInfo.alias, err.message);
            }
            this._setWindowDescriptor(browserId, windowDescriptor);
        }
    }
    async _ensureBrowserWindowParameters(browserId) {
        await this._ensureBrowserWindowDescriptor(browserId);
        if (os_family_1.default.win && !this._getResizeCorrections(browserId))
            await this._calculateResizeCorrections(browserId);
        else if (os_family_1.default.mac && !this._getMaxScreenSize(browserId))
            await this._calculateMacSizeLimits(browserId);
    }
    async _closeLocalBrowser(browserId) {
        if (this.plugin.needCleanUpBrowserInfo)
            this.plugin.cleanUpBrowserInfo(browserId);
        const windowDescriptor = this._getWindowDescriptor(browserId);
        await testcafe_browser_tools_1.default.close(windowDescriptor);
    }
    async _resizeLocalBrowserWindow(browserId, width, height, currentWidth, currentHeight) {
        await this._ensureBrowserWindowDescriptor(browserId);
        const resizeCorrections = this._getResizeCorrections(browserId);
        if (resizeCorrections && await testcafe_browser_tools_1.default.isMaximized(this._getWindowDescriptor(browserId))) {
            width -= resizeCorrections.width;
            height -= resizeCorrections.height;
        }
        await testcafe_browser_tools_1.default.resize(this._getWindowDescriptor(browserId), currentWidth, currentHeight, width, height);
    }
    async _takeLocalBrowserScreenshot(browserId, screenshotPath) {
        await testcafe_browser_tools_1.default.screenshot(this._getWindowDescriptor(browserId), screenshotPath);
    }
    async _canResizeLocalBrowserWindowToDimensions(browserId, width, height) {
        if (!os_family_1.default.mac)
            return true;
        const maxScreenSize = this._getMaxScreenSize(browserId);
        return width <= maxScreenSize.width && height <= maxScreenSize.height;
    }
    async _maximizeLocalBrowserWindow(browserId) {
        await this._ensureBrowserWindowDescriptor(browserId);
        await testcafe_browser_tools_1.default.maximize(this._getWindowDescriptor(browserId));
    }
    async _ensureRetryTestPagesWarning(browserId) {
        const connection = connection_1.default.getById(browserId);
        if (connection === null || connection === void 0 ? void 0 : connection.retryTestPages) {
            const isServiceWorkerEnabled = await this.plugin.runInitScript(browserId, client_functions_1.GET_IS_SERVICE_WORKER_ENABLED);
            if (!isServiceWorkerEnabled)
                connection.addWarning(warning_message_1.default.retryTestPagesIsNotSupported, connection.browserInfo.alias, connection.browserInfo.alias);
        }
    }
    async canUseDefaultWindowActions(browserId) {
        const isLocalBrowser = await this.plugin.isLocalBrowser(browserId);
        const isHeadlessBrowser = await this.plugin.isHeadlessBrowser(browserId);
        return isLocalBrowser && !isHeadlessBrowser;
    }
    async init() {
        const initialized = await this.initPromise;
        if (initialized)
            return;
        this.initPromise = this.plugin
            .init()
            .then(() => true);
        try {
            await this.initPromise;
        }
        catch (error) {
            this.initPromise = Promise.resolve(false);
            throw error;
        }
    }
    async dispose() {
        const initialized = await this.initPromise;
        if (!initialized)
            return;
        this.initPromise = this.plugin
            .dispose()
            .then(() => false);
        try {
            await this.initPromise;
        }
        catch (error) {
            this.initPromise = Promise.resolve(false);
            throw error;
        }
    }
    async isLocalBrowser(browserId, browserName) {
        return await this.plugin.isLocalBrowser(browserId, browserName);
    }
    isHeadlessBrowser(browserId, browserName) {
        return this.plugin.isHeadlessBrowser(browserId, browserName);
    }
    async openBrowser(browserId, pageUrl, browserName, disableMultipleWindows) {
        await this.plugin.openBrowser(browserId, pageUrl, browserName, disableMultipleWindows);
        await this._ensureRetryTestPagesWarning(browserId);
        if (await this.canUseDefaultWindowActions(browserId))
            await this._ensureBrowserWindowParameters(browserId);
    }
    async closeBrowser(browserId) {
        const canUseDefaultWindowActions = await this.canUseDefaultWindowActions(browserId);
        const customActionsInfo = await this.hasCustomActionForBrowser(browserId);
        const hasCustomCloseBrowser = customActionsInfo.hasCloseBrowser;
        const usePluginsCloseBrowser = hasCustomCloseBrowser || !canUseDefaultWindowActions;
        if (usePluginsCloseBrowser)
            await this.plugin.closeBrowser(browserId);
        else
            await this._closeLocalBrowser(browserId);
        if (canUseDefaultWindowActions)
            delete this.localBrowsersInfo[browserId];
    }
    async getBrowserList() {
        return await this.plugin.getBrowserList();
    }
    async isValidBrowserName(browserName) {
        return await this.plugin.isValidBrowserName(browserName);
    }
    async resizeWindow(browserId, width, height, currentWidth, currentHeight) {
        const canUseDefaultWindowActions = await this.canUseDefaultWindowActions(browserId);
        const customActionsInfo = await this.hasCustomActionForBrowser(browserId);
        const hasCustomResizeWindow = customActionsInfo.hasResizeWindow;
        if (canUseDefaultWindowActions && !hasCustomResizeWindow) {
            await this._resizeLocalBrowserWindow(browserId, width, height, currentWidth, currentHeight);
            return;
        }
        await this.plugin.resizeWindow(browserId, width, height, currentWidth, currentHeight);
    }
    async canResizeWindowToDimensions(browserId, width, height) {
        const canUseDefaultWindowActions = await this.canUseDefaultWindowActions(browserId);
        const customActionsInfo = await this.hasCustomActionForBrowser(browserId);
        const hasCustomCanResizeToDimensions = customActionsInfo.hasCanResizeWindowToDimensions;
        if (canUseDefaultWindowActions && !hasCustomCanResizeToDimensions)
            return await this._canResizeLocalBrowserWindowToDimensions(browserId, width, height);
        return await this.plugin.canResizeWindowToDimensions(browserId, width, height);
    }
    async maximizeWindow(browserId) {
        const canUseDefaultWindowActions = await this.canUseDefaultWindowActions(browserId);
        const customActionsInfo = await this.hasCustomActionForBrowser(browserId);
        const hasCustomMaximizeWindow = customActionsInfo.hasMaximizeWindow;
        if (canUseDefaultWindowActions && !hasCustomMaximizeWindow)
            return await this._maximizeLocalBrowserWindow(browserId);
        return await this.plugin.maximizeWindow(browserId);
    }
    async takeScreenshot(browserId, screenshotPath, pageWidth, pageHeight, fullPage) {
        const canUseDefaultWindowActions = await this.canUseDefaultWindowActions(browserId);
        const customActionsInfo = await this.hasCustomActionForBrowser(browserId);
        const hasCustomTakeScreenshot = customActionsInfo.hasTakeScreenshot;
        const connection = connection_1.default.getById(browserId);
        const takeLocalBrowsersScreenshot = canUseDefaultWindowActions && !hasCustomTakeScreenshot;
        const isLocalFullPageMode = takeLocalBrowsersScreenshot && fullPage;
        if (isLocalFullPageMode) {
            connection.addWarning(warning_message_1.default.screenshotsFullPageNotSupported, connection.browserInfo.alias);
            return;
        }
        await make_dir_1.default(path_1.dirname(screenshotPath));
        if (takeLocalBrowsersScreenshot)
            await this._takeLocalBrowserScreenshot(browserId, screenshotPath);
        else
            await this.plugin.takeScreenshot(browserId, screenshotPath, pageWidth, pageHeight, fullPage);
    }
    async getVideoFrameData(browserId) {
        return this.plugin.getVideoFrameData(browserId);
    }
    async hasCustomActionForBrowser(browserId) {
        return this.plugin.hasCustomActionForBrowser(browserId);
    }
    async reportJobResult(browserId, status, data) {
        await this.plugin.reportJobResult(browserId, status, data);
    }
    getActiveWindowId(browserId) {
        if (!this.plugin.supportMultipleWindows)
            return null;
        return this.plugin.getActiveWindowId(browserId);
    }
    setActiveWindowId(browserId, val) {
        this.plugin.setActiveWindowId(browserId, val);
    }
}
exports.default = BrowserProvider;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYnJvd3Nlci9wcm92aWRlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGtEQUEwQjtBQUMxQixvRkFBa0Q7QUFDbEQsMERBQTJCO0FBQzNCLCtCQUErQjtBQUMvQix3REFBK0I7QUFDL0IsK0RBQThDO0FBQzlDLDhEQUFzQztBQUN0QywrREFJa0M7QUFDbEMsMEZBQWtFO0FBSWxFLE1BQU0sWUFBWSxHQUFHLGVBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0FBRXhELE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDO0FBRW5DLE1BQU0sZ0JBQWdCLEdBQUc7SUFDckIsS0FBSyxFQUFHLEdBQUc7SUFDWCxNQUFNLEVBQUUsR0FBRztDQUNkLENBQUM7QUFhRixTQUFTLFFBQVEsQ0FBRSxLQUFXLEVBQUUsS0FBVztJQUN2QyxPQUFPO1FBQ0gsS0FBSyxFQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUs7UUFDakMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU07S0FDdEMsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFTLGFBQWEsQ0FBRSxLQUFXLEVBQUUsS0FBVztJQUM1QyxPQUFPO1FBQ0gsS0FBSyxFQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUs7UUFDakMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU07S0FDdEMsQ0FBQztBQUNOLENBQUM7QUFFRCxNQUFxQixlQUFlO0lBTWhDLFlBQW9CLE1BQVc7UUFDM0IsSUFBSSxDQUFDLE1BQU0sR0FBVyxNQUFNLENBQUM7UUFDN0IsSUFBSSxDQUFDLFdBQVcsR0FBTSxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFD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QUNyRyxDQUFDO0lBRU0sS0FBSyxDQUFDLGlCQUFpQixDQUFFLFNBQWlCO1FBQzdDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRU0sS0FBSyxDQUFDLHlCQUF5QixDQUFFLFNBQWlCO1FBQ3JELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRU0sS0FBSyxDQUFDLGVBQWUsQ0FBRSxTQUFpQixFQUFFLE1BQWMsRUFBRSxJQUFTO1FBQ3RFLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRU0saUJBQWlCLENBQUUsU0FBaUI7UUFDdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsc0JBQXNCO1lBQ25DLE9BQU8sSUFBSSxDQUFDO1FBRWhCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRU0saUJBQWlCLENBQUUsU0FBaUIsRUFBRSxHQUFXO1FBQ3BELElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2xELENBQUM7Q0FDSjtBQXZYRCxrQ0F1WEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xuaW1wb3J0IGJyb3dzZXJUb29scyBmcm9tICd0ZXN0Y2FmZS1icm93c2VyLXRvb2xzJztcbmltcG9ydCBPUyBmcm9tICdvcy1mYW1pbHknO1xuaW1wb3J0IHsgZGlybmFtZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IG1ha2VEaXIgZnJvbSAnbWFrZS1kaXInO1xuaW1wb3J0IEJyb3dzZXJDb25uZWN0aW9uIGZyb20gJy4uL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IGRlbGF5IGZyb20gJy4uLy4uL3V0aWxzL2RlbGF5JztcbmltcG9ydCB7XG4gICAgR0VUX0lTX1NFUlZJQ0VfV09SS0VSX0VOQUJMRUQsXG4gICAgR0VUX1RJVExFX1NDUklQVCxcbiAgICBHRVRfV0lORE9XX0RJTUVOU0lPTlNfSU5GT19TQ1JJUFRcbn0gZnJvbSAnLi91dGlscy9jbGllbnQtZnVuY3Rpb25zJztcbmltcG9ydCBXQVJOSU5HX01FU1NBR0UgZnJvbSAnLi4vLi4vbm90aWZpY2F0aW9ucy93YXJuaW5nLW1lc3NhZ2UnO1xuaW1wb3J0IHsgRGljdGlvbmFyeSB9IGZyb20gJy4uLy4uL2NvbmZpZ3VyYXRpb24vaW50ZXJmYWNlcyc7XG5pbXBvcnQgeyBXaW5kb3dEaW1lbnRpb25zSW5mbyB9IGZyb20gJy4uL2ludGVyZmFjZXMnO1xuXG5jb25zdCBERUJVR19MT0dHRVIgPSBkZWJ1ZygndGVzdGNhZmU6YnJvd3Nlcjpwcm92aWRlcicpO1xuXG5jb25zdCBCUk9XU0VSX09QRU5JTkdfREVMQVkgPSAyMDAwO1xuXG5jb25zdCBSRVNJWkVfRElGRl9TSVpFID0ge1xuICAgIHdpZHRoOiAgMTAwLFxuICAgIGhlaWdodDogMTAwXG59O1xuXG5pbnRlcmZhY2UgU2l6ZSB7XG4gICAgd2lkdGg6IG51bWJlcjtcbiAgICBoZWlnaHQ6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIExvY2FsQnJvd3NlckluZm8ge1xuICAgIHdpbmRvd0Rlc2NyaXB0b3I6IG51bGwgfCBzdHJpbmc7XG4gICAgbWF4U2NyZWVuU2l6ZTogbnVsbCB8IFNpemU7XG4gICAgcmVzaXplQ29ycmVjdGlvbnM6IG51bGwgfCBTaXplO1xufVxuXG5mdW5jdGlvbiBzdW1TaXplcyAoc2l6ZUE6IFNpemUsIHNpemVCOiBTaXplKTogU2l6ZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgd2lkdGg6ICBzaXplQS53aWR0aCArIHNpemVCLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IHNpemVBLmhlaWdodCArIHNpemVCLmhlaWdodFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHN1YnRyYWN0U2l6ZXMgKHNpemVBOiBTaXplLCBzaXplQjogU2l6ZSk6IFNpemUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHdpZHRoOiAgc2l6ZUEud2lkdGggLSBzaXplQi53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBzaXplQS5oZWlnaHQgLSBzaXplQi5oZWlnaHRcbiAgICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCcm93c2VyUHJvdmlkZXIge1xuICAgIHByaXZhdGUgcGx1Z2luOiBhbnk7XG4gICAgcHJpdmF0ZSBpbml0UHJvbWlzZTogUHJvbWlzZTxhbnk+O1xuICAgIHByaXZhdGUgaXNNdWx0aUJyb3dzZXI6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSByZWFkb25seSBsb2NhbEJyb3dzZXJzSW5mbzogRGljdGlvbmFyeTxMb2NhbEJyb3dzZXJJbmZvPjtcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvciAocGx1Z2luOiBhbnkpIHtcbiAgICAgICAgdGhpcy5wbHVnaW4gICAgICAgICA9IHBsdWdpbjtcbiAgICAgICAgdGhpcy5pbml0UHJvbWlzZSAgICA9IFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIHRoaXMuaXNNdWx0aUJyb3dzZXIgPSB0aGlzLnBsdWdpbi5pc011bHRpQnJvd3NlcjtcbiAgICAgICAgLy8gSEFDSzogVGhlIGJyb3dzZXIgd2luZG93IGhhcyBkaWZmZXJlbnQgYm9yZGVyIHNpemVzIGluIG5vcm1hbCBhbmQgbWF4aW1pemVkIG1vZGVzLiBTbywgd2UgbmVlZCB0byBiZSBzdXJlIHRoYXQgdGhlIHdpbmRvdyBpc1xuICAgICAgICAvLyBub3QgbWF4aW1pemVkIGJlZm9yZSByZXNpemluZyBpdCBpbiBvcmRlciB0byBrZWVwIHRoZSBtZWNoYW5pc20gb2YgY29ycmVjdGluZyB0aGUgY2xpZW50IGFyZWEgc2l6ZSB3b3JraW5nLiBXaGVuIGJyb3dzZXIgaXMgc3RhcnRlZCxcbiAgICAgICAgLy8gd2UgYXJlIHJlc2l6aW5nIGl0IGZvciB0aGUgZmlyc3QgdGltZSB0byBzd2l0Y2ggdGhlIHdpbmRvdyB0byBub3JtYWwgbW9kZSwgYW5kIGZvciB0aGUgc2Vjb25kIHRpbWUgLSB0byByZXN0b3JlIHRoZSBjbGllbnQgYXJlYSBzaXplLlxuICAgICAgICB0aGlzLmxvY2FsQnJvd3NlcnNJbmZvID0ge307XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZW5zdXJlTG9jYWxCcm93c2VySW5mbyAoYnJvd3NlcklkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMubG9jYWxCcm93c2Vyc0luZm9bYnJvd3NlcklkXSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB0aGlzLmxvY2FsQnJvd3NlcnNJbmZvW2Jyb3dzZXJJZF0gPSB7XG4gICAgICAgICAgICB3aW5kb3dEZXNjcmlwdG9yOiAgbnVsbCxcbiAgICAgICAgICAgIG1heFNjcmVlblNpemU6ICAgICBudWxsLFxuICAgICAgICAgICAgcmVzaXplQ29ycmVjdGlvbnM6IG51bGxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9maW5kV2luZG93IChicm93c2VySWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIGNvbnN0IHBhZ2VUaXRsZSA9IHRoaXMuX2dldFBhZ2VUaXRsZShicm93c2VySWQpO1xuXG4gICAgICAgIHJldHVybiBicm93c2VyVG9vbHMuZmluZFdpbmRvdyhwYWdlVGl0bGUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFBhZ2VUaXRsZSAoYnJvd3NlcklkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBpZiAodGhpcy5wbHVnaW4uZ2V0UGFnZVRpdGxlKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmdldFBhZ2VUaXRsZShicm93c2VySWQpO1xuXG4gICAgICAgIHJldHVybiBicm93c2VySWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0V2luZG93RGVzY3JpcHRvciAoYnJvd3NlcklkOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luLmdldFdpbmRvd0Rlc2NyaXB0b3IpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW4uZ2V0V2luZG93RGVzY3JpcHRvcihicm93c2VySWQpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmxvY2FsQnJvd3NlcnNJbmZvW2Jyb3dzZXJJZF0gJiYgdGhpcy5sb2NhbEJyb3dzZXJzSW5mb1ticm93c2VySWRdLndpbmRvd0Rlc2NyaXB0b3I7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc2V0V2luZG93RGVzY3JpcHRvciAoYnJvd3NlcklkOiBzdHJpbmcsIHdpbmRvd0Rlc2NyaXB0b3I6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luLnNldFdpbmRvd0Rlc2NyaXB0b3IpIHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldFdpbmRvd0Rlc2NyaXB0b3IoYnJvd3NlcklkLCB3aW5kb3dEZXNjcmlwdG9yKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sb2NhbEJyb3dzZXJzSW5mb1ticm93c2VySWRdLndpbmRvd0Rlc2NyaXB0b3IgPSB3aW5kb3dEZXNjcmlwdG9yO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldE1heFNjcmVlblNpemUgKGJyb3dzZXJJZDogc3RyaW5nKTogU2l6ZSB8IG51bGwge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbEJyb3dzZXJzSW5mb1ticm93c2VySWRdICYmIHRoaXMubG9jYWxCcm93c2Vyc0luZm9bYnJvd3NlcklkXS5tYXhTY3JlZW5TaXplO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFJlc2l6ZUNvcnJlY3Rpb25zIChicm93c2VySWQ6IHN0cmluZyk6IFNpemUgfCBudWxsIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxCcm93c2Vyc0luZm9bYnJvd3NlcklkXSAmJiB0aGlzLmxvY2FsQnJvd3NlcnNJbmZvW2Jyb3dzZXJJZF0ucmVzaXplQ29ycmVjdGlvbnM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfaXNCcm93c2VySWRsZSAoYnJvd3NlcklkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IEJyb3dzZXJDb25uZWN0aW9uLmdldEJ5SWQoYnJvd3NlcklkKSBhcyBCcm93c2VyQ29ubmVjdGlvbjtcblxuICAgICAgICByZXR1cm4gY29ubmVjdGlvbi5pZGxlO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2NhbGN1bGF0ZVJlc2l6ZUNvcnJlY3Rpb25zIChicm93c2VySWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAoIXRoaXMuX2lzQnJvd3NlcklkbGUoYnJvd3NlcklkKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBjb25zdCB0aXRsZSA9IGF3YWl0IHRoaXMucGx1Z2luLnJ1bkluaXRTY3JpcHQoYnJvd3NlcklkLCBHRVRfVElUTEVfU0NSSVBUKTtcblxuICAgICAgICBpZiAoIWF3YWl0IGJyb3dzZXJUb29scy5pc01heGltaXplZCh0aXRsZSkpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgY29uc3QgY3VycmVudFNpemUgPSBhd2FpdCB0aGlzLnBsdWdpbi5ydW5Jbml0U2NyaXB0KGJyb3dzZXJJZCwgR0VUX1dJTkRPV19ESU1FTlNJT05TX0lORk9fU0NSSVBUKSBhcyBXaW5kb3dEaW1lbnRpb25zSW5mbztcbiAgICAgICAgY29uc3QgZXRhbG9uU2l6ZSAgPSBzdWJ0cmFjdFNpemVzKGN1cnJlbnRTaXplLCBSRVNJWkVfRElGRl9TSVpFKTtcblxuICAgICAgICBhd2FpdCBicm93c2VyVG9vbHMucmVzaXplKHRpdGxlLCBjdXJyZW50U2l6ZS53aWR0aCwgY3VycmVudFNpemUuaGVpZ2h0LCBldGFsb25TaXplLndpZHRoLCBldGFsb25TaXplLmhlaWdodCk7XG5cbiAgICAgICAgbGV0IHJlc2l6ZWRTaXplICAgID0gYXdhaXQgdGhpcy5wbHVnaW4ucnVuSW5pdFNjcmlwdChicm93c2VySWQsIEdFVF9XSU5ET1dfRElNRU5TSU9OU19JTkZPX1NDUklQVCkgYXMgV2luZG93RGltZW50aW9uc0luZm87XG4gICAgICAgIGxldCBjb3JyZWN0aW9uU2l6ZSA9IHN1YnRyYWN0U2l6ZXMocmVzaXplZFNpemUsIGV0YWxvblNpemUpO1xuXG4gICAgICAgIGF3YWl0IGJyb3dzZXJUb29scy5yZXNpemUodGl0bGUsIHJlc2l6ZWRTaXplLndpZHRoLCByZXNpemVkU2l6ZS5oZWlnaHQsIGV0YWxvblNpemUud2lkdGgsIGV0YWxvblNpemUuaGVpZ2h0KTtcblxuICAgICAgICByZXNpemVkU2l6ZSA9IGF3YWl0IHRoaXMucGx1Z2luLnJ1bkluaXRTY3JpcHQoYnJvd3NlcklkLCBHRVRfV0lORE9XX0RJTUVOU0lPTlNfSU5GT19TQ1JJUFQpIGFzIFdpbmRvd0RpbWVudGlvbnNJbmZvO1xuXG4gICAgICAgIGNvcnJlY3Rpb25TaXplID0gc3VtU2l6ZXMoY29ycmVjdGlvblNpemUsIHN1YnRyYWN0U2l6ZXMocmVzaXplZFNpemUsIGV0YWxvblNpemUpKTtcblxuICAgICAgICBpZiAodGhpcy5sb2NhbEJyb3dzZXJzSW5mb1ticm93c2VySWRdKVxuICAgICAgICAgICAgdGhpcy5sb2NhbEJyb3dzZXJzSW5mb1ticm93c2VySWRdLnJlc2l6ZUNvcnJlY3Rpb25zID0gY29ycmVjdGlvblNpemU7XG5cbiAgICAgICAgYXdhaXQgYnJvd3NlclRvb2xzLm1heGltaXplKHRpdGxlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9jYWxjdWxhdGVNYWNTaXplTGltaXRzIChicm93c2VySWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAoIXRoaXMuX2lzQnJvd3NlcklkbGUoYnJvd3NlcklkKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBjb25zdCBzaXplSW5mbyA9IGF3YWl0IHRoaXMucGx1Z2luLnJ1bkluaXRTY3JpcHQoYnJvd3NlcklkLCBHRVRfV0lORE9XX0RJTUVOU0lPTlNfSU5GT19TQ1JJUFQpIGFzIFdpbmRvd0RpbWVudGlvbnNJbmZvO1xuXG4gICAgICAgIGlmICh0aGlzLmxvY2FsQnJvd3NlcnNJbmZvW2Jyb3dzZXJJZF0pIHtcbiAgICAgICAgICAgIHRoaXMubG9jYWxCcm93c2Vyc0luZm9bYnJvd3NlcklkXS5tYXhTY3JlZW5TaXplID0ge1xuICAgICAgICAgICAgICAgIHdpZHRoOiAgc2l6ZUluZm8uYXZhaWxhYmxlV2lkdGggLSAoc2l6ZUluZm8ub3V0ZXJXaWR0aCAtIHNpemVJbmZvLndpZHRoKSxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHNpemVJbmZvLmF2YWlsYWJsZUhlaWdodCAtIChzaXplSW5mby5vdXRlckhlaWdodCAtIHNpemVJbmZvLmhlaWdodClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9lbnN1cmVCcm93c2VyV2luZG93RGVzY3JpcHRvciAoYnJvd3NlcklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuX2dldFdpbmRvd0Rlc2NyaXB0b3IoYnJvd3NlcklkKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBhd2FpdCB0aGlzLl9lbnN1cmVMb2NhbEJyb3dzZXJJbmZvKGJyb3dzZXJJZCk7XG5cbiAgICAgICAgLy8gTk9URTogZGVsYXkgdG8gZW5zdXJlIHRoZSB3aW5kb3cgZmluaXNoZWQgdGhlIG9wZW5pbmdcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4ud2FpdEZvckNvbm5lY3Rpb25SZWFkeShicm93c2VySWQpO1xuICAgICAgICBhd2FpdCBkZWxheShCUk9XU0VSX09QRU5JTkdfREVMQVkpO1xuXG4gICAgICAgIGlmICh0aGlzLmxvY2FsQnJvd3NlcnNJbmZvW2Jyb3dzZXJJZF0pIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbm5lY3Rpb24gICAgID0gQnJvd3NlckNvbm5lY3Rpb24uZ2V0QnlJZChicm93c2VySWQpIGFzIEJyb3dzZXJDb25uZWN0aW9uO1xuICAgICAgICAgICAgbGV0IHdpbmRvd0Rlc2NyaXB0b3IgPSBudWxsO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHdpbmRvd0Rlc2NyaXB0b3IgPSBhd2FpdCB0aGlzLl9maW5kV2luZG93KGJyb3dzZXJJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgLy8gTk9URTogV2UgY2FuIHN1cHByZXNzIHRoZSBlcnJvciBoZXJlIHNpbmNlIHdlIGNhbiBqdXN0IGRpc2FibGUgd2luZG93IG1hbmlwdWxhdGlvbiBmdW5jdGlvbnNcbiAgICAgICAgICAgICAgICAvLyB3aGVuIHdlIGNhbm5vdCBmaW5kIGEgbG9jYWwgd2luZG93IGRlc2NyaXB0b3JcbiAgICAgICAgICAgICAgICBERUJVR19MT0dHRVIoZXJyKTtcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmFkZFdhcm5pbmcoXG4gICAgICAgICAgICAgICAgICAgIFdBUk5JTkdfTUVTU0FHRS5jYW5ub3RGaW5kV2luZG93RGVzY3JpcHRvckVycm9yLFxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmJyb3dzZXJJbmZvLmFsaWFzLFxuICAgICAgICAgICAgICAgICAgICBlcnIubWVzc2FnZVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3NldFdpbmRvd0Rlc2NyaXB0b3IoYnJvd3NlcklkLCB3aW5kb3dEZXNjcmlwdG9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2Vuc3VyZUJyb3dzZXJXaW5kb3dQYXJhbWV0ZXJzIChicm93c2VySWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCB0aGlzLl9lbnN1cmVCcm93c2VyV2luZG93RGVzY3JpcHRvcihicm93c2VySWQpO1xuXG4gICAgICAgIGlmIChPUy53aW4gJiYgIXRoaXMuX2dldFJlc2l6ZUNvcnJlY3Rpb25zKGJyb3dzZXJJZCkpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9jYWxjdWxhdGVSZXNpemVDb3JyZWN0aW9ucyhicm93c2VySWQpO1xuICAgICAgICBlbHNlIGlmIChPUy5tYWMgJiYgIXRoaXMuX2dldE1heFNjcmVlblNpemUoYnJvd3NlcklkKSlcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX2NhbGN1bGF0ZU1hY1NpemVMaW1pdHMoYnJvd3NlcklkKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9jbG9zZUxvY2FsQnJvd3NlciAoYnJvd3NlcklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luLm5lZWRDbGVhblVwQnJvd3NlckluZm8pXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5jbGVhblVwQnJvd3NlckluZm8oYnJvd3NlcklkKTtcblxuICAgICAgICBjb25zdCB3aW5kb3dEZXNjcmlwdG9yID0gdGhpcy5fZ2V0V2luZG93RGVzY3JpcHRvcihicm93c2VySWQpO1xuXG4gICAgICAgIGF3YWl0IGJyb3dzZXJUb29scy5jbG9zZSh3aW5kb3dEZXNjcmlwdG9yKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9yZXNpemVMb2NhbEJyb3dzZXJXaW5kb3cgKGJyb3dzZXJJZDogc3RyaW5nLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgY3VycmVudFdpZHRoOiBudW1iZXIsIGN1cnJlbnRIZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCB0aGlzLl9lbnN1cmVCcm93c2VyV2luZG93RGVzY3JpcHRvcihicm93c2VySWQpO1xuXG4gICAgICAgIGNvbnN0IHJlc2l6ZUNvcnJlY3Rpb25zID0gdGhpcy5fZ2V0UmVzaXplQ29ycmVjdGlvbnMoYnJvd3NlcklkKTtcblxuICAgICAgICBpZiAocmVzaXplQ29ycmVjdGlvbnMgJiYgYXdhaXQgYnJvd3NlclRvb2xzLmlzTWF4aW1pemVkKHRoaXMuX2dldFdpbmRvd0Rlc2NyaXB0b3IoYnJvd3NlcklkKSkpIHtcbiAgICAgICAgICAgIHdpZHRoIC09IHJlc2l6ZUNvcnJlY3Rpb25zLndpZHRoO1xuICAgICAgICAgICAgaGVpZ2h0IC09IHJlc2l6ZUNvcnJlY3Rpb25zLmhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IGJyb3dzZXJUb29scy5yZXNpemUodGhpcy5fZ2V0V2luZG93RGVzY3JpcHRvcihicm93c2VySWQpLCBjdXJyZW50V2lkdGgsIGN1cnJlbnRIZWlnaHQsIHdpZHRoLCBoZWlnaHQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3Rha2VMb2NhbEJyb3dzZXJTY3JlZW5zaG90IChicm93c2VySWQ6IHN0cmluZywgc2NyZWVuc2hvdFBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBicm93c2VyVG9vbHMuc2NyZWVuc2hvdCh0aGlzLl9nZXRXaW5kb3dEZXNjcmlwdG9yKGJyb3dzZXJJZCksIHNjcmVlbnNob3RQYXRoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9jYW5SZXNpemVMb2NhbEJyb3dzZXJXaW5kb3dUb0RpbWVuc2lvbnMgKGJyb3dzZXJJZDogc3RyaW5nLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBpZiAoIU9TLm1hYylcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGNvbnN0IG1heFNjcmVlblNpemUgPSB0aGlzLl9nZXRNYXhTY3JlZW5TaXplKGJyb3dzZXJJZCkgYXMgU2l6ZTtcblxuICAgICAgICByZXR1cm4gd2lkdGggPD0gbWF4U2NyZWVuU2l6ZS53aWR0aCAmJiBoZWlnaHQgPD0gbWF4U2NyZWVuU2l6ZS5oZWlnaHQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfbWF4aW1pemVMb2NhbEJyb3dzZXJXaW5kb3cgKGJyb3dzZXJJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuX2Vuc3VyZUJyb3dzZXJXaW5kb3dEZXNjcmlwdG9yKGJyb3dzZXJJZCk7XG5cbiAgICAgICAgYXdhaXQgYnJvd3NlclRvb2xzLm1heGltaXplKHRoaXMuX2dldFdpbmRvd0Rlc2NyaXB0b3IoYnJvd3NlcklkKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfZW5zdXJlUmV0cnlUZXN0UGFnZXNXYXJuaW5nIChicm93c2VySWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gQnJvd3NlckNvbm5lY3Rpb24uZ2V0QnlJZChicm93c2VySWQpIGFzIEJyb3dzZXJDb25uZWN0aW9uO1xuXG4gICAgICAgIGlmIChjb25uZWN0aW9uPy5yZXRyeVRlc3RQYWdlcykge1xuICAgICAgICAgICAgY29uc3QgaXNTZXJ2aWNlV29ya2VyRW5hYmxlZCA9IGF3YWl0IHRoaXMucGx1Z2luLnJ1bkluaXRTY3JpcHQoYnJvd3NlcklkLCBHRVRfSVNfU0VSVklDRV9XT1JLRVJfRU5BQkxFRCk7XG5cbiAgICAgICAgICAgIGlmICghaXNTZXJ2aWNlV29ya2VyRW5hYmxlZClcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmFkZFdhcm5pbmcoV0FSTklOR19NRVNTQUdFLnJldHJ5VGVzdFBhZ2VzSXNOb3RTdXBwb3J0ZWQsIGNvbm5lY3Rpb24uYnJvd3NlckluZm8uYWxpYXMsIGNvbm5lY3Rpb24uYnJvd3NlckluZm8uYWxpYXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNhblVzZURlZmF1bHRXaW5kb3dBY3Rpb25zIChicm93c2VySWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCBpc0xvY2FsQnJvd3NlciAgICA9IGF3YWl0IHRoaXMucGx1Z2luLmlzTG9jYWxCcm93c2VyKGJyb3dzZXJJZCk7XG4gICAgICAgIGNvbnN0IGlzSGVhZGxlc3NCcm93c2VyID0gYXdhaXQgdGhpcy5wbHVnaW4uaXNIZWFkbGVzc0Jyb3dzZXIoYnJvd3NlcklkKTtcblxuICAgICAgICByZXR1cm4gaXNMb2NhbEJyb3dzZXIgJiYgIWlzSGVhZGxlc3NCcm93c2VyO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBpbml0ICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgaW5pdGlhbGl6ZWQgPSBhd2FpdCB0aGlzLmluaXRQcm9taXNlO1xuXG4gICAgICAgIGlmIChpbml0aWFsaXplZClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB0aGlzLmluaXRQcm9taXNlID0gdGhpcy5wbHVnaW5cbiAgICAgICAgICAgIC5pbml0KClcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRydWUpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmluaXRQcm9taXNlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5pbml0UHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG5cbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGRpc3Bvc2UgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBpbml0aWFsaXplZCA9IGF3YWl0IHRoaXMuaW5pdFByb21pc2U7XG5cbiAgICAgICAgaWYgKCFpbml0aWFsaXplZClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB0aGlzLmluaXRQcm9taXNlID0gdGhpcy5wbHVnaW5cbiAgICAgICAgICAgIC5kaXNwb3NlKClcbiAgICAgICAgICAgIC50aGVuKCgpID0+IGZhbHNlKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5pbml0UHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBpc0xvY2FsQnJvd3NlciAoYnJvd3NlcklkPzogc3RyaW5nLCBicm93c2VyTmFtZT86IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5wbHVnaW4uaXNMb2NhbEJyb3dzZXIoYnJvd3NlcklkLCBicm93c2VyTmFtZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGlzSGVhZGxlc3NCcm93c2VyIChicm93c2VySWQ/OiBzdHJpbmcsIGJyb3dzZXJOYW1lPzogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5pc0hlYWRsZXNzQnJvd3Nlcihicm93c2VySWQsIGJyb3dzZXJOYW1lKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgb3BlbkJyb3dzZXIgKGJyb3dzZXJJZDogc3RyaW5nLCBwYWdlVXJsOiBzdHJpbmcsIGJyb3dzZXJOYW1lOiBzdHJpbmcsIGRpc2FibGVNdWx0aXBsZVdpbmRvd3M6IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4ub3BlbkJyb3dzZXIoYnJvd3NlcklkLCBwYWdlVXJsLCBicm93c2VyTmFtZSwgZGlzYWJsZU11bHRpcGxlV2luZG93cyk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fZW5zdXJlUmV0cnlUZXN0UGFnZXNXYXJuaW5nKGJyb3dzZXJJZCk7XG5cbiAgICAgICAgaWYgKGF3YWl0IHRoaXMuY2FuVXNlRGVmYXVsdFdpbmRvd0FjdGlvbnMoYnJvd3NlcklkKSlcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX2Vuc3VyZUJyb3dzZXJXaW5kb3dQYXJhbWV0ZXJzKGJyb3dzZXJJZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNsb3NlQnJvd3NlciAoYnJvd3NlcklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgY2FuVXNlRGVmYXVsdFdpbmRvd0FjdGlvbnMgPSBhd2FpdCB0aGlzLmNhblVzZURlZmF1bHRXaW5kb3dBY3Rpb25zKGJyb3dzZXJJZCk7XG4gICAgICAgIGNvbnN0IGN1c3RvbUFjdGlvbnNJbmZvICAgICAgICAgID0gYXdhaXQgdGhpcy5oYXNDdXN0b21BY3Rpb25Gb3JCcm93c2VyKGJyb3dzZXJJZCk7XG4gICAgICAgIGNvbnN0IGhhc0N1c3RvbUNsb3NlQnJvd3NlciAgICAgID0gY3VzdG9tQWN0aW9uc0luZm8uaGFzQ2xvc2VCcm93c2VyO1xuICAgICAgICBjb25zdCB1c2VQbHVnaW5zQ2xvc2VCcm93c2VyICAgICA9IGhhc0N1c3RvbUNsb3NlQnJvd3NlciB8fCAhY2FuVXNlRGVmYXVsdFdpbmRvd0FjdGlvbnM7XG5cbiAgICAgICAgaWYgKHVzZVBsdWdpbnNDbG9zZUJyb3dzZXIpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5jbG9zZUJyb3dzZXIoYnJvd3NlcklkKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fY2xvc2VMb2NhbEJyb3dzZXIoYnJvd3NlcklkKTtcblxuICAgICAgICBpZiAoY2FuVXNlRGVmYXVsdFdpbmRvd0FjdGlvbnMpXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5sb2NhbEJyb3dzZXJzSW5mb1ticm93c2VySWRdO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBnZXRCcm93c2VyTGlzdCAoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5wbHVnaW4uZ2V0QnJvd3Nlckxpc3QoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgaXNWYWxpZEJyb3dzZXJOYW1lIChicm93c2VyTmFtZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnBsdWdpbi5pc1ZhbGlkQnJvd3Nlck5hbWUoYnJvd3Nlck5hbWUpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyByZXNpemVXaW5kb3cgKGJyb3dzZXJJZDogc3RyaW5nLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgY3VycmVudFdpZHRoOiBudW1iZXIsIGN1cnJlbnRIZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBjYW5Vc2VEZWZhdWx0V2luZG93QWN0aW9ucyA9IGF3YWl0IHRoaXMuY2FuVXNlRGVmYXVsdFdpbmRvd0FjdGlvbnMoYnJvd3NlcklkKTtcbiAgICAgICAgY29uc3QgY3VzdG9tQWN0aW9uc0luZm8gICAgICAgICAgPSBhd2FpdCB0aGlzLmhhc0N1c3RvbUFjdGlvbkZvckJyb3dzZXIoYnJvd3NlcklkKTtcbiAgICAgICAgY29uc3QgaGFzQ3VzdG9tUmVzaXplV2luZG93ICAgICAgPSBjdXN0b21BY3Rpb25zSW5mby5oYXNSZXNpemVXaW5kb3c7XG5cblxuICAgICAgICBpZiAoY2FuVXNlRGVmYXVsdFdpbmRvd0FjdGlvbnMgJiYgIWhhc0N1c3RvbVJlc2l6ZVdpbmRvdykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fcmVzaXplTG9jYWxCcm93c2VyV2luZG93KGJyb3dzZXJJZCwgd2lkdGgsIGhlaWdodCwgY3VycmVudFdpZHRoLCBjdXJyZW50SGVpZ2h0KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnJlc2l6ZVdpbmRvdyhicm93c2VySWQsIHdpZHRoLCBoZWlnaHQsIGN1cnJlbnRXaWR0aCwgY3VycmVudEhlaWdodCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNhblJlc2l6ZVdpbmRvd1RvRGltZW5zaW9ucyAoYnJvd3NlcklkOiBzdHJpbmcsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IGNhblVzZURlZmF1bHRXaW5kb3dBY3Rpb25zICAgICA9IGF3YWl0IHRoaXMuY2FuVXNlRGVmYXVsdFdpbmRvd0FjdGlvbnMoYnJvd3NlcklkKTtcbiAgICAgICAgY29uc3QgY3VzdG9tQWN0aW9uc0luZm8gICAgICAgICAgICAgID0gYXdhaXQgdGhpcy5oYXNDdXN0b21BY3Rpb25Gb3JCcm93c2VyKGJyb3dzZXJJZCk7XG4gICAgICAgIGNvbnN0IGhhc0N1c3RvbUNhblJlc2l6ZVRvRGltZW5zaW9ucyA9IGN1c3RvbUFjdGlvbnNJbmZvLmhhc0NhblJlc2l6ZVdpbmRvd1RvRGltZW5zaW9ucztcblxuXG4gICAgICAgIGlmIChjYW5Vc2VEZWZhdWx0V2luZG93QWN0aW9ucyAmJiAhaGFzQ3VzdG9tQ2FuUmVzaXplVG9EaW1lbnNpb25zKVxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2NhblJlc2l6ZUxvY2FsQnJvd3NlcldpbmRvd1RvRGltZW5zaW9ucyhicm93c2VySWQsIHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnBsdWdpbi5jYW5SZXNpemVXaW5kb3dUb0RpbWVuc2lvbnMoYnJvd3NlcklkLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgbWF4aW1pemVXaW5kb3cgKGJyb3dzZXJJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGNhblVzZURlZmF1bHRXaW5kb3dBY3Rpb25zID0gYXdhaXQgdGhpcy5jYW5Vc2VEZWZhdWx0V2luZG93QWN0aW9ucyhicm93c2VySWQpO1xuICAgICAgICBjb25zdCBjdXN0b21BY3Rpb25zSW5mbyAgICAgICAgICA9IGF3YWl0IHRoaXMuaGFzQ3VzdG9tQWN0aW9uRm9yQnJvd3Nlcihicm93c2VySWQpO1xuICAgICAgICBjb25zdCBoYXNDdXN0b21NYXhpbWl6ZVdpbmRvdyAgICA9IGN1c3RvbUFjdGlvbnNJbmZvLmhhc01heGltaXplV2luZG93O1xuXG4gICAgICAgIGlmIChjYW5Vc2VEZWZhdWx0V2luZG93QWN0aW9ucyAmJiAhaGFzQ3VzdG9tTWF4aW1pemVXaW5kb3cpXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5fbWF4aW1pemVMb2NhbEJyb3dzZXJXaW5kb3coYnJvd3NlcklkKTtcblxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5wbHVnaW4ubWF4aW1pemVXaW5kb3coYnJvd3NlcklkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgdGFrZVNjcmVlbnNob3QgKGJyb3dzZXJJZDogc3RyaW5nLCBzY3JlZW5zaG90UGF0aDogc3RyaW5nLCBwYWdlV2lkdGg6IG51bWJlciwgcGFnZUhlaWdodDogbnVtYmVyLCBmdWxsUGFnZTogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBjYW5Vc2VEZWZhdWx0V2luZG93QWN0aW9ucyAgPSBhd2FpdCB0aGlzLmNhblVzZURlZmF1bHRXaW5kb3dBY3Rpb25zKGJyb3dzZXJJZCk7XG4gICAgICAgIGNvbnN0IGN1c3RvbUFjdGlvbnNJbmZvICAgICAgICAgICA9IGF3YWl0IHRoaXMuaGFzQ3VzdG9tQWN0aW9uRm9yQnJvd3Nlcihicm93c2VySWQpO1xuICAgICAgICBjb25zdCBoYXNDdXN0b21UYWtlU2NyZWVuc2hvdCAgICAgPSBjdXN0b21BY3Rpb25zSW5mby5oYXNUYWtlU2NyZWVuc2hvdDtcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiAgICAgICAgICAgICAgICAgID0gQnJvd3NlckNvbm5lY3Rpb24uZ2V0QnlJZChicm93c2VySWQpIGFzIEJyb3dzZXJDb25uZWN0aW9uO1xuICAgICAgICBjb25zdCB0YWtlTG9jYWxCcm93c2Vyc1NjcmVlbnNob3QgPSBjYW5Vc2VEZWZhdWx0V2luZG93QWN0aW9ucyAmJiAhaGFzQ3VzdG9tVGFrZVNjcmVlbnNob3Q7XG4gICAgICAgIGNvbnN0IGlzTG9jYWxGdWxsUGFnZU1vZGUgICAgICAgICA9IHRha2VMb2NhbEJyb3dzZXJzU2NyZWVuc2hvdCAmJiBmdWxsUGFnZTtcblxuICAgICAgICBpZiAoaXNMb2NhbEZ1bGxQYWdlTW9kZSkge1xuICAgICAgICAgICAgY29ubmVjdGlvbi5hZGRXYXJuaW5nKFdBUk5JTkdfTUVTU0FHRS5zY3JlZW5zaG90c0Z1bGxQYWdlTm90U3VwcG9ydGVkLCBjb25uZWN0aW9uLmJyb3dzZXJJbmZvLmFsaWFzKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgbWFrZURpcihkaXJuYW1lKHNjcmVlbnNob3RQYXRoKSk7XG5cbiAgICAgICAgaWYgKHRha2VMb2NhbEJyb3dzZXJzU2NyZWVuc2hvdClcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3Rha2VMb2NhbEJyb3dzZXJTY3JlZW5zaG90KGJyb3dzZXJJZCwgc2NyZWVuc2hvdFBhdGgpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi50YWtlU2NyZWVuc2hvdChicm93c2VySWQsIHNjcmVlbnNob3RQYXRoLCBwYWdlV2lkdGgsIHBhZ2VIZWlnaHQsIGZ1bGxQYWdlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgZ2V0VmlkZW9GcmFtZURhdGEgKGJyb3dzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmdldFZpZGVvRnJhbWVEYXRhKGJyb3dzZXJJZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGhhc0N1c3RvbUFjdGlvbkZvckJyb3dzZXIgKGJyb3dzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmhhc0N1c3RvbUFjdGlvbkZvckJyb3dzZXIoYnJvd3NlcklkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcmVwb3J0Sm9iUmVzdWx0IChicm93c2VySWQ6IHN0cmluZywgc3RhdHVzOiBzdHJpbmcsIGRhdGE6IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5yZXBvcnRKb2JSZXN1bHQoYnJvd3NlcklkLCBzdGF0dXMsIGRhdGEpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRBY3RpdmVXaW5kb3dJZCAoYnJvd3NlcklkOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICAgICAgaWYgKCF0aGlzLnBsdWdpbi5zdXBwb3J0TXVsdGlwbGVXaW5kb3dzKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmdldEFjdGl2ZVdpbmRvd0lkKGJyb3dzZXJJZCk7XG4gICAgfVxuXG4gICAgcHVibGljIHNldEFjdGl2ZVdpbmRvd0lkIChicm93c2VySWQ6IHN0cmluZywgdmFsOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0QWN0aXZlV2luZG93SWQoYnJvd3NlcklkLCB2YWwpO1xuICAgIH1cbn1cbiJdfQ==
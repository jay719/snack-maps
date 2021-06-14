"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const time_limit_promise_1 = __importDefault(require("time-limit-promise"));
const events_1 = require("events");
const mustache_1 = __importDefault(require("mustache"));
const lodash_1 = require("lodash");
const parse_user_agent_1 = __importDefault(require("../../utils/parse-user-agent"));
const read_file_relative_1 = require("read-file-relative");
const promisify_event_1 = __importDefault(require("promisify-event"));
const nanoid_1 = __importDefault(require("nanoid"));
const command_1 = __importDefault(require("./command"));
const status_1 = __importDefault(require("./status"));
const heartbeat_status_1 = __importDefault(require("./heartbeat-status"));
const runtime_1 = require("../../errors/runtime");
const types_1 = require("../../errors/types");
const warning_log_1 = __importDefault(require("../../notifications/warning-log"));
const browser_connection_timeouts_1 = require("../../utils/browser-connection-timeouts");
const getBrowserConnectionDebugScope = (id) => `testcafe:browser:connection:${id}`;
const IDLE_PAGE_TEMPLATE = read_file_relative_1.readSync('../../client/browser/idle-page/index.html.mustache');
const connections = {};
class BrowserConnection extends events_1.EventEmitter {
    constructor(gateway, browserInfo, permanent, disableMultipleWindows = false) {
        super();
        this.HEARTBEAT_TIMEOUT = browser_connection_timeouts_1.HEARTBEAT_TIMEOUT;
        this.BROWSER_CLOSE_TIMEOUT = browser_connection_timeouts_1.BROWSER_CLOSE_TIMEOUT;
        this.BROWSER_RESTART_TIMEOUT = browser_connection_timeouts_1.BROWSER_RESTART_TIMEOUT;
        this.id = BrowserConnection._generateId();
        this.jobQueue = [];
        this.initScriptsQueue = [];
        this.browserConnectionGateway = gateway;
        this.disconnectionPromise = null;
        this.testRunAborted = false;
        this.warningLog = new warning_log_1.default();
        this.debugLogger = debug_1.default(getBrowserConnectionDebugScope(this.id));
        this.browserInfo = browserInfo;
        this.browserInfo.userAgentProviderMetaInfo = '';
        this.provider = browserInfo.provider;
        this.permanent = permanent;
        this.status = status_1.default.uninitialized;
        this.idle = true;
        this.heartbeatTimeout = null;
        this.pendingTestRunUrl = null;
        this.disableMultipleWindows = disableMultipleWindows;
        this.url = `${gateway.domain}/browser/connect/${this.id}`;
        this.idleUrl = `${gateway.domain}/browser/idle/${this.id}`;
        this.forcedIdleUrl = `${gateway.domain}/browser/idle-forced/${this.id}`;
        this.initScriptUrl = `${gateway.domain}/browser/init-script/${this.id}`;
        this.heartbeatRelativeUrl = `/browser/heartbeat/${this.id}`;
        this.statusRelativeUrl = `/browser/status/${this.id}`;
        this.statusDoneRelativeUrl = `/browser/status-done/${this.id}`;
        this.activeWindowIdUrl = `/browser/active-window-id/${this.id}`;
        this.heartbeatUrl = `${gateway.domain}${this.heartbeatRelativeUrl}`;
        this.statusUrl = `${gateway.domain}${this.statusRelativeUrl}`;
        this.statusDoneUrl = `${gateway.domain}${this.statusDoneRelativeUrl}`;
        this._setEventHandlers();
        connections[this.id] = this;
        this.previousActiveWindowId = null;
        this.browserConnectionGateway.startServingConnection(this);
        // NOTE: Give a caller time to assign event listeners
        process.nextTick(() => this._runBrowser());
    }
    _setEventHandlers() {
        this.on('error', e => {
            this.debugLogger(e);
            this._forceIdle();
            this.close();
        });
        for (const name in status_1.default) {
            const status = status_1.default[name];
            this.on(status, () => {
                this.debugLogger(`status changed to '${status}'`);
            });
        }
    }
    static _generateId() {
        return nanoid_1.default(7);
    }
    async _runBrowser() {
        try {
            await this.provider.openBrowser(this.id, this.url, this.browserInfo.browserName, this.disableMultipleWindows);
            if (this.status !== status_1.default.ready)
                await promisify_event_1.default(this, 'ready');
            this.status = status_1.default.opened;
            this.emit('opened');
        }
        catch (err) {
            this.emit('error', new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.unableToOpenBrowser, this.browserInfo.providerName + ':' + this.browserInfo.browserName, err.stack));
        }
    }
    async _closeBrowser() {
        if (!this.idle)
            await promisify_event_1.default(this, 'idle');
        try {
            await this.provider.closeBrowser(this.id);
        }
        catch (err) {
            // NOTE: A warning would be really nice here, but it can't be done while log is stored in a task.
            this.debugLogger(err);
        }
    }
    _forceIdle() {
        if (!this.idle) {
            this.idle = true;
            this.emit('idle');
        }
    }
    _createBrowserDisconnectedError() {
        return new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.browserDisconnected, this.userAgent);
    }
    _waitForHeartbeat() {
        this.heartbeatTimeout = setTimeout(() => {
            const err = this._createBrowserDisconnectedError();
            this.status = status_1.default.disconnected;
            this.testRunAborted = true;
            this.emit('disconnected', err);
            this._restartBrowserOnDisconnect(err);
        }, this.HEARTBEAT_TIMEOUT);
    }
    async _getTestRunUrl(needPopNext) {
        if (needPopNext || !this.pendingTestRunUrl)
            this.pendingTestRunUrl = await this._popNextTestRunUrl();
        return this.pendingTestRunUrl;
    }
    async _popNextTestRunUrl() {
        while (this.hasQueuedJobs && !this.currentJob.hasQueuedTestRuns)
            this.jobQueue.shift();
        return this.hasQueuedJobs ? await this.currentJob.popNextTestRunUrl(this) : null;
    }
    static getById(id) {
        return connections[id] || null;
    }
    async _restartBrowser() {
        this.status = status_1.default.uninitialized;
        this._forceIdle();
        let resolveTimeout = null;
        let isTimeoutExpired = false;
        let timeout = null;
        const restartPromise = time_limit_promise_1.default(this._closeBrowser(), this.BROWSER_CLOSE_TIMEOUT, { rejectWith: new runtime_1.TimeoutError() })
            .catch(err => this.debugLogger(err))
            .then(() => this._runBrowser());
        const timeoutPromise = new Promise(resolve => {
            resolveTimeout = resolve;
            timeout = setTimeout(() => {
                isTimeoutExpired = true;
                resolve();
            }, this.BROWSER_RESTART_TIMEOUT);
        });
        return Promise.race([restartPromise, timeoutPromise])
            .then(() => {
            clearTimeout(timeout);
            if (isTimeoutExpired)
                this.emit('error', this._createBrowserDisconnectedError());
            else
                resolveTimeout();
        });
    }
    _restartBrowserOnDisconnect(err) {
        let resolveFn = null;
        let rejectFn = null;
        this.disconnectionPromise = new Promise((resolve, reject) => {
            resolveFn = resolve;
            rejectFn = () => {
                reject(err);
            };
            setTimeout(() => {
                rejectFn();
            });
        })
            .then(() => {
            return this._restartBrowser();
        })
            .catch(e => {
            this.emit('error', e);
        });
        this.disconnectionPromise.resolve = resolveFn;
        this.disconnectionPromise.reject = rejectFn;
    }
    async getDefaultBrowserInitTimeout() {
        const isLocalBrowser = await this.provider.isLocalBrowser(this.id, this.browserInfo.browserName);
        return isLocalBrowser ? browser_connection_timeouts_1.LOCAL_BROWSER_INIT_TIMEOUT : browser_connection_timeouts_1.REMOTE_BROWSER_INIT_TIMEOUT;
    }
    async processDisconnection(disconnectionThresholdExceeded) {
        const { resolve, reject } = this.disconnectionPromise;
        if (disconnectionThresholdExceeded)
            reject();
        else
            resolve();
    }
    addWarning(...args) {
        if (this.currentJob)
            this.currentJob.warningLog.addWarning(...args);
        else
            this.warningLog.addWarning(...args);
    }
    _appendToPrettyUserAgent(str) {
        this.browserInfo.parsedUserAgent.prettyUserAgent += ` (${str})`;
    }
    _moveWarningLogToJob(job) {
        this.warningLog.copyTo(job.warningLog);
        this.warningLog.clear();
    }
    setProviderMetaInfo(str, options) {
        const appendToUserAgent = options === null || options === void 0 ? void 0 : options.appendToUserAgent;
        if (appendToUserAgent) {
            // NOTE:
            // change prettyUserAgent only when connection already was established
            if (this.isReady())
                this._appendToPrettyUserAgent(str);
            else
                this.on('ready', () => this._appendToPrettyUserAgent(str));
            return;
        }
        this.browserInfo.userAgentProviderMetaInfo = str;
    }
    get userAgent() {
        let userAgent = this.browserInfo.parsedUserAgent.prettyUserAgent;
        if (this.browserInfo.userAgentProviderMetaInfo)
            userAgent += ` (${this.browserInfo.userAgentProviderMetaInfo})`;
        return userAgent;
    }
    get retryTestPages() {
        return this.browserConnectionGateway.retryTestPages;
    }
    get hasQueuedJobs() {
        return !!this.jobQueue.length;
    }
    get currentJob() {
        return this.jobQueue[0];
    }
    // API
    runInitScript(code) {
        return new Promise(resolve => this.initScriptsQueue.push({ code, resolve }));
    }
    addJob(job) {
        this.jobQueue.push(job);
        this._moveWarningLogToJob(job);
    }
    removeJob(job) {
        lodash_1.pull(this.jobQueue, job);
    }
    async close() {
        if (this.status === status_1.default.closing || this.status === status_1.default.closed)
            return;
        this.status = status_1.default.closing;
        this.emit(status_1.default.closing);
        await this._closeBrowser();
        this.browserConnectionGateway.stopServingConnection(this);
        if (this.heartbeatTimeout)
            clearTimeout(this.heartbeatTimeout);
        delete connections[this.id];
        this.status = status_1.default.closed;
        this.emit(status_1.default.closed);
    }
    establish(userAgent) {
        this.status = status_1.default.ready;
        this.browserInfo.parsedUserAgent = parse_user_agent_1.default(userAgent);
        this._waitForHeartbeat();
        this.emit('ready');
    }
    heartbeat() {
        if (this.heartbeatTimeout)
            clearTimeout(this.heartbeatTimeout);
        this._waitForHeartbeat();
        return {
            code: this.status === status_1.default.closing ? heartbeat_status_1.default.closing : heartbeat_status_1.default.ok,
            url: this.status === status_1.default.closing ? this.idleUrl : ''
        };
    }
    renderIdlePage() {
        return mustache_1.default.render(IDLE_PAGE_TEMPLATE, {
            userAgent: this.userAgent,
            statusUrl: this.statusUrl,
            heartbeatUrl: this.heartbeatUrl,
            initScriptUrl: this.initScriptUrl,
            retryTestPages: !!this.browserConnectionGateway.retryTestPages
        });
    }
    getInitScript() {
        const initScriptPromise = this.initScriptsQueue[0];
        return { code: initScriptPromise ? initScriptPromise.code : null };
    }
    handleInitScriptResult(data) {
        const initScriptPromise = this.initScriptsQueue.shift();
        if (initScriptPromise)
            initScriptPromise.resolve(JSON.parse(data));
    }
    isHeadlessBrowser() {
        return this.provider.isHeadlessBrowser(this.id);
    }
    async reportJobResult(status, data) {
        await this.provider.reportJobResult(this.id, status, data);
    }
    async getStatus(isTestDone) {
        if (!this.idle && !isTestDone) {
            this.idle = true;
            this.emit('idle');
        }
        if (this.status === status_1.default.opened) {
            const testRunUrl = await this._getTestRunUrl(isTestDone || this.testRunAborted);
            this.testRunAborted = false;
            if (testRunUrl) {
                this.idle = false;
                return { cmd: command_1.default.run, url: testRunUrl };
            }
        }
        return { cmd: command_1.default.idle, url: this.idleUrl };
    }
    get activeWindowId() {
        return this.provider.getActiveWindowId(this.id);
    }
    set activeWindowId(val) {
        this.previousActiveWindowId = this.activeWindowId;
        this.provider.setActiveWindowId(this.id, val);
    }
    async canUseDefaultWindowActions() {
        return this.provider.canUseDefaultWindowActions(this.id);
    }
    isReady() {
        return this.status === status_1.default.ready ||
            this.status === status_1.default.opened ||
            this.status === status_1.default.closing;
    }
}
exports.default = BrowserConnection;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYnJvd3Nlci9jb25uZWN0aW9uL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsa0RBQTBCO0FBQzFCLDRFQUEyQztBQUMzQyxtQ0FBc0M7QUFDdEMsd0RBQWdDO0FBQ2hDLG1DQUF3QztBQUN4QyxvRkFBK0U7QUFDL0UsMkRBQXNEO0FBQ3RELHNFQUE2QztBQUM3QyxvREFBNEI7QUFDNUIsd0RBQWdDO0FBQ2hDLHNEQUErQztBQUMvQywwRUFBaUQ7QUFDakQsa0RBQWtFO0FBQ2xFLDhDQUFvRDtBQUlwRCxrRkFBeUQ7QUFHekQseUZBTWlEO0FBRWpELE1BQU0sOEJBQThCLEdBQUcsQ0FBQyxFQUFVLEVBQVUsRUFBRSxDQUFDLCtCQUErQixFQUFFLEVBQUUsQ0FBQztBQUVuRyxNQUFNLGtCQUFrQixHQUEyQiw2QkFBSSxDQUFDLG9EQUFvRCxDQUFDLENBQUM7QUFDOUcsTUFBTSxXQUFXLEdBQWtDLEVBQUUsQ0FBQztBQXNDdEQsTUFBcUIsaUJBQWtCLFNBQVEscUJBQVk7SUFvQ3ZELFlBQ0ksT0FBaUMsRUFDakMsV0FBd0IsRUFDeEIsU0FBa0IsRUFDbEIsc0JBQXNCLEdBQUcsS0FBSztRQUM5QixLQUFLLEVBQUUsQ0FBQztRQUVSLElBQUksQ0FBQyxpQkFBaUIsR0FBUywrQ0FBaUIsQ0FBQztRQUNqRCxJQUFJLENBQUMscUJBQXFCLEdBQUssbURBQXFCLENBQUM7UUFDckQsSUFBSSxDQUFDLHVCQUF1QixHQUFHLHFEQUF1QixDQUFDO1FBRXZELElBQUksQ0FBQyxFQUFFLEdBQXlCLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2hFLElBQUksQ0FBQyxRQUFRLEdBQW1CLEVBQUUsQ0FBQztRQUNuQyxJQUFJLENBQUMsZ0JBQWdCLEdBQVcsRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxPQUFPLENBQUM7UUFDeEMs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QUcsS0FBSyxDQUFDO2dCQUVsQixPQUFPLEVBQUUsR0FBRyxFQUFFLGlCQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsQ0FBQzthQUNoRDtTQUNKO1FBRUQsT0FBTyxFQUFFLEdBQUcsRUFBRSxpQkFBTyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3BELENBQUM7SUFFRCxJQUFXLGNBQWM7UUFDckIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQsSUFBVyxjQUFjLENBQUUsR0FBRztRQUMxQixJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUVsRCxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVNLEtBQUssQ0FBQywwQkFBMEI7UUFDbkMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRU0sT0FBTztRQUNWLE9BQU8sSUFBSSxDQUFDLE1BQU0sS0FBSyxnQkFBdUIsQ0FBQyxLQUFLO1lBQ2hELElBQUksQ0FBQyxNQUFNLEtBQUssZ0JBQXVCLENBQUMsTUFBTTtZQUM5QyxJQUFJLENBQUMsTUFBTSxLQUFLLGdCQUF1QixDQUFDLE9BQU8sQ0FBQztJQUN4RCxDQUFDO0NBQ0o7QUE1YkQsb0NBNGJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCB0aW1lTGltaXQgZnJvbSAndGltZS1saW1pdC1wcm9taXNlJztcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgTXVzdGFjaGUgZnJvbSAnbXVzdGFjaGUnO1xuaW1wb3J0IHsgcHVsbCBhcyByZW1vdmUgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHBhcnNlVXNlckFnZW50LCB7IFBhcnNlZFVzZXJBZ2VudCB9IGZyb20gJy4uLy4uL3V0aWxzL3BhcnNlLXVzZXItYWdlbnQnO1xuaW1wb3J0IHsgcmVhZFN5bmMgYXMgcmVhZCB9IGZyb20gJ3JlYWQtZmlsZS1yZWxhdGl2ZSc7XG5pbXBvcnQgcHJvbWlzaWZ5RXZlbnQgZnJvbSAncHJvbWlzaWZ5LWV2ZW50JztcbmltcG9ydCBuYW5vaWQgZnJvbSAnbmFub2lkJztcbmltcG9ydCBDT01NQU5EIGZyb20gJy4vY29tbWFuZCc7XG5pbXBvcnQgQnJvd3NlckNvbm5lY3Rpb25TdGF0dXMgZnJvbSAnLi9zdGF0dXMnO1xuaW1wb3J0IEhlYXJ0YmVhdFN0YXR1cyBmcm9tICcuL2hlYXJ0YmVhdC1zdGF0dXMnO1xuaW1wb3J0IHsgR2VuZXJhbEVycm9yLCBUaW1lb3V0RXJyb3IgfSBmcm9tICcuLi8uLi9lcnJvcnMvcnVudGltZSc7XG5pbXBvcnQgeyBSVU5USU1FX0VSUk9SUyB9IGZyb20gJy4uLy4uL2Vycm9ycy90eXBlcyc7XG5pbXBvcnQgeyBEaWN0aW9uYXJ5IH0gZnJvbSAnLi4vLi4vY29uZmlndXJhdGlvbi9pbnRlcmZhY2VzJztcbmltcG9ydCBCcm93c2VyQ29ubmVjdGlvbkdhdGV3YXkgZnJvbSAnLi9nYXRld2F5JztcbmltcG9ydCBCcm93c2VySm9iIGZyb20gJy4uLy4uL3J1bm5lci9icm93c2VyLWpvYic7XG5pbXBvcnQgV2FybmluZ0xvZyBmcm9tICcuLi8uLi9ub3RpZmljYXRpb25zL3dhcm5pbmctbG9nJztcbmltcG9ydCBCcm93c2VyUHJvdmlkZXIgZnJvbSAnLi4vcHJvdmlkZXInO1xuXG5pbXBvcnQge1xuICAgIEJST1dTRVJfUkVTVEFSVF9USU1FT1VULFxuICAgIEJST1dTRVJfQ0xPU0VfVElNRU9VVCxcbiAgICBIRUFSVEJFQVRfVElNRU9VVCxcbiAgICBMT0NBTF9CUk9XU0VSX0lOSVRfVElNRU9VVCxcbiAgICBSRU1PVEVfQlJPV1NFUl9JTklUX1RJTUVPVVRcbn0gZnJvbSAnLi4vLi4vdXRpbHMvYnJvd3Nlci1jb25uZWN0aW9uLXRpbWVvdXRzJztcblxuY29uc3QgZ2V0QnJvd3NlckNvbm5lY3Rpb25EZWJ1Z1Njb3BlID0gKGlkOiBzdHJpbmcpOiBzdHJpbmcgPT4gYHRlc3RjYWZlOmJyb3dzZXI6Y29ubmVjdGlvbjoke2lkfWA7XG5cbmNvbnN0IElETEVfUEFHRV9URU1QTEFURSAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlYWQoJy4uLy4uL2NsaWVudC9icm93c2VyL2lkbGUtcGFnZS9pbmRleC5odG1sLm11c3RhY2hlJyk7XG5jb25zdCBjb25uZWN0aW9uczogRGljdGlvbmFyeTxCcm93c2VyQ29ubmVjdGlvbj4gPSB7fTtcblxuaW50ZXJmYWNlIERpc2Nvbm5lY3Rpb25Qcm9taXNlPFQ+IGV4dGVuZHMgUHJvbWlzZTxUPiB7XG4gICAgcmVzb2x2ZTogRnVuY3Rpb247XG4gICAgcmVqZWN0OiBGdW5jdGlvbjtcbn1cblxuaW50ZXJmYWNlIEJyb3dzZXJDb25uZWN0aW9uU3RhdHVzUmVzdWx0IHtcbiAgICBjbWQ6IHN0cmluZztcbiAgICB1cmw6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEhlYXJ0YmVhdFN0YXR1c1Jlc3VsdCB7XG4gICAgY29kZTogSGVhcnRiZWF0U3RhdHVzO1xuICAgIHVybDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSW5pdFNjcmlwdCB7XG4gICAgY29kZTogc3RyaW5nIHwgbnVsbDtcbn1cblxuaW50ZXJmYWNlIEluaXRTY3JpcHRUYXNrIGV4dGVuZHMgSW5pdFNjcmlwdCB7XG4gICAgcmVzb2x2ZTogRnVuY3Rpb247XG59XG5cbmludGVyZmFjZSBQcm92aWRlck1ldGFJbmZvT3B0aW9ucyB7XG4gICAgYXBwZW5kVG9Vc2VyQWdlbnQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJyb3dzZXJJbmZvIHtcbiAgICBhbGlhczogc3RyaW5nO1xuICAgIGJyb3dzZXJOYW1lOiBzdHJpbmc7XG4gICAgcHJvdmlkZXJOYW1lOiBzdHJpbmc7XG4gICAgcHJvdmlkZXI6IEJyb3dzZXJQcm92aWRlcjtcbiAgICB1c2VyQWdlbnRQcm92aWRlck1ldGFJbmZvOiBzdHJpbmc7XG4gICAgcGFyc2VkVXNlckFnZW50OiBQYXJzZWRVc2VyQWdlbnQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJyb3dzZXJDb25uZWN0aW9uIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBwdWJsaWMgcGVybWFuZW50OiBib29sZWFuO1xuICAgIHB1YmxpYyBwcmV2aW91c0FjdGl2ZVdpbmRvd0lkOiBzdHJpbmcgfCBudWxsO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZGlzYWJsZU11bHRpcGxlV2luZG93czogYm9vbGVhbjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IEhFQVJUQkVBVF9USU1FT1VUOiBudW1iZXI7XG4gICAgcHJpdmF0ZSByZWFkb25seSBCUk9XU0VSX0NMT1NFX1RJTUVPVVQ6IG51bWJlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IEJST1dTRVJfUkVTVEFSVF9USU1FT1VUOiBudW1iZXI7XG4gICAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBqb2JRdWV1ZTogQnJvd3NlckpvYltdO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgaW5pdFNjcmlwdHNRdWV1ZTogSW5pdFNjcmlwdFRhc2tbXTtcbiAgICBwcml2YXRlIGJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheTogQnJvd3NlckNvbm5lY3Rpb25HYXRld2F5O1xuICAgIHByaXZhdGUgZGlzY29ubmVjdGlvblByb21pc2U6IERpc2Nvbm5lY3Rpb25Qcm9taXNlPHZvaWQ+IHwgbnVsbDtcbiAgICBwcml2YXRlIHRlc3RSdW5BYm9ydGVkOiBib29sZWFuO1xuICAgIHB1YmxpYyBzdGF0dXM6IEJyb3dzZXJDb25uZWN0aW9uU3RhdHVzO1xuICAgIHByaXZhdGUgaGVhcnRiZWF0VGltZW91dDogTm9kZUpTLlRpbWVvdXQgfCBudWxsO1xuICAgIHByaXZhdGUgcGVuZGluZ1Rlc3RSdW5Vcmw6IHN0cmluZyB8IG51bGw7XG4gICAgcHVibGljIHJlYWRvbmx5IHVybDogc3RyaW5nO1xuICAgIHB1YmxpYyByZWFkb25seSBpZGxlVXJsOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBmb3JjZWRJZGxlVXJsOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBpbml0U2NyaXB0VXJsOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBoZWFydGJlYXRSZWxhdGl2ZVVybDogc3RyaW5nO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgc3RhdHVzUmVsYXRpdmVVcmw6IHN0cmluZztcbiAgICBwcml2YXRlIHJlYWRvbmx5IHN0YXR1c0RvbmVSZWxhdGl2ZVVybDogc3RyaW5nO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgaGVhcnRiZWF0VXJsOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBzdGF0dXNVcmw6IHN0cmluZztcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFjdGl2ZVdpbmRvd0lkVXJsOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBzdGF0dXNEb25lVXJsOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBkZWJ1Z0xvZ2dlcjogZGVidWcuRGVidWdnZXI7XG5cbiAgICBwdWJsaWMgcmVhZG9ubHkgd2FybmluZ0xvZzogV2FybmluZ0xvZztcblxuICAgIHB1YmxpYyBpZGxlOiBib29sZWFuO1xuXG4gICAgcHVibGljIGJyb3dzZXJJbmZvOiBCcm93c2VySW5mbztcbiAgICBwdWJsaWMgcHJvdmlkZXI6IGFueTtcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvciAoXG4gICAgICAgIGdhdGV3YXk6IEJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSxcbiAgICAgICAgYnJvd3NlckluZm86IEJyb3dzZXJJbmZvLFxuICAgICAgICBwZXJtYW5lbnQ6IGJvb2xlYW4sXG4gICAgICAgIGRpc2FibGVNdWx0aXBsZVdpbmRvd3MgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuSEVBUlRCRUFUX1RJTUVPVVQgICAgICAgPSBIRUFSVEJFQVRfVElNRU9VVDtcbiAgICAgICAgdGhpcy5CUk9XU0VSX0NMT1NFX1RJTUVPVVQgICA9IEJST1dTRVJfQ0xPU0VfVElNRU9VVDtcbiAgICAgICAgdGhpcy5CUk9XU0VSX1JFU1RBUlRfVElNRU9VVCA9IEJST1dTRVJfUkVTVEFSVF9USU1FT1VUO1xuXG4gICAgICAgIHRoaXMuaWQgICAgICAgICAgICAgICAgICAgICAgID0gQnJvd3NlckNvbm5lY3Rpb24uX2dlbmVyYXRlSWQoKTtcbiAgICAgICAgdGhpcy5qb2JRdWV1ZSAgICAgICAgICAgICAgICAgPSBbXTtcbiAgICAgICAgdGhpcy5pbml0U2NyaXB0c1F1ZXVlICAgICAgICAgPSBbXTtcbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbkdhdGV3YXkgPSBnYXRld2F5O1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3Rpb25Qcm9taXNlICAgICA9IG51bGw7XG4gICAgICAgIHRoaXMudGVzdFJ1bkFib3J0ZWQgICAgICAgICAgID0gZmFsc2U7XG4gICAgICAgIHRoaXMud2FybmluZ0xvZyAgICAgICAgICAgICAgID0gbmV3IFdhcm5pbmdMb2coKTtcbiAgICAgICAgdGhpcy5kZWJ1Z0xvZ2dlciAgICAgICAgICAgICAgPSBkZWJ1ZyhnZXRCcm93c2VyQ29ubmVjdGlvbkRlYnVnU2NvcGUodGhpcy5pZCkpO1xuXG4gICAgICAgIHRoaXMuYnJvd3NlckluZm8gICAgICAgICAgICAgICAgICAgICAgICAgICA9IGJyb3dzZXJJbmZvO1xuICAgICAgICB0aGlzLmJyb3dzZXJJbmZvLnVzZXJBZ2VudFByb3ZpZGVyTWV0YUluZm8gPSAnJztcblxuICAgICAgICB0aGlzLnByb3ZpZGVyID0gYnJvd3NlckluZm8ucHJvdmlkZXI7XG5cbiAgICAgICAgdGhpcy5wZXJtYW5lbnQgICAgICAgICAgICAgID0gcGVybWFuZW50O1xuICAgICAgICB0aGlzLnN0YXR1cyAgICAgICAgICAgICAgICAgPSBCcm93c2VyQ29ubmVjdGlvblN0YXR1cy51bmluaXRpYWxpemVkO1xuICAgICAgICB0aGlzLmlkbGUgICAgICAgICAgICAgICAgICAgPSB0cnVlO1xuICAgICAgICB0aGlzLmhlYXJ0YmVhdFRpbWVvdXQgICAgICAgPSBudWxsO1xuICAgICAgICB0aGlzLnBlbmRpbmdUZXN0UnVuVXJsICAgICAgPSBudWxsO1xuICAgICAgICB0aGlzLmRpc2FibGVNdWx0aXBsZVdpbmRvd3MgPSBkaXNhYmxlTXVsdGlwbGVXaW5kb3dzO1xuXG4gICAgICAgIHRoaXMudXJsICAgICAgICAgICA9IGAke2dhdGV3YXkuZG9tYWlufS9icm93c2VyL2Nvbm5lY3QvJHt0aGlzLmlkfWA7XG4gICAgICAgIHRoaXMuaWRsZVVybCAgICAgICA9IGAke2dhdGV3YXkuZG9tYWlufS9icm93c2VyL2lkbGUvJHt0aGlzLmlkfWA7XG4gICAgICAgIHRoaXMuZm9yY2VkSWRsZVVybCA9IGAke2dhdGV3YXkuZG9tYWlufS9icm93c2VyL2lkbGUtZm9yY2VkLyR7dGhpcy5pZH1gO1xuICAgICAgICB0aGlzLmluaXRTY3JpcHRVcmwgPSBgJHtnYXRld2F5LmRvbWFpbn0vYnJvd3Nlci9pbml0LXNjcmlwdC8ke3RoaXMuaWR9YDtcblxuICAgICAgICB0aGlzLmhlYXJ0YmVhdFJlbGF0aXZlVXJsICA9IGAvYnJvd3Nlci9oZWFydGJlYXQvJHt0aGlzLmlkfWA7XG4gICAgICAgIHRoaXMuc3RhdHVzUmVsYXRpdmVVcmwgICAgID0gYC9icm93c2VyL3N0YXR1cy8ke3RoaXMuaWR9YDtcbiAgICAgICAgdGhpcy5zdGF0dXNEb25lUmVsYXRpdmVVcmwgPSBgL2Jyb3dzZXIvc3RhdHVzLWRvbmUvJHt0aGlzLmlkfWA7XG4gICAgICAgIHRoaXMuYWN0aXZlV2luZG93SWRVcmwgICAgID0gYC9icm93c2VyL2FjdGl2ZS13aW5kb3ctaWQvJHt0aGlzLmlkfWA7XG5cbiAgICAgICAgdGhpcy5oZWFydGJlYXRVcmwgID0gYCR7Z2F0ZXdheS5kb21haW59JHt0aGlzLmhlYXJ0YmVhdFJlbGF0aXZlVXJsfWA7XG4gICAgICAgIHRoaXMuc3RhdHVzVXJsICAgICA9IGAke2dhdGV3YXkuZG9tYWlufSR7dGhpcy5zdGF0dXNSZWxhdGl2ZVVybH1gO1xuICAgICAgICB0aGlzLnN0YXR1c0RvbmVVcmwgPSBgJHtnYXRld2F5LmRvbWFpbn0ke3RoaXMuc3RhdHVzRG9uZVJlbGF0aXZlVXJsfWA7XG5cbiAgICAgICAgdGhpcy5fc2V0RXZlbnRIYW5kbGVycygpO1xuXG4gICAgICAgIGNvbm5lY3Rpb25zW3RoaXMuaWRdID0gdGhpcztcblxuICAgICAgICB0aGlzLnByZXZpb3VzQWN0aXZlV2luZG93SWQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuYnJvd3NlckNvbm5lY3Rpb25HYXRld2F5LnN0YXJ0U2VydmluZ0Nvbm5lY3Rpb24odGhpcyk7XG5cbiAgICAgICAgLy8gTk9URTogR2l2ZSBhIGNhbGxlciB0aW1lIHRvIGFzc2lnbiBldmVudCBsaXN0ZW5lcnNcbiAgICAgICAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB0aGlzLl9ydW5Ccm93c2VyKCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3NldEV2ZW50SGFuZGxlcnMgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLm9uKCdlcnJvcicsIGUgPT4ge1xuICAgICAgICAgICAgdGhpcy5kZWJ1Z0xvZ2dlcihlKTtcbiAgICAgICAgICAgIHRoaXMuX2ZvcmNlSWRsZSgpO1xuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBmb3IgKGNvbnN0IG5hbWUgaW4gQnJvd3NlckNvbm5lY3Rpb25TdGF0dXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IEJyb3dzZXJDb25uZWN0aW9uU3RhdHVzW25hbWUgYXMga2V5b2YgdHlwZW9mIEJyb3dzZXJDb25uZWN0aW9uU3RhdHVzXTtcblxuICAgICAgICAgICAgdGhpcy5vbihzdGF0dXMsICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlYnVnTG9nZ2VyKGBzdGF0dXMgY2hhbmdlZCB0byAnJHtzdGF0dXN9J2ApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBfZ2VuZXJhdGVJZCAoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIG5hbm9pZCg3KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9ydW5Ccm93c2VyICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHJvdmlkZXIub3BlbkJyb3dzZXIodGhpcy5pZCwgdGhpcy51cmwsIHRoaXMuYnJvd3NlckluZm8uYnJvd3Nlck5hbWUsIHRoaXMuZGlzYWJsZU11bHRpcGxlV2luZG93cyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXR1cyAhPT0gQnJvd3NlckNvbm5lY3Rpb25TdGF0dXMucmVhZHkpXG4gICAgICAgICAgICAgICAgYXdhaXQgcHJvbWlzaWZ5RXZlbnQodGhpcywgJ3JlYWR5Jyk7XG5cbiAgICAgICAgICAgIHRoaXMuc3RhdHVzID0gQnJvd3NlckNvbm5lY3Rpb25TdGF0dXMub3BlbmVkO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdvcGVuZWQnKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgbmV3IEdlbmVyYWxFcnJvcihcbiAgICAgICAgICAgICAgICBSVU5USU1FX0VSUk9SUy51bmFibGVUb09wZW5Ccm93c2VyLFxuICAgICAgICAgICAgICAgIHRoaXMuYnJvd3NlckluZm8ucHJvdmlkZXJOYW1lICsgJzonICsgdGhpcy5icm93c2VySW5mby5icm93c2VyTmFtZSxcbiAgICAgICAgICAgICAgICBlcnIuc3RhY2tcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfY2xvc2VCcm93c2VyICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlkbGUpXG4gICAgICAgICAgICBhd2FpdCBwcm9taXNpZnlFdmVudCh0aGlzLCAnaWRsZScpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnByb3ZpZGVyLmNsb3NlQnJvd3Nlcih0aGlzLmlkKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAvLyBOT1RFOiBBIHdhcm5pbmcgd291bGQgYmUgcmVhbGx5IG5pY2UgaGVyZSwgYnV0IGl0IGNhbid0IGJlIGRvbmUgd2hpbGUgbG9nIGlzIHN0b3JlZCBpbiBhIHRhc2suXG4gICAgICAgICAgICB0aGlzLmRlYnVnTG9nZ2VyKGVycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9mb3JjZUlkbGUgKCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuaWRsZSkge1xuICAgICAgICAgICAgdGhpcy5pZGxlID0gdHJ1ZTtcblxuICAgICAgICAgICAgdGhpcy5lbWl0KCdpZGxlJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVCcm93c2VyRGlzY29ubmVjdGVkRXJyb3IgKCk6IEdlbmVyYWxFcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgR2VuZXJhbEVycm9yKFJVTlRJTUVfRVJST1JTLmJyb3dzZXJEaXNjb25uZWN0ZWQsIHRoaXMudXNlckFnZW50KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF93YWl0Rm9ySGVhcnRiZWF0ICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5oZWFydGJlYXRUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSB0aGlzLl9jcmVhdGVCcm93c2VyRGlzY29ubmVjdGVkRXJyb3IoKTtcblxuICAgICAgICAgICAgdGhpcy5zdGF0dXMgICAgICAgICA9IEJyb3dzZXJDb25uZWN0aW9uU3RhdHVzLmRpc2Nvbm5lY3RlZDtcbiAgICAgICAgICAgIHRoaXMudGVzdFJ1bkFib3J0ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2Rpc2Nvbm5lY3RlZCcsIGVycik7XG5cbiAgICAgICAgICAgIHRoaXMuX3Jlc3RhcnRCcm93c2VyT25EaXNjb25uZWN0KGVycik7XG4gICAgICAgIH0sIHRoaXMuSEVBUlRCRUFUX1RJTUVPVVQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2dldFRlc3RSdW5VcmwgKG5lZWRQb3BOZXh0OiBib29sZWFuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgaWYgKG5lZWRQb3BOZXh0IHx8ICF0aGlzLnBlbmRpbmdUZXN0UnVuVXJsKVxuICAgICAgICAgICAgdGhpcy5wZW5kaW5nVGVzdFJ1blVybCA9IGF3YWl0IHRoaXMuX3BvcE5leHRUZXN0UnVuVXJsKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucGVuZGluZ1Rlc3RSdW5VcmwgYXMgc3RyaW5nO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3BvcE5leHRUZXN0UnVuVXJsICgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICAgICAgd2hpbGUgKHRoaXMuaGFzUXVldWVkSm9icyAmJiAhdGhpcy5jdXJyZW50Sm9iLmhhc1F1ZXVlZFRlc3RSdW5zKVxuICAgICAgICAgICAgdGhpcy5qb2JRdWV1ZS5zaGlmdCgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmhhc1F1ZXVlZEpvYnMgPyBhd2FpdCB0aGlzLmN1cnJlbnRKb2IucG9wTmV4dFRlc3RSdW5VcmwodGhpcykgOiBudWxsO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0QnlJZCAoaWQ6IHN0cmluZyk6IEJyb3dzZXJDb25uZWN0aW9uIHwgbnVsbCB7XG4gICAgICAgIHJldHVybiBjb25uZWN0aW9uc1tpZF0gfHwgbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9yZXN0YXJ0QnJvd3NlciAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRoaXMuc3RhdHVzID0gQnJvd3NlckNvbm5lY3Rpb25TdGF0dXMudW5pbml0aWFsaXplZDtcblxuICAgICAgICB0aGlzLl9mb3JjZUlkbGUoKTtcblxuICAgICAgICBsZXQgcmVzb2x2ZVRpbWVvdXQ6IEZ1bmN0aW9uIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGxldCBpc1RpbWVvdXRFeHBpcmVkICAgICAgICAgICAgICAgID0gZmFsc2U7XG4gICAgICAgIGxldCB0aW1lb3V0OiBOb2RlSlMuVGltZW91dCB8IG51bGwgID0gbnVsbDtcblxuICAgICAgICBjb25zdCByZXN0YXJ0UHJvbWlzZSA9IHRpbWVMaW1pdCh0aGlzLl9jbG9zZUJyb3dzZXIoKSwgdGhpcy5CUk9XU0VSX0NMT1NFX1RJTUVPVVQsIHsgcmVqZWN0V2l0aDogbmV3IFRpbWVvdXRFcnJvcigpIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHRoaXMuZGVidWdMb2dnZXIoZXJyKSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuX3J1bkJyb3dzZXIoKSk7XG5cbiAgICAgICAgY29uc3QgdGltZW91dFByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHJlc29sdmVUaW1lb3V0ID0gcmVzb2x2ZTtcblxuICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlzVGltZW91dEV4cGlyZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSwgdGhpcy5CUk9XU0VSX1JFU1RBUlRfVElNRU9VVCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJhY2UoWyByZXN0YXJ0UHJvbWlzZSwgdGltZW91dFByb21pc2UgXSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCBhcyBOb2RlSlMuVGltZW91dCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNUaW1lb3V0RXhwaXJlZClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdlcnJvcicsIHRoaXMuX2NyZWF0ZUJyb3dzZXJEaXNjb25uZWN0ZWRFcnJvcigpKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIChyZXNvbHZlVGltZW91dCBhcyBGdW5jdGlvbikoKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3Jlc3RhcnRCcm93c2VyT25EaXNjb25uZWN0IChlcnI6IEVycm9yKTogdm9pZCB7XG4gICAgICAgIGxldCByZXNvbHZlRm46IEZ1bmN0aW9uIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGxldCByZWplY3RGbjogRnVuY3Rpb24gfCBudWxsICA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5kaXNjb25uZWN0aW9uUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmVGbiA9IHJlc29sdmU7XG5cbiAgICAgICAgICAgIHJlamVjdEZuID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgKHJlamVjdEZuIGFzIEZ1bmN0aW9uKSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Jlc3RhcnRCcm93c2VyKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlKTtcbiAgICAgICAgICAgIH0pIGFzIERpc2Nvbm5lY3Rpb25Qcm9taXNlPHZvaWQ+O1xuXG4gICAgICAgIHRoaXMuZGlzY29ubmVjdGlvblByb21pc2UucmVzb2x2ZSA9IHJlc29sdmVGbiBhcyB1bmtub3duIGFzIEZ1bmN0aW9uO1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3Rpb25Qcm9taXNlLnJlamVjdCAgPSByZWplY3RGbiBhcyB1bmtub3duIGFzIEZ1bmN0aW9uO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBnZXREZWZhdWx0QnJvd3NlckluaXRUaW1lb3V0ICgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICBjb25zdCBpc0xvY2FsQnJvd3NlciA9IGF3YWl0IHRoaXMucHJvdmlkZXIuaXNMb2NhbEJyb3dzZXIodGhpcy5pZCwgdGhpcy5icm93c2VySW5mby5icm93c2VyTmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIGlzTG9jYWxCcm93c2VyID8gTE9DQUxfQlJPV1NFUl9JTklUX1RJTUVPVVQgOiBSRU1PVEVfQlJPV1NFUl9JTklUX1RJTUVPVVQ7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHByb2Nlc3NEaXNjb25uZWN0aW9uIChkaXNjb25uZWN0aW9uVGhyZXNob2xkRXhjZWVkZWQ6IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgeyByZXNvbHZlLCByZWplY3QgfSA9IHRoaXMuZGlzY29ubmVjdGlvblByb21pc2UgYXMgRGlzY29ubmVjdGlvblByb21pc2U8dm9pZD47XG5cbiAgICAgICAgaWYgKGRpc2Nvbm5lY3Rpb25UaHJlc2hvbGRFeGNlZWRlZClcbiAgICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFkZFdhcm5pbmcgKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRKb2IpXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRKb2Iud2FybmluZ0xvZy5hZGRXYXJuaW5nKC4uLmFyZ3MpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLndhcm5pbmdMb2cuYWRkV2FybmluZyguLi5hcmdzKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9hcHBlbmRUb1ByZXR0eVVzZXJBZ2VudCAoc3RyOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5icm93c2VySW5mby5wYXJzZWRVc2VyQWdlbnQucHJldHR5VXNlckFnZW50ICs9IGAgKCR7c3RyfSlgO1xuICAgIH1cblxuICAgIHByaXZhdGUgX21vdmVXYXJuaW5nTG9nVG9Kb2IgKGpvYjogQnJvd3NlckpvYik6IHZvaWQge1xuICAgICAgICB0aGlzLndhcm5pbmdMb2cuY29weVRvKGpvYi53YXJuaW5nTG9nKTtcbiAgICAgICAgdGhpcy53YXJuaW5nTG9nLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHNldFByb3ZpZGVyTWV0YUluZm8gKHN0cjogc3RyaW5nLCBvcHRpb25zPzogUHJvdmlkZXJNZXRhSW5mb09wdGlvbnMpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYXBwZW5kVG9Vc2VyQWdlbnQgPSBvcHRpb25zPy5hcHBlbmRUb1VzZXJBZ2VudCBhcyBib29sZWFuO1xuXG4gICAgICAgIGlmIChhcHBlbmRUb1VzZXJBZ2VudCkge1xuICAgICAgICAgICAgLy8gTk9URTpcbiAgICAgICAgICAgIC8vIGNoYW5nZSBwcmV0dHlVc2VyQWdlbnQgb25seSB3aGVuIGNvbm5lY3Rpb24gYWxyZWFkeSB3YXMgZXN0YWJsaXNoZWRcbiAgICAgICAgICAgIGlmICh0aGlzLmlzUmVhZHkoKSlcbiAgICAgICAgICAgICAgICB0aGlzLl9hcHBlbmRUb1ByZXR0eVVzZXJBZ2VudChzdHIpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRoaXMub24oJ3JlYWR5JywgKCkgPT4gdGhpcy5fYXBwZW5kVG9QcmV0dHlVc2VyQWdlbnQoc3RyKSk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYnJvd3NlckluZm8udXNlckFnZW50UHJvdmlkZXJNZXRhSW5mbyA9IHN0cjtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IHVzZXJBZ2VudCAoKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IHVzZXJBZ2VudCA9IHRoaXMuYnJvd3NlckluZm8ucGFyc2VkVXNlckFnZW50LnByZXR0eVVzZXJBZ2VudDtcblxuICAgICAgICBpZiAodGhpcy5icm93c2VySW5mby51c2VyQWdlbnRQcm92aWRlck1ldGFJbmZvKVxuICAgICAgICAgICAgdXNlckFnZW50ICs9IGAgKCR7dGhpcy5icm93c2VySW5mby51c2VyQWdlbnRQcm92aWRlck1ldGFJbmZvfSlgO1xuXG4gICAgICAgIHJldHVybiB1c2VyQWdlbnQ7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCByZXRyeVRlc3RQYWdlcyAoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheS5yZXRyeVRlc3RQYWdlcztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGhhc1F1ZXVlZEpvYnMgKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gISF0aGlzLmpvYlF1ZXVlLmxlbmd0aDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGN1cnJlbnRKb2IgKCk6IEJyb3dzZXJKb2Ige1xuICAgICAgICByZXR1cm4gdGhpcy5qb2JRdWV1ZVswXTtcbiAgICB9XG5cbiAgICAvLyBBUElcbiAgICBwdWJsaWMgcnVuSW5pdFNjcmlwdCAoY29kZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCB1bmtub3duPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHRoaXMuaW5pdFNjcmlwdHNRdWV1ZS5wdXNoKHsgY29kZSwgcmVzb2x2ZSB9KSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFkZEpvYiAoam9iOiBCcm93c2VySm9iKTogdm9pZCB7XG4gICAgICAgIHRoaXMuam9iUXVldWUucHVzaChqb2IpO1xuXG4gICAgICAgIHRoaXMuX21vdmVXYXJuaW5nTG9nVG9Kb2Ioam9iKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVtb3ZlSm9iIChqb2I6IEJyb3dzZXJKb2IpOiB2b2lkIHtcbiAgICAgICAgcmVtb3ZlKHRoaXMuam9iUXVldWUsIGpvYik7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNsb3NlICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzID09PSBCcm93c2VyQ29ubmVjdGlvblN0YXR1cy5jbG9zaW5nIHx8IHRoaXMuc3RhdHVzID09PSBCcm93c2VyQ29ubmVjdGlvblN0YXR1cy5jbG9zZWQpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdGhpcy5zdGF0dXMgPSBCcm93c2VyQ29ubmVjdGlvblN0YXR1cy5jbG9zaW5nO1xuICAgICAgICB0aGlzLmVtaXQoQnJvd3NlckNvbm5lY3Rpb25TdGF0dXMuY2xvc2luZyk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fY2xvc2VCcm93c2VyKCk7XG5cbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbkdhdGV3YXkuc3RvcFNlcnZpbmdDb25uZWN0aW9uKHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLmhlYXJ0YmVhdFRpbWVvdXQpXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5oZWFydGJlYXRUaW1lb3V0KTtcblxuICAgICAgICBkZWxldGUgY29ubmVjdGlvbnNbdGhpcy5pZF07XG5cbiAgICAgICAgdGhpcy5zdGF0dXMgPSBCcm93c2VyQ29ubmVjdGlvblN0YXR1cy5jbG9zZWQ7XG4gICAgICAgIHRoaXMuZW1pdChCcm93c2VyQ29ubmVjdGlvblN0YXR1cy5jbG9zZWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBlc3RhYmxpc2ggKHVzZXJBZ2VudDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMuc3RhdHVzICAgICAgICAgICAgICAgICAgICAgID0gQnJvd3NlckNvbm5lY3Rpb25TdGF0dXMucmVhZHk7XG4gICAgICAgIHRoaXMuYnJvd3NlckluZm8ucGFyc2VkVXNlckFnZW50ID0gcGFyc2VVc2VyQWdlbnQodXNlckFnZW50KTtcblxuICAgICAgICB0aGlzLl93YWl0Rm9ySGVhcnRiZWF0KCk7XG4gICAgICAgIHRoaXMuZW1pdCgncmVhZHknKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaGVhcnRiZWF0ICgpOiBIZWFydGJlYXRTdGF0dXNSZXN1bHQge1xuICAgICAgICBpZiAodGhpcy5oZWFydGJlYXRUaW1lb3V0KVxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaGVhcnRiZWF0VGltZW91dCk7XG5cbiAgICAgICAgdGhpcy5fd2FpdEZvckhlYXJ0YmVhdCgpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb2RlOiB0aGlzLnN0YXR1cyA9PT0gQnJvd3NlckNvbm5lY3Rpb25TdGF0dXMuY2xvc2luZyA/IEhlYXJ0YmVhdFN0YXR1cy5jbG9zaW5nIDogSGVhcnRiZWF0U3RhdHVzLm9rLFxuICAgICAgICAgICAgdXJsOiAgdGhpcy5zdGF0dXMgPT09IEJyb3dzZXJDb25uZWN0aW9uU3RhdHVzLmNsb3NpbmcgPyB0aGlzLmlkbGVVcmwgOiAnJ1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXJJZGxlUGFnZSAoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIE11c3RhY2hlLnJlbmRlcihJRExFX1BBR0VfVEVNUExBVEUgYXMgc3RyaW5nLCB7XG4gICAgICAgICAgICB1c2VyQWdlbnQ6ICAgICAgdGhpcy51c2VyQWdlbnQsXG4gICAgICAgICAgICBzdGF0dXNVcmw6ICAgICAgdGhpcy5zdGF0dXNVcmwsXG4gICAgICAgICAgICBoZWFydGJlYXRVcmw6ICAgdGhpcy5oZWFydGJlYXRVcmwsXG4gICAgICAgICAgICBpbml0U2NyaXB0VXJsOiAgdGhpcy5pbml0U2NyaXB0VXJsLFxuICAgICAgICAgICAgcmV0cnlUZXN0UGFnZXM6ICEhdGhpcy5icm93c2VyQ29ubmVjdGlvbkdhdGV3YXkucmV0cnlUZXN0UGFnZXNcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEluaXRTY3JpcHQgKCk6IEluaXRTY3JpcHQge1xuICAgICAgICBjb25zdCBpbml0U2NyaXB0UHJvbWlzZSA9IHRoaXMuaW5pdFNjcmlwdHNRdWV1ZVswXTtcblxuICAgICAgICByZXR1cm4geyBjb2RlOiBpbml0U2NyaXB0UHJvbWlzZSA/IGluaXRTY3JpcHRQcm9taXNlLmNvZGUgOiBudWxsIH07XG4gICAgfVxuXG4gICAgcHVibGljIGhhbmRsZUluaXRTY3JpcHRSZXN1bHQgKGRhdGE6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBpbml0U2NyaXB0UHJvbWlzZSA9IHRoaXMuaW5pdFNjcmlwdHNRdWV1ZS5zaGlmdCgpO1xuXG4gICAgICAgIGlmIChpbml0U2NyaXB0UHJvbWlzZSlcbiAgICAgICAgICAgIGluaXRTY3JpcHRQcm9taXNlLnJlc29sdmUoSlNPTi5wYXJzZShkYXRhKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGlzSGVhZGxlc3NCcm93c2VyICgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvdmlkZXIuaXNIZWFkbGVzc0Jyb3dzZXIodGhpcy5pZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHJlcG9ydEpvYlJlc3VsdCAoc3RhdHVzOiBzdHJpbmcsIGRhdGE6IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGF3YWl0IHRoaXMucHJvdmlkZXIucmVwb3J0Sm9iUmVzdWx0KHRoaXMuaWQsIHN0YXR1cywgZGF0YSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGdldFN0YXR1cyAoaXNUZXN0RG9uZTogYm9vbGVhbik6IFByb21pc2U8QnJvd3NlckNvbm5lY3Rpb25TdGF0dXNSZXN1bHQ+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlkbGUgJiYgIWlzVGVzdERvbmUpIHtcbiAgICAgICAgICAgIHRoaXMuaWRsZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2lkbGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gQnJvd3NlckNvbm5lY3Rpb25TdGF0dXMub3BlbmVkKSB7XG4gICAgICAgICAgICBjb25zdCB0ZXN0UnVuVXJsID0gYXdhaXQgdGhpcy5fZ2V0VGVzdFJ1blVybChpc1Rlc3REb25lIHx8IHRoaXMudGVzdFJ1bkFib3J0ZWQpO1xuXG4gICAgICAgICAgICB0aGlzLnRlc3RSdW5BYm9ydGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmICh0ZXN0UnVuVXJsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pZGxlID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4geyBjbWQ6IENPTU1BTkQucnVuLCB1cmw6IHRlc3RSdW5VcmwgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IGNtZDogQ09NTUFORC5pZGxlLCB1cmw6IHRoaXMuaWRsZVVybCB9O1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgYWN0aXZlV2luZG93SWQgKCk6IG51bGwgfCBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm92aWRlci5nZXRBY3RpdmVXaW5kb3dJZCh0aGlzLmlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGFjdGl2ZVdpbmRvd0lkICh2YWwpIHtcbiAgICAgICAgdGhpcy5wcmV2aW91c0FjdGl2ZVdpbmRvd0lkID0gdGhpcy5hY3RpdmVXaW5kb3dJZDtcblxuICAgICAgICB0aGlzLnByb3ZpZGVyLnNldEFjdGl2ZVdpbmRvd0lkKHRoaXMuaWQsIHZhbCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNhblVzZURlZmF1bHRXaW5kb3dBY3Rpb25zICgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvdmlkZXIuY2FuVXNlRGVmYXVsdFdpbmRvd0FjdGlvbnModGhpcy5pZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGlzUmVhZHkgKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0dXMgPT09IEJyb3dzZXJDb25uZWN0aW9uU3RhdHVzLnJlYWR5IHx8XG4gICAgICAgICAgICB0aGlzLnN0YXR1cyA9PT0gQnJvd3NlckNvbm5lY3Rpb25TdGF0dXMub3BlbmVkIHx8XG4gICAgICAgICAgICB0aGlzLnN0YXR1cyA9PT0gQnJvd3NlckNvbm5lY3Rpb25TdGF0dXMuY2xvc2luZztcbiAgICB9XG59XG4iXX0=
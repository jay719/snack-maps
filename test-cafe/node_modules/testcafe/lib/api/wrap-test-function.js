"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_controller_1 = __importDefault(require("./test-controller"));
const test_run_tracker_1 = __importDefault(require("./test-run-tracker"));
const error_list_1 = __importDefault(require("../errors/error-list"));
const test_run_1 = require("../errors/test-run");
const add_rendered_warning_1 = __importDefault(require("../notifications/add-rendered-warning"));
const warning_message_1 = __importDefault(require("../notifications/warning-message"));
function wrapTestFunction(fn) {
    return async (testRun) => {
        let result = null;
        const errList = new error_list_1.default();
        const markeredfn = test_run_tracker_1.default.addTrackingMarkerToFunction(testRun.id, fn);
        function addWarnings(callsiteSet, message) {
            callsiteSet.forEach(callsite => {
                add_rendered_warning_1.default(testRun.warningLog, message, callsite);
                callsiteSet.delete(callsite);
            });
        }
        function addErrors(callsiteSet, ErrorClass) {
            callsiteSet.forEach(callsite => {
                errList.addError(new ErrorClass(callsite));
                callsiteSet.delete(callsite);
            });
        }
        testRun.controller = new test_controller_1.default(testRun);
        testRun.observedCallsites.clear();
        test_run_tracker_1.default.ensureEnabled();
        try {
            result = await markeredfn(testRun.controller);
        }
        catch (err) {
            errList.addError(err);
        }
        if (!errList.hasUncaughtErrorsInTestCode) {
            for (const callsite of testRun.observedCallsites.awaitedSnapshotWarnings.values())
                add_rendered_warning_1.default(testRun.warningLog, warning_message_1.default.excessiveAwaitInAssertion, callsite);
            addWarnings(testRun.observedCallsites.unawaitedSnapshotCallsites, warning_message_1.default.missingAwaitOnSnapshotProperty);
            addErrors(testRun.observedCallsites.callsitesWithoutAwait, test_run_1.MissingAwaitError);
        }
        if (errList.hasErrors)
            throw errList;
        return result;
    };
}
exports.default = wrapTestFunction;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3JhcC10ZXN0LWZ1bmN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2FwaS93cmFwLXRlc3QtZnVuY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSx3RUFBK0M7QUFDL0MsMEVBQWdEO0FBRWhELHNFQUFxRDtBQUNyRCxpREFBdUQ7QUFDdkQsaUdBQXVFO0FBQ3ZFLHVGQUFnRTtBQUVoRSxTQUF3QixnQkFBZ0IsQ0FBRSxFQUFZO0lBQ2xELE9BQU8sS0FBSyxFQUFFLE9BQWdCLEVBQUUsRUFBRTtRQUM5QixJQUFJLE1BQU0sR0FBUyxJQUFJLENBQUM7UUFDeEIsTUFBTSxPQUFPLEdBQU0sSUFBSSxvQkFBaUIsRUFBRSxDQUFDO1FBQzNDLE1BQU0sVUFBVSxHQUFHLDBCQUFjLENBQUMsMkJBQTJCLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUU5RSxTQUFTLFdBQVcsQ0FBRSxXQUFxQyxFQUFFLE9BQWU7WUFDeEUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDM0IsOEJBQWtCLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzFELFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBRUQsU0FBUyxTQUFTLENBQUUsV0FBcUMsRUFBRSxVQUFlO1lBQ3RFLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzNCLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDM0MsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqQyxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFFRCxPQUFPLENBQUMsVUFBVSxHQUFHLElBQUkseUJBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVqRCxPQUFPLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFbEMsMEJBQWMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUUvQixJQUFJO1lBQ0EsTUFBTSxHQUFHLE1BQU0sVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUNqRDtRQUNELE9BQU8sR0FBRyxFQUFFO1lBQ1IsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUN6QjtRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsMkJBQTJCLEVBQUU7WUFDdEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxPQUFPLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLENBQUMsTUFBTSxFQUFFO2dCQUM3RSw4QkFBa0IsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLHlCQUFnQixDQUFDLHlCQUF5QixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRWpHLFdBQVcsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsMEJBQTBCLEVBQUUseUJBQWdCLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUNuSCxTQUFTLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixFQUFFLDRCQUFpQixDQUFDLENBQUM7U0FDakY7UUFFRCxJQUFJLE9BQU8sQ0FBQyxTQUFTO1lBQ2pCLE1BQU0sT0FBTyxDQUFDO1FBRWxCLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUMsQ0FBQztBQUNOLENBQUM7QUE5Q0QsbUNBOENDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFRlc3RDb250cm9sbGVyIGZyb20gJy4vdGVzdC1jb250cm9sbGVyJztcbmltcG9ydCB0ZXN0UnVuVHJhY2tlciBmcm9tICcuL3Rlc3QtcnVuLXRyYWNrZXInO1xuaW1wb3J0IHsgVGVzdFJ1biB9IGZyb20gJy4vdGVzdC1ydW4tdHJhY2tlci5kJztcbmltcG9ydCBUZXN0Q2FmZUVycm9yTGlzdCBmcm9tICcuLi9lcnJvcnMvZXJyb3ItbGlzdCc7XG5pbXBvcnQgeyBNaXNzaW5nQXdhaXRFcnJvciB9IGZyb20gJy4uL2Vycm9ycy90ZXN0LXJ1bic7XG5pbXBvcnQgYWRkUmVuZGVyZWRXYXJuaW5nIGZyb20gJy4uL25vdGlmaWNhdGlvbnMvYWRkLXJlbmRlcmVkLXdhcm5pbmcnO1xuaW1wb3J0IFdBUk5JTkdfTUVTU0FHRVMgZnJvbSAnLi4vbm90aWZpY2F0aW9ucy93YXJuaW5nLW1lc3NhZ2UnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB3cmFwVGVzdEZ1bmN0aW9uIChmbjogRnVuY3Rpb24pOiBGdW5jdGlvbiB7XG4gICAgcmV0dXJuIGFzeW5jICh0ZXN0UnVuOiBUZXN0UnVuKSA9PiB7XG4gICAgICAgIGxldCByZXN1bHQgICAgICAgPSBudWxsO1xuICAgICAgICBjb25zdCBlcnJMaXN0ICAgID0gbmV3IFRlc3RDYWZlRXJyb3JMaXN0KCk7XG4gICAgICAgIGNvbnN0IG1hcmtlcmVkZm4gPSB0ZXN0UnVuVHJhY2tlci5hZGRUcmFja2luZ01hcmtlclRvRnVuY3Rpb24odGVzdFJ1bi5pZCwgZm4pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGFkZFdhcm5pbmdzIChjYWxsc2l0ZVNldDogU2V0PFJlY29yZDxzdHJpbmcsIGFueT4+LCBtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgICAgIGNhbGxzaXRlU2V0LmZvckVhY2goY2FsbHNpdGUgPT4ge1xuICAgICAgICAgICAgICAgIGFkZFJlbmRlcmVkV2FybmluZyh0ZXN0UnVuLndhcm5pbmdMb2csIG1lc3NhZ2UsIGNhbGxzaXRlKTtcbiAgICAgICAgICAgICAgICBjYWxsc2l0ZVNldC5kZWxldGUoY2FsbHNpdGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZGRFcnJvcnMgKGNhbGxzaXRlU2V0OiBTZXQ8UmVjb3JkPHN0cmluZywgYW55Pj4sIEVycm9yQ2xhc3M6IGFueSk6IHZvaWQge1xuICAgICAgICAgICAgY2FsbHNpdGVTZXQuZm9yRWFjaChjYWxsc2l0ZSA9PiB7XG4gICAgICAgICAgICAgICAgZXJyTGlzdC5hZGRFcnJvcihuZXcgRXJyb3JDbGFzcyhjYWxsc2l0ZSkpO1xuICAgICAgICAgICAgICAgIGNhbGxzaXRlU2V0LmRlbGV0ZShjYWxsc2l0ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRlc3RSdW4uY29udHJvbGxlciA9IG5ldyBUZXN0Q29udHJvbGxlcih0ZXN0UnVuKTtcblxuICAgICAgICB0ZXN0UnVuLm9ic2VydmVkQ2FsbHNpdGVzLmNsZWFyKCk7XG5cbiAgICAgICAgdGVzdFJ1blRyYWNrZXIuZW5zdXJlRW5hYmxlZCgpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHQgPSBhd2FpdCBtYXJrZXJlZGZuKHRlc3RSdW4uY29udHJvbGxlcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZXJyTGlzdC5hZGRFcnJvcihlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFlcnJMaXN0Lmhhc1VuY2F1Z2h0RXJyb3JzSW5UZXN0Q29kZSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjYWxsc2l0ZSBvZiB0ZXN0UnVuLm9ic2VydmVkQ2FsbHNpdGVzLmF3YWl0ZWRTbmFwc2hvdFdhcm5pbmdzLnZhbHVlcygpKVxuICAgICAgICAgICAgICAgIGFkZFJlbmRlcmVkV2FybmluZyh0ZXN0UnVuLndhcm5pbmdMb2csIFdBUk5JTkdfTUVTU0FHRVMuZXhjZXNzaXZlQXdhaXRJbkFzc2VydGlvbiwgY2FsbHNpdGUpO1xuXG4gICAgICAgICAgICBhZGRXYXJuaW5ncyh0ZXN0UnVuLm9ic2VydmVkQ2FsbHNpdGVzLnVuYXdhaXRlZFNuYXBzaG90Q2FsbHNpdGVzLCBXQVJOSU5HX01FU1NBR0VTLm1pc3NpbmdBd2FpdE9uU25hcHNob3RQcm9wZXJ0eSk7XG4gICAgICAgICAgICBhZGRFcnJvcnModGVzdFJ1bi5vYnNlcnZlZENhbGxzaXRlcy5jYWxsc2l0ZXNXaXRob3V0QXdhaXQsIE1pc3NpbmdBd2FpdEVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlcnJMaXN0Lmhhc0Vycm9ycylcbiAgICAgICAgICAgIHRocm93IGVyckxpc3Q7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xufVxuIl19
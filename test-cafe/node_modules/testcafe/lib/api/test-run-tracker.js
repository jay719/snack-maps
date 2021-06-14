"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const callsite_1 = __importDefault(require("callsite"));
const TRACKING_MARK_RE = /^\$\$testcafe_test_run\$\$(\S+)\$\$$/;
const STACK_CAPACITY = 5000;
// Tracker
exports.default = {
    enabled: false,
    activeTestRuns: {},
    _createContextSwitchingFunctionHook(ctxSwitchingFn, patchedArgsCount) {
        const tracker = this;
        return function () {
            const testRunId = tracker.getContextTestRunId();
            if (testRunId) {
                for (let i = 0; i < patchedArgsCount; i++) {
                    if (typeof arguments[i] === 'function')
                        arguments[i] = tracker.addTrackingMarkerToFunction(testRunId, arguments[i]);
                }
            }
            return ctxSwitchingFn.apply(this, arguments);
        };
    },
    _getStackFrames() {
        // NOTE: increase stack capacity to seek deep stack entries
        const savedLimit = Error.stackTraceLimit;
        Error.stackTraceLimit = STACK_CAPACITY;
        const frames = callsite_1.default();
        Error.stackTraceLimit = savedLimit;
        return frames;
    },
    ensureEnabled() {
        if (!this.enabled) {
            global.setTimeout = this._createContextSwitchingFunctionHook(global.setTimeout, 1);
            global.setInterval = this._createContextSwitchingFunctionHook(global.setInterval, 1);
            global.setImmediate = this._createContextSwitchingFunctionHook(global.setImmediate, 1);
            process.nextTick = this._createContextSwitchingFunctionHook(process.nextTick, 1);
            global.Promise.prototype.then = this._createContextSwitchingFunctionHook(global.Promise.prototype.then, 2);
            global.Promise.prototype.catch = this._createContextSwitchingFunctionHook(global.Promise.prototype.catch, 1);
            this.enabled = true;
        }
    },
    addTrackingMarkerToFunction(testRunId, fn) {
        const markerFactoryBody = `
            return function $$testcafe_test_run$$${testRunId}$$ () {
                switch (arguments.length) {
                    case 0: return fn.call(this);
                    case 1: return fn.call(this, arguments[0]);
                    case 2: return fn.call(this, arguments[0], arguments[1]);
                    case 3: return fn.call(this, arguments[0], arguments[1], arguments[2]);
                    case 4: return fn.call(this, arguments[0], arguments[1], arguments[2], arguments[3]);
                    default: return fn.apply(this, arguments);
                }
            };
        `;
        return new Function('fn', markerFactoryBody)(fn);
    },
    getContextTestRunId() {
        const frames = this._getStackFrames();
        // OPTIMIZATION: we start traversing from the bottom of the stack,
        // because we'll more likely encounter a marker there.
        // Async/await and Promise machinery executes lots of intrinsics
        // on timers (where we have a marker). And, since a timer initiates a new
        // stack, the marker will be at the very bottom of it.
        for (let i = frames.length - 1; i >= 0; i--) {
            const fnName = frames[i].getFunctionName();
            const match = fnName && fnName.match(TRACKING_MARK_RE);
            if (match)
                return match[1];
        }
        return null;
    },
    resolveContextTestRun() {
        const testRunId = this.getContextTestRunId();
        return this.activeTestRuns[testRunId];
    }
};
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1ydW4tdHJhY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hcGkvdGVzdC1ydW4tdHJhY2tlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHdEQUFzQztBQUV0QyxNQUFNLGdCQUFnQixHQUFHLHNDQUFzQyxDQUFDO0FBQ2hFLE1BQU0sY0FBYyxHQUFLLElBQUksQ0FBQztBQUU5QixVQUFVO0FBQ1Ysa0JBQWU7SUFDWCxPQUFPLEVBQUUsS0FBSztJQUVkLGNBQWMsRUFBRSxFQUFFO0lBRWxCLG1DQUFtQyxDQUFFLGNBQWMsRUFBRSxnQkFBZ0I7UUFDakUsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBRXJCLE9BQU87WUFDSCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUVoRCxJQUFJLFNBQVMsRUFBRTtnQkFDWCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3ZDLElBQUksT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssVUFBVTt3QkFDbEMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ25GO2FBQ0o7WUFFRCxPQUFPLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQztJQUNOLENBQUM7SUFFRCxlQUFlO1FBQ1gsMkRBQTJEO1FBQzNELE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7UUFFekMsS0FBSyxDQUFDLGVBQWUsR0FBRyxjQUFjLENBQUM7UUFFdkMsTUFBTSxNQUFNLEdBQUcsa0JBQWMsRUFBRSxDQUFDO1FBRWhDLEtBQUssQ0FBQyxlQUFlLEdBQUcsVUFBVSxDQUFDO1FBRW5DLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxhQUFhO1FBQ1QsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDZixNQUFNLENBQUMsVUFBVSxHQUFLLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sQ0FBQyxXQUFXLEdBQUksSUFBSSxDQUFDLG1DQUFtQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsbUNBQW1DLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RixPQUFPLENBQUMsUUFBUSxHQUFNLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXBGLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksR0FBSSxJQUFJLENBQUMsbUNBQW1DLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVHLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsbUNBQW1DLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTdHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1NBQ3ZCO0lBQ0wsQ0FBQztJQUVELDJCQUEyQixDQUFFLFNBQVMsRUFBRSxFQUFFO1FBQ3RDLE1BQU0saUJBQWlCLEdBQUc7bURBQ2lCLFNBQVM7Ozs7Ozs7Ozs7U0FVbkQsQ0FBQztRQUVGLE9BQU8sSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELG1CQUFtQjtRQUNmLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUV0QyxrRUFBa0U7UUFDbEUsc0RBQXNEO1FBQ3RELGdFQUFnRTtRQUNoRSx5RUFBeUU7UUFDekUsc0RBQXNEO1FBQ3RELEtBQUssSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN6QyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDM0MsTUFBTSxLQUFLLEdBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUV4RCxJQUFJLEtBQUs7Z0JBQ0wsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdkI7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQscUJBQXFCO1FBQ2pCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBRTdDLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMxQyxDQUFDO0NBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBnZXRTdGFja0ZyYW1lcyBmcm9tICdjYWxsc2l0ZSc7XG5cbmNvbnN0IFRSQUNLSU5HX01BUktfUkUgPSAvXlxcJFxcJHRlc3RjYWZlX3Rlc3RfcnVuXFwkXFwkKFxcUyspXFwkXFwkJC87XG5jb25zdCBTVEFDS19DQVBBQ0lUWSAgID0gNTAwMDtcblxuLy8gVHJhY2tlclxuZXhwb3J0IGRlZmF1bHQge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuXG4gICAgYWN0aXZlVGVzdFJ1bnM6IHt9LFxuXG4gICAgX2NyZWF0ZUNvbnRleHRTd2l0Y2hpbmdGdW5jdGlvbkhvb2sgKGN0eFN3aXRjaGluZ0ZuLCBwYXRjaGVkQXJnc0NvdW50KSB7XG4gICAgICAgIGNvbnN0IHRyYWNrZXIgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zdCB0ZXN0UnVuSWQgPSB0cmFja2VyLmdldENvbnRleHRUZXN0UnVuSWQoKTtcblxuICAgICAgICAgICAgaWYgKHRlc3RSdW5JZCkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0Y2hlZEFyZ3NDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzW2ldID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzW2ldID0gdHJhY2tlci5hZGRUcmFja2luZ01hcmtlclRvRnVuY3Rpb24odGVzdFJ1bklkLCBhcmd1bWVudHNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGN0eFN3aXRjaGluZ0ZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIF9nZXRTdGFja0ZyYW1lcyAoKSB7XG4gICAgICAgIC8vIE5PVEU6IGluY3JlYXNlIHN0YWNrIGNhcGFjaXR5IHRvIHNlZWsgZGVlcCBzdGFjayBlbnRyaWVzXG4gICAgICAgIGNvbnN0IHNhdmVkTGltaXQgPSBFcnJvci5zdGFja1RyYWNlTGltaXQ7XG5cbiAgICAgICAgRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID0gU1RBQ0tfQ0FQQUNJVFk7XG5cbiAgICAgICAgY29uc3QgZnJhbWVzID0gZ2V0U3RhY2tGcmFtZXMoKTtcblxuICAgICAgICBFcnJvci5zdGFja1RyYWNlTGltaXQgPSBzYXZlZExpbWl0O1xuXG4gICAgICAgIHJldHVybiBmcmFtZXM7XG4gICAgfSxcblxuICAgIGVuc3VyZUVuYWJsZWQgKCkge1xuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICAgICAgZ2xvYmFsLnNldFRpbWVvdXQgICA9IHRoaXMuX2NyZWF0ZUNvbnRleHRTd2l0Y2hpbmdGdW5jdGlvbkhvb2soZ2xvYmFsLnNldFRpbWVvdXQsIDEpO1xuICAgICAgICAgICAgZ2xvYmFsLnNldEludGVydmFsICA9IHRoaXMuX2NyZWF0ZUNvbnRleHRTd2l0Y2hpbmdGdW5jdGlvbkhvb2soZ2xvYmFsLnNldEludGVydmFsLCAxKTtcbiAgICAgICAgICAgIGdsb2JhbC5zZXRJbW1lZGlhdGUgPSB0aGlzLl9jcmVhdGVDb250ZXh0U3dpdGNoaW5nRnVuY3Rpb25Ib29rKGdsb2JhbC5zZXRJbW1lZGlhdGUsIDEpO1xuICAgICAgICAgICAgcHJvY2Vzcy5uZXh0VGljayAgICA9IHRoaXMuX2NyZWF0ZUNvbnRleHRTd2l0Y2hpbmdGdW5jdGlvbkhvb2socHJvY2Vzcy5uZXh0VGljaywgMSk7XG5cbiAgICAgICAgICAgIGdsb2JhbC5Qcm9taXNlLnByb3RvdHlwZS50aGVuICA9IHRoaXMuX2NyZWF0ZUNvbnRleHRTd2l0Y2hpbmdGdW5jdGlvbkhvb2soZ2xvYmFsLlByb21pc2UucHJvdG90eXBlLnRoZW4sIDIpO1xuICAgICAgICAgICAgZ2xvYmFsLlByb21pc2UucHJvdG90eXBlLmNhdGNoID0gdGhpcy5fY3JlYXRlQ29udGV4dFN3aXRjaGluZ0Z1bmN0aW9uSG9vayhnbG9iYWwuUHJvbWlzZS5wcm90b3R5cGUuY2F0Y2gsIDEpO1xuXG4gICAgICAgICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFkZFRyYWNraW5nTWFya2VyVG9GdW5jdGlvbiAodGVzdFJ1bklkLCBmbikge1xuICAgICAgICBjb25zdCBtYXJrZXJGYWN0b3J5Qm9keSA9IGBcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAkJHRlc3RjYWZlX3Rlc3RfcnVuJCQke3Rlc3RSdW5JZH0kJCAoKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMDogcmV0dXJuIGZuLmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGZuLmNhbGwodGhpcywgYXJndW1lbnRzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gZm4uY2FsbCh0aGlzLCBhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzogcmV0dXJuIGZuLmNhbGwodGhpcywgYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNDogcmV0dXJuIGZuLmNhbGwodGhpcywgYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSwgYXJndW1lbnRzWzNdKTtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgYDtcblxuICAgICAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKCdmbicsIG1hcmtlckZhY3RvcnlCb2R5KShmbik7XG4gICAgfSxcblxuICAgIGdldENvbnRleHRUZXN0UnVuSWQgKCkge1xuICAgICAgICBjb25zdCBmcmFtZXMgPSB0aGlzLl9nZXRTdGFja0ZyYW1lcygpO1xuXG4gICAgICAgIC8vIE9QVElNSVpBVElPTjogd2Ugc3RhcnQgdHJhdmVyc2luZyBmcm9tIHRoZSBib3R0b20gb2YgdGhlIHN0YWNrLFxuICAgICAgICAvLyBiZWNhdXNlIHdlJ2xsIG1vcmUgbGlrZWx5IGVuY291bnRlciBhIG1hcmtlciB0aGVyZS5cbiAgICAgICAgLy8gQXN5bmMvYXdhaXQgYW5kIFByb21pc2UgbWFjaGluZXJ5IGV4ZWN1dGVzIGxvdHMgb2YgaW50cmluc2ljc1xuICAgICAgICAvLyBvbiB0aW1lcnMgKHdoZXJlIHdlIGhhdmUgYSBtYXJrZXIpLiBBbmQsIHNpbmNlIGEgdGltZXIgaW5pdGlhdGVzIGEgbmV3XG4gICAgICAgIC8vIHN0YWNrLCB0aGUgbWFya2VyIHdpbGwgYmUgYXQgdGhlIHZlcnkgYm90dG9tIG9mIGl0LlxuICAgICAgICBmb3IgKGxldCBpID0gZnJhbWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBmbk5hbWUgPSBmcmFtZXNbaV0uZ2V0RnVuY3Rpb25OYW1lKCk7XG4gICAgICAgICAgICBjb25zdCBtYXRjaCAgPSBmbk5hbWUgJiYgZm5OYW1lLm1hdGNoKFRSQUNLSU5HX01BUktfUkUpO1xuXG4gICAgICAgICAgICBpZiAobWF0Y2gpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoWzFdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIHJlc29sdmVDb250ZXh0VGVzdFJ1biAoKSB7XG4gICAgICAgIGNvbnN0IHRlc3RSdW5JZCA9IHRoaXMuZ2V0Q29udGV4dFRlc3RSdW5JZCgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmFjdGl2ZVRlc3RSdW5zW3Rlc3RSdW5JZF07XG4gICAgfVxufTtcbiJdfQ==
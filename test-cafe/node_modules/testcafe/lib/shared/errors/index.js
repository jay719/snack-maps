"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UncaughtErrorInNativeDialogHandler = exports.NativeDialogNotHandledError = exports.CurrentIframeIsInvisibleError = exports.CurrentIframeNotFoundError = exports.CannotRestoreChildWindowError = exports.ChildWindowClosedBeforeSwitchingError = exports.PreviousWindowNotFoundError = exports.ParentWindowNotFoundError = exports.WindowNotFoundError = exports.SwitchToWindowPredicateError = exports.CannotCloseWindowWithoutParentError = exports.CannotCloseWindowWithChildrenError = exports.CloseChildWindowError = exports.CannotSwitchToWindowError = exports.ChildWindowIsNotLoadedError = exports.ChildWindowNotFoundError = exports.CurrentIframeIsNotLoadedError = exports.ActionIframeIsNotLoadedError = exports.ActionElementNotIframeError = exports.InvalidElementScreenshotDimensionsError = exports.ActionInvalidScrollTargetError = exports.ActionElementIsNotFileInputError = exports.ActionCannotFindFileToUploadError = exports.ActionIncorrectKeysError = exports.ActionRootContainerNotFoundError = exports.ActionElementNonContentEditableError = exports.ActionElementNotTextAreaError = exports.ActionElementNonEditableError = exports.ActionAdditionalSelectorMatchesWrongNodeTypeError = exports.ActionAdditionalElementIsInvisibleError = exports.ActionAdditionalElementNotFoundError = exports.ActionSelectorMatchesWrongNodeTypeError = exports.ActionElementIsInvisibleError = exports.ActionElementNotFoundError = exports.ActionSpeedOptionError = exports.ActionBooleanOptionError = exports.ActionPositiveIntegerOptionError = exports.ActionIntegerOptionError = exports.UncaughtErrorInCustomClientScriptLoadedFromModule = exports.UncaughtErrorInCustomClientScriptCode = exports.UncaughtErrorInCustomDOMPropertyCode = exports.UncaughtErrorInClientFunctionCode = exports.UncaughtErrorOnPage = exports.CannotObtainInfoForElementSpecifiedBySelectorError = exports.InvalidSelectorResultError = exports.DomNodeClientFunctionResultError = exports.ClientFunctionExecutionInterruptionError = exports.TestRunErrorBase = void 0;
// -------------------------------------------------------------
// WARNING: this file is used by both the client and the server.
// Do not use any browser or node-specific API!
// -------------------------------------------------------------
const types_1 = require("../../errors/types");
// Base
//--------------------------------------------------------------------
class TestRunErrorBase {
    constructor(code) {
        this.code = code;
        this.isTestCafeError = true;
        this.callsite = null;
    }
}
exports.TestRunErrorBase = TestRunErrorBase;
class ActionOptionErrorBase extends TestRunErrorBase {
    constructor(code, optionName, actualValue) {
        super(code);
        this.optionName = optionName;
        this.actualValue = actualValue;
    }
}
// Client function errors
//--------------------------------------------------------------------
class ClientFunctionExecutionInterruptionError extends TestRunErrorBase {
    constructor(instantiationCallsiteName) {
        super(types_1.TEST_RUN_ERRORS.clientFunctionExecutionInterruptionError);
        this.instantiationCallsiteName = instantiationCallsiteName;
    }
}
exports.ClientFunctionExecutionInterruptionError = ClientFunctionExecutionInterruptionError;
class DomNodeClientFunctionResultError extends TestRunErrorBase {
    constructor(instantiationCallsiteName) {
        super(types_1.TEST_RUN_ERRORS.domNodeClientFunctionResultError);
        this.instantiationCallsiteName = instantiationCallsiteName;
    }
}
exports.DomNodeClientFunctionResultError = DomNodeClientFunctionResultError;
// Selector errors
//--------------------------------------------------------------------
class SelectorErrorBase extends TestRunErrorBase {
    constructor(code, { apiFnChain, apiFnIndex }) {
        super(code);
        this.apiFnChain = apiFnChain;
        this.apiFnIndex = apiFnIndex;
    }
}
class InvalidSelectorResultError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.invalidSelectorResultError);
    }
}
exports.InvalidSelectorResultError = InvalidSelectorResultError;
class CannotObtainInfoForElementSpecifiedBySelectorError extends SelectorErrorBase {
    constructor(callsite, apiFnArgs) {
        super(types_1.TEST_RUN_ERRORS.cannotObtainInfoForElementSpecifiedBySelectorError, apiFnArgs);
        this.callsite = callsite;
    }
}
exports.CannotObtainInfoForElementSpecifiedBySelectorError = CannotObtainInfoForElementSpecifiedBySelectorError;
// Uncaught errors
//--------------------------------------------------------------------
class UncaughtErrorOnPage extends TestRunErrorBase {
    constructor(errStack, pageDestUrl) {
        super(types_1.TEST_RUN_ERRORS.uncaughtErrorOnPage);
        this.errStack = errStack;
        this.pageDestUrl = pageDestUrl;
    }
}
exports.UncaughtErrorOnPage = UncaughtErrorOnPage;
class UncaughtErrorInClientFunctionCode extends TestRunErrorBase {
    constructor(instantiationCallsiteName, err) {
        super(types_1.TEST_RUN_ERRORS.uncaughtErrorInClientFunctionCode);
        this.errMsg = String(err);
        this.instantiationCallsiteName = instantiationCallsiteName;
    }
}
exports.UncaughtErrorInClientFunctionCode = UncaughtErrorInClientFunctionCode;
class UncaughtErrorInCustomDOMPropertyCode extends TestRunErrorBase {
    constructor(instantiationCallsiteName, err, prop) {
        super(types_1.TEST_RUN_ERRORS.uncaughtErrorInCustomDOMPropertyCode, err, prop);
        this.errMsg = String(err);
        this.property = prop;
        this.instantiationCallsiteName = instantiationCallsiteName;
    }
}
exports.UncaughtErrorInCustomDOMPropertyCode = UncaughtErrorInCustomDOMPropertyCode;
class UncaughtErrorInCustomClientScriptCode extends TestRunErrorBase {
    constructor(err) {
        super(types_1.TEST_RUN_ERRORS.uncaughtErrorInCustomClientScriptCode);
        this.errMsg = String(err);
    }
}
exports.UncaughtErrorInCustomClientScriptCode = UncaughtErrorInCustomClientScriptCode;
class UncaughtErrorInCustomClientScriptLoadedFromModule extends TestRunErrorBase {
    constructor(err, moduleName) {
        super(types_1.TEST_RUN_ERRORS.uncaughtErrorInCustomClientScriptCodeLoadedFromModule);
        this.errMsg = String(err);
        this.moduleName = moduleName;
    }
}
exports.UncaughtErrorInCustomClientScriptLoadedFromModule = UncaughtErrorInCustomClientScriptLoadedFromModule;
// Action parameters errors
//--------------------------------------------------------------------
// Options errors
//--------------------------------------------------------------------
class ActionIntegerOptionError extends ActionOptionErrorBase {
    constructor(optionName, actualValue) {
        super(types_1.TEST_RUN_ERRORS.actionIntegerOptionError, optionName, actualValue);
    }
}
exports.ActionIntegerOptionError = ActionIntegerOptionError;
class ActionPositiveIntegerOptionError extends ActionOptionErrorBase {
    constructor(optionName, actualValue) {
        super(types_1.TEST_RUN_ERRORS.actionPositiveIntegerOptionError, optionName, actualValue);
    }
}
exports.ActionPositiveIntegerOptionError = ActionPositiveIntegerOptionError;
class ActionBooleanOptionError extends ActionOptionErrorBase {
    constructor(optionName, actualValue) {
        super(types_1.TEST_RUN_ERRORS.actionBooleanOptionError, optionName, actualValue);
    }
}
exports.ActionBooleanOptionError = ActionBooleanOptionError;
class ActionSpeedOptionError extends ActionOptionErrorBase {
    constructor(optionName, actualValue) {
        super(types_1.TEST_RUN_ERRORS.actionSpeedOptionError, optionName, actualValue);
    }
}
exports.ActionSpeedOptionError = ActionSpeedOptionError;
// Action execution errors
//--------------------------------------------------------------------
class ActionElementNotFoundError extends SelectorErrorBase {
    constructor(apiFnArgs) {
        super(types_1.TEST_RUN_ERRORS.actionElementNotFoundError, apiFnArgs);
    }
}
exports.ActionElementNotFoundError = ActionElementNotFoundError;
class ActionElementIsInvisibleError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.actionElementIsInvisibleError);
    }
}
exports.ActionElementIsInvisibleError = ActionElementIsInvisibleError;
class ActionSelectorMatchesWrongNodeTypeError extends TestRunErrorBase {
    constructor(nodeDescription) {
        super(types_1.TEST_RUN_ERRORS.actionSelectorMatchesWrongNodeTypeError);
        this.nodeDescription = nodeDescription;
    }
}
exports.ActionSelectorMatchesWrongNodeTypeError = ActionSelectorMatchesWrongNodeTypeError;
class ActionAdditionalElementNotFoundError extends SelectorErrorBase {
    constructor(argumentName, apiFnArgs) {
        super(types_1.TEST_RUN_ERRORS.actionAdditionalElementNotFoundError, apiFnArgs);
        this.argumentName = argumentName;
    }
}
exports.ActionAdditionalElementNotFoundError = ActionAdditionalElementNotFoundError;
class ActionAdditionalElementIsInvisibleError extends TestRunErrorBase {
    constructor(argumentName) {
        super(types_1.TEST_RUN_ERRORS.actionAdditionalElementIsInvisibleError);
        this.argumentName = argumentName;
    }
}
exports.ActionAdditionalElementIsInvisibleError = ActionAdditionalElementIsInvisibleError;
class ActionAdditionalSelectorMatchesWrongNodeTypeError extends TestRunErrorBase {
    constructor(argumentName, nodeDescription) {
        super(types_1.TEST_RUN_ERRORS.actionAdditionalSelectorMatchesWrongNodeTypeError);
        this.argumentName = argumentName;
        this.nodeDescription = nodeDescription;
    }
}
exports.ActionAdditionalSelectorMatchesWrongNodeTypeError = ActionAdditionalSelectorMatchesWrongNodeTypeError;
class ActionElementNonEditableError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.actionElementNonEditableError);
    }
}
exports.ActionElementNonEditableError = ActionElementNonEditableError;
class ActionElementNotTextAreaError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.actionElementNotTextAreaError);
    }
}
exports.ActionElementNotTextAreaError = ActionElementNotTextAreaError;
class ActionElementNonContentEditableError extends TestRunErrorBase {
    constructor(argumentName) {
        super(types_1.TEST_RUN_ERRORS.actionElementNonContentEditableError);
        this.argumentName = argumentName;
    }
}
exports.ActionElementNonContentEditableError = ActionElementNonContentEditableError;
class ActionRootContainerNotFoundError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.actionRootContainerNotFoundError);
    }
}
exports.ActionRootContainerNotFoundError = ActionRootContainerNotFoundError;
class ActionIncorrectKeysError extends TestRunErrorBase {
    constructor(argumentName) {
        super(types_1.TEST_RUN_ERRORS.actionIncorrectKeysError);
        this.argumentName = argumentName;
    }
}
exports.ActionIncorrectKeysError = ActionIncorrectKeysError;
class ActionCannotFindFileToUploadError extends TestRunErrorBase {
    constructor(filePaths, scannedFilePaths) {
        super(types_1.TEST_RUN_ERRORS.actionCannotFindFileToUploadError);
        this.filePaths = filePaths;
        this.scannedFilePaths = scannedFilePaths;
    }
}
exports.ActionCannotFindFileToUploadError = ActionCannotFindFileToUploadError;
class ActionElementIsNotFileInputError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.actionElementIsNotFileInputError);
    }
}
exports.ActionElementIsNotFileInputError = ActionElementIsNotFileInputError;
class ActionInvalidScrollTargetError extends TestRunErrorBase {
    constructor(scrollTargetXValid, scrollTargetYValid) {
        super(types_1.TEST_RUN_ERRORS.actionInvalidScrollTargetError);
        if (!scrollTargetXValid) {
            if (!scrollTargetYValid)
                this.properties = 'scrollTargetX and scrollTargetY properties';
            else
                this.properties = 'scrollTargetX property';
        }
        else
            this.properties = 'scrollTargetY property';
    }
}
exports.ActionInvalidScrollTargetError = ActionInvalidScrollTargetError;
class InvalidElementScreenshotDimensionsError extends TestRunErrorBase {
    constructor(width, height) {
        super(types_1.TEST_RUN_ERRORS.invalidElementScreenshotDimensionsError);
        const widthIsInvalid = width <= 0;
        const heightIsInvalid = height <= 0;
        if (widthIsInvalid) {
            if (heightIsInvalid) {
                this.verb = 'are';
                this.dimensions = 'width and height';
            }
            else {
                this.verb = 'is';
                this.dimensions = 'width';
            }
        }
        else {
            this.verb = 'is';
            this.dimensions = 'height';
        }
    }
}
exports.InvalidElementScreenshotDimensionsError = InvalidElementScreenshotDimensionsError;
// Iframe errors
//--------------------------------------------------------------------
class ActionElementNotIframeError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.actionElementNotIframeError);
    }
}
exports.ActionElementNotIframeError = ActionElementNotIframeError;
class ActionIframeIsNotLoadedError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.actionIframeIsNotLoadedError);
    }
}
exports.ActionIframeIsNotLoadedError = ActionIframeIsNotLoadedError;
class CurrentIframeIsNotLoadedError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.currentIframeIsNotLoadedError);
    }
}
exports.CurrentIframeIsNotLoadedError = CurrentIframeIsNotLoadedError;
class ChildWindowNotFoundError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.childWindowNotFoundError);
    }
}
exports.ChildWindowNotFoundError = ChildWindowNotFoundError;
class ChildWindowIsNotLoadedError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.childWindowIsNotLoadedError);
    }
}
exports.ChildWindowIsNotLoadedError = ChildWindowIsNotLoadedError;
class CannotSwitchToWindowError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.cannotSwitchToWindowError);
    }
}
exports.CannotSwitchToWindowError = CannotSwitchToWindowError;
class CloseChildWindowError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.closeChildWindowError);
    }
}
exports.CloseChildWindowError = CloseChildWindowError;
class CannotCloseWindowWithChildrenError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.cannotCloseWindowWithChildrenError);
    }
}
exports.CannotCloseWindowWithChildrenError = CannotCloseWindowWithChildrenError;
class CannotCloseWindowWithoutParentError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.cannotCloseWindowWithoutParent);
    }
}
exports.CannotCloseWindowWithoutParentError = CannotCloseWindowWithoutParentError;
class SwitchToWindowPredicateError extends TestRunErrorBase {
    constructor(errMsg) {
        super(types_1.TEST_RUN_ERRORS.switchToWindowPredicateError);
        this.errMsg = errMsg;
    }
}
exports.SwitchToWindowPredicateError = SwitchToWindowPredicateError;
class WindowNotFoundError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.targetWindowNotFoundError);
    }
}
exports.WindowNotFoundError = WindowNotFoundError;
class ParentWindowNotFoundError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.parentWindowNotFoundError);
    }
}
exports.ParentWindowNotFoundError = ParentWindowNotFoundError;
class PreviousWindowNotFoundError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.previousWindowNotFoundError);
    }
}
exports.PreviousWindowNotFoundError = PreviousWindowNotFoundError;
class ChildWindowClosedBeforeSwitchingError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.childWindowClosedBeforeSwitchingError);
    }
}
exports.ChildWindowClosedBeforeSwitchingError = ChildWindowClosedBeforeSwitchingError;
class CannotRestoreChildWindowError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.cannotRestoreChildWindowError);
    }
}
exports.CannotRestoreChildWindowError = CannotRestoreChildWindowError;
class CurrentIframeNotFoundError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.currentIframeNotFoundError);
    }
}
exports.CurrentIframeNotFoundError = CurrentIframeNotFoundError;
class CurrentIframeIsInvisibleError extends TestRunErrorBase {
    constructor() {
        super(types_1.TEST_RUN_ERRORS.currentIframeIsInvisibleError);
    }
}
exports.CurrentIframeIsInvisibleError = CurrentIframeIsInvisibleError;
// Native dialog errors
//--------------------------------------------------------------------
class NativeDialogNotHandledError extends TestRunErrorBase {
    constructor(dialogType, url) {
        super(types_1.TEST_RUN_ERRORS.nativeDialogNotHandledError);
        this.dialogType = dialogType;
        this.pageUrl = url;
    }
}
exports.NativeDialogNotHandledError = NativeDialogNotHandledError;
class UncaughtErrorInNativeDialogHandler extends TestRunErrorBase {
    constructor(dialogType, errMsg, url) {
        super(types_1.TEST_RUN_ERRORS.uncaughtErrorInNativeDialogHandler);
        this.dialogType = dialogType;
        this.errMsg = errMsg;
        this.pageUrl = url;
    }
}
exports.UncaughtErrorInNativeDialogHandler = UncaughtErrorInNativeDialogHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2hhcmVkL2Vycm9ycy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxnRUFBZ0U7QUFDaEUsZ0VBQWdFO0FBQ2hFLCtDQUErQztBQUMvQyxnRUFBZ0U7QUFDaEUsOENBQXFEO0FBRXJELE9BQU87QUFDUCxzRUFBc0U7QUFDdEUsTUFBYSxnQkFBZ0I7SUFDekIsWUFBYSxJQUFJO1FBQ2IsSUFBSSxDQUFDLElBQUksR0FBYyxJQUFJLENBQUM7UUFDNUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDNUIsSUFBSSxDQUFDLFFBQVEsR0FBVSxJQUFJLENBQUM7SUFDaEMsQ0FBQztDQUNKO0FBTkQsNENBTUM7QUFFRCxNQUFNLHFCQUFzQixTQUFRLGdCQUFnQjtJQUNoRCxZQUFhLElBQUksRUFBRSxVQUFVLEVBQUUsV0FBVztRQUN0QyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFWixJQUFJLENBQUMsVUFBVSxHQUFJLFVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztJQUNuQyxDQUFDO0NBQ0o7QUFHRCx5QkFBeUI7QUFDekIsc0VBQXNFO0FBQ3RFLE1BQWEsd0NBQXlDLFNBQVEsZ0JBQWdCO0lBQzFFLFlBQWEseUJBQXlCO1FBQ2xDLEtBQUssQ0FBQyx1QkFBZSxDQUFDLHdDQUF3QyxDQUFDLENBQUM7UUFFaEUsSUFBSSxDQUFDLHlCQUF5QixHQUFHLHlCQUF5QixDQUFDO0lBQy9ELENBQUM7Q0FDSjtBQU5ELDRGQU1DO0FBRUQsTUFBYSxnQ0FBaUMsU0FBUSxnQkFBZ0I7SUFDbEUsWUFBYSx5QkFBeUI7UUFDbEMsS0FBSyxDQUFDLHVCQUFlLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztRQUV4RCxJQUFJLENBQUMseUJBQXlCLEdBQUcseUJBQXlCLENBQUM7SUFDL0QsQ0FBQztDQUNKO0FBTkQsNEVB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LEdBQUcsQ0FBQztJQUMxQixDQUFDO0NBQ0o7QUFSRCxnRkFRQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFdBUk5JTkc6IHRoaXMgZmlsZSBpcyB1c2VkIGJ5IGJvdGggdGhlIGNsaWVudCBhbmQgdGhlIHNlcnZlci5cbi8vIERvIG5vdCB1c2UgYW55IGJyb3dzZXIgb3Igbm9kZS1zcGVjaWZpYyBBUEkhXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5pbXBvcnQgeyBURVNUX1JVTl9FUlJPUlMgfSBmcm9tICcuLi8uLi9lcnJvcnMvdHlwZXMnO1xuXG4vLyBCYXNlXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5leHBvcnQgY2xhc3MgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKGNvZGUpIHtcbiAgICAgICAgdGhpcy5jb2RlICAgICAgICAgICAgPSBjb2RlO1xuICAgICAgICB0aGlzLmlzVGVzdENhZmVFcnJvciA9IHRydWU7XG4gICAgICAgIHRoaXMuY2FsbHNpdGUgICAgICAgID0gbnVsbDtcbiAgICB9XG59XG5cbmNsYXNzIEFjdGlvbk9wdGlvbkVycm9yQmFzZSBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChjb2RlLCBvcHRpb25OYW1lLCBhY3R1YWxWYWx1ZSkge1xuICAgICAgICBzdXBlcihjb2RlKTtcblxuICAgICAgICB0aGlzLm9wdGlvbk5hbWUgID0gb3B0aW9uTmFtZTtcbiAgICAgICAgdGhpcy5hY3R1YWxWYWx1ZSA9IGFjdHVhbFZhbHVlO1xuICAgIH1cbn1cblxuXG4vLyBDbGllbnQgZnVuY3Rpb24gZXJyb3JzXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5leHBvcnQgY2xhc3MgQ2xpZW50RnVuY3Rpb25FeGVjdXRpb25JbnRlcnJ1cHRpb25FcnJvciBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChpbnN0YW50aWF0aW9uQ2FsbHNpdGVOYW1lKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy5jbGllbnRGdW5jdGlvbkV4ZWN1dGlvbkludGVycnVwdGlvbkVycm9yKTtcblxuICAgICAgICB0aGlzLmluc3RhbnRpYXRpb25DYWxsc2l0ZU5hbWUgPSBpbnN0YW50aWF0aW9uQ2FsbHNpdGVOYW1lO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIERvbU5vZGVDbGllbnRGdW5jdGlvblJlc3VsdEVycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKGluc3RhbnRpYXRpb25DYWxsc2l0ZU5hbWUpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLmRvbU5vZGVDbGllbnRGdW5jdGlvblJlc3VsdEVycm9yKTtcblxuICAgICAgICB0aGlzLmluc3RhbnRpYXRpb25DYWxsc2l0ZU5hbWUgPSBpbnN0YW50aWF0aW9uQ2FsbHNpdGVOYW1lO1xuICAgIH1cbn1cblxuXG4vLyBTZWxlY3RvciBlcnJvcnNcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFNlbGVjdG9yRXJyb3JCYXNlIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKGNvZGUsIHsgYXBpRm5DaGFpbiwgYXBpRm5JbmRleCB9KSB7XG4gICAgICAgIHN1cGVyKGNvZGUpO1xuXG4gICAgICAgIHRoaXMuYXBpRm5DaGFpbiA9IGFwaUZuQ2hhaW47XG4gICAgICAgIHRoaXMuYXBpRm5JbmRleCA9IGFwaUZuSW5kZXg7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgSW52YWxpZFNlbGVjdG9yUmVzdWx0RXJyb3IgZXh0ZW5kcyBUZXN0UnVuRXJyb3JCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy5pbnZhbGlkU2VsZWN0b3JSZXN1bHRFcnJvcik7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2Fubm90T2J0YWluSW5mb0ZvckVsZW1lbnRTcGVjaWZpZWRCeVNlbGVjdG9yRXJyb3IgZXh0ZW5kcyBTZWxlY3RvckVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKGNhbGxzaXRlLCBhcGlGbkFyZ3MpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLmNhbm5vdE9idGFpbkluZm9Gb3JFbGVtZW50U3BlY2lmaWVkQnlTZWxlY3RvckVycm9yLCBhcGlGbkFyZ3MpO1xuXG4gICAgICAgIHRoaXMuY2FsbHNpdGUgPSBjYWxsc2l0ZTtcbiAgICB9XG59XG5cblxuLy8gVW5jYXVnaHQgZXJyb3JzXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5leHBvcnQgY2xhc3MgVW5jYXVnaHRFcnJvck9uUGFnZSBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChlcnJTdGFjaywgcGFnZURlc3RVcmwpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLnVuY2F1Z2h0RXJyb3JPblBhZ2UpO1xuXG4gICAgICAgIHRoaXMuZXJyU3RhY2sgICAgPSBlcnJTdGFjaztcbiAgICAgICAgdGhpcy5wYWdlRGVzdFVybCA9IHBhZ2VEZXN0VXJsO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVuY2F1Z2h0RXJyb3JJbkNsaWVudEZ1bmN0aW9uQ29kZSBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChpbnN0YW50aWF0aW9uQ2FsbHNpdGVOYW1lLCBlcnIpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLnVuY2F1Z2h0RXJyb3JJbkNsaWVudEZ1bmN0aW9uQ29kZSk7XG5cbiAgICAgICAgdGhpcy5lcnJNc2cgICAgICAgICAgICAgICAgICAgID0gU3RyaW5nKGVycik7XG4gICAgICAgIHRoaXMuaW5zdGFudGlhdGlvbkNhbGxzaXRlTmFtZSA9IGluc3RhbnRpYXRpb25DYWxsc2l0ZU5hbWU7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVW5jYXVnaHRFcnJvckluQ3VzdG9tRE9NUHJvcGVydHlDb2RlIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKGluc3RhbnRpYXRpb25DYWxsc2l0ZU5hbWUsIGVyciwgcHJvcCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMudW5jYXVnaHRFcnJvckluQ3VzdG9tRE9NUHJvcGVydHlDb2RlLCBlcnIsIHByb3ApO1xuXG4gICAgICAgIHRoaXMuZXJyTXNnICAgICAgICAgICAgICAgICAgICA9IFN0cmluZyhlcnIpO1xuICAgICAgICB0aGlzLnByb3BlcnR5ICAgICAgICAgICAgICAgICAgPSBwcm9wO1xuICAgICAgICB0aGlzLmluc3RhbnRpYXRpb25DYWxsc2l0ZU5hbWUgPSBpbnN0YW50aWF0aW9uQ2FsbHNpdGVOYW1lO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVuY2F1Z2h0RXJyb3JJbkN1c3RvbUNsaWVudFNjcmlwdENvZGUgZXh0ZW5kcyBUZXN0UnVuRXJyb3JCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAoZXJyKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy51bmNhdWdodEVycm9ySW5DdXN0b21DbGllbnRTY3JpcHRDb2RlKTtcblxuICAgICAgICB0aGlzLmVyck1zZyA9IFN0cmluZyhlcnIpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVuY2F1Z2h0RXJyb3JJbkN1c3RvbUNsaWVudFNjcmlwdExvYWRlZEZyb21Nb2R1bGUgZXh0ZW5kcyBUZXN0UnVuRXJyb3JCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAoZXJyLCBtb2R1bGVOYW1lKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy51bmNhdWdodEVycm9ySW5DdXN0b21DbGllbnRTY3JpcHRDb2RlTG9hZGVkRnJvbU1vZHVsZSk7XG5cbiAgICAgICAgdGhpcy5lcnJNc2cgICAgID0gU3RyaW5nKGVycik7XG4gICAgICAgIHRoaXMubW9kdWxlTmFtZSA9IG1vZHVsZU5hbWU7XG4gICAgfVxufVxuXG5cbi8vIEFjdGlvbiBwYXJhbWV0ZXJzIGVycm9yc1xuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gT3B0aW9ucyBlcnJvcnNcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmV4cG9ydCBjbGFzcyBBY3Rpb25JbnRlZ2VyT3B0aW9uRXJyb3IgZXh0ZW5kcyBBY3Rpb25PcHRpb25FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChvcHRpb25OYW1lLCBhY3R1YWxWYWx1ZSkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuYWN0aW9uSW50ZWdlck9wdGlvbkVycm9yLCBvcHRpb25OYW1lLCBhY3R1YWxWYWx1ZSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQWN0aW9uUG9zaXRpdmVJbnRlZ2VyT3B0aW9uRXJyb3IgZXh0ZW5kcyBBY3Rpb25PcHRpb25FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChvcHRpb25OYW1lLCBhY3R1YWxWYWx1ZSkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuYWN0aW9uUG9zaXRpdmVJbnRlZ2VyT3B0aW9uRXJyb3IsIG9wdGlvbk5hbWUsIGFjdHVhbFZhbHVlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBY3Rpb25Cb29sZWFuT3B0aW9uRXJyb3IgZXh0ZW5kcyBBY3Rpb25PcHRpb25FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChvcHRpb25OYW1lLCBhY3R1YWxWYWx1ZSkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuYWN0aW9uQm9vbGVhbk9wdGlvbkVycm9yLCBvcHRpb25OYW1lLCBhY3R1YWxWYWx1ZSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQWN0aW9uU3BlZWRPcHRpb25FcnJvciBleHRlbmRzIEFjdGlvbk9wdGlvbkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9wdGlvbk5hbWUsIGFjdHVhbFZhbHVlKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy5hY3Rpb25TcGVlZE9wdGlvbkVycm9yLCBvcHRpb25OYW1lLCBhY3R1YWxWYWx1ZSk7XG4gICAgfVxufVxuXG5cbi8vIEFjdGlvbiBleGVjdXRpb24gZXJyb3JzXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5leHBvcnQgY2xhc3MgQWN0aW9uRWxlbWVudE5vdEZvdW5kRXJyb3IgZXh0ZW5kcyBTZWxlY3RvckVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKGFwaUZuQXJncykge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuYWN0aW9uRWxlbWVudE5vdEZvdW5kRXJyb3IsIGFwaUZuQXJncyk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQWN0aW9uRWxlbWVudElzSW52aXNpYmxlRXJyb3IgZXh0ZW5kcyBUZXN0UnVuRXJyb3JCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy5hY3Rpb25FbGVtZW50SXNJbnZpc2libGVFcnJvcik7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQWN0aW9uU2VsZWN0b3JNYXRjaGVzV3JvbmdOb2RlVHlwZUVycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG5vZGVEZXNjcmlwdGlvbikge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuYWN0aW9uU2VsZWN0b3JNYXRjaGVzV3JvbmdOb2RlVHlwZUVycm9yKTtcblxuICAgICAgICB0aGlzLm5vZGVEZXNjcmlwdGlvbiA9IG5vZGVEZXNjcmlwdGlvbjtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBY3Rpb25BZGRpdGlvbmFsRWxlbWVudE5vdEZvdW5kRXJyb3IgZXh0ZW5kcyBTZWxlY3RvckVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKGFyZ3VtZW50TmFtZSwgYXBpRm5BcmdzKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy5hY3Rpb25BZGRpdGlvbmFsRWxlbWVudE5vdEZvdW5kRXJyb3IsIGFwaUZuQXJncyk7XG5cbiAgICAgICAgdGhpcy5hcmd1bWVudE5hbWUgPSBhcmd1bWVudE5hbWU7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQWN0aW9uQWRkaXRpb25hbEVsZW1lbnRJc0ludmlzaWJsZUVycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKGFyZ3VtZW50TmFtZSkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuYWN0aW9uQWRkaXRpb25hbEVsZW1lbnRJc0ludmlzaWJsZUVycm9yKTtcblxuICAgICAgICB0aGlzLmFyZ3VtZW50TmFtZSA9IGFyZ3VtZW50TmFtZTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBY3Rpb25BZGRpdGlvbmFsU2VsZWN0b3JNYXRjaGVzV3JvbmdOb2RlVHlwZUVycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKGFyZ3VtZW50TmFtZSwgbm9kZURlc2NyaXB0aW9uKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy5hY3Rpb25BZGRpdGlvbmFsU2VsZWN0b3JNYXRjaGVzV3JvbmdOb2RlVHlwZUVycm9yKTtcblxuICAgICAgICB0aGlzLmFyZ3VtZW50TmFtZSAgICA9IGFyZ3VtZW50TmFtZTtcbiAgICAgICAgdGhpcy5ub2RlRGVzY3JpcHRpb24gPSBub2RlRGVzY3JpcHRpb247XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQWN0aW9uRWxlbWVudE5vbkVkaXRhYmxlRXJyb3IgZXh0ZW5kcyBUZXN0UnVuRXJyb3JCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy5hY3Rpb25FbGVtZW50Tm9uRWRpdGFibGVFcnJvcik7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQWN0aW9uRWxlbWVudE5vdFRleHRBcmVhRXJyb3IgZXh0ZW5kcyBUZXN0UnVuRXJyb3JCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy5hY3Rpb25FbGVtZW50Tm90VGV4dEFyZWFFcnJvcik7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQWN0aW9uRWxlbWVudE5vbkNvbnRlbnRFZGl0YWJsZUVycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKGFyZ3VtZW50TmFtZSkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuYWN0aW9uRWxlbWVudE5vbkNvbnRlbnRFZGl0YWJsZUVycm9yKTtcblxuICAgICAgICB0aGlzLmFyZ3VtZW50TmFtZSA9IGFyZ3VtZW50TmFtZTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBY3Rpb25Sb290Q29udGFpbmVyTm90Rm91bmRFcnJvciBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLmFjdGlvblJvb3RDb250YWluZXJOb3RGb3VuZEVycm9yKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBY3Rpb25JbmNvcnJlY3RLZXlzRXJyb3IgZXh0ZW5kcyBUZXN0UnVuRXJyb3JCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAoYXJndW1lbnROYW1lKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy5hY3Rpb25JbmNvcnJlY3RLZXlzRXJyb3IpO1xuXG4gICAgICAgIHRoaXMuYXJndW1lbnROYW1lID0gYXJndW1lbnROYW1lO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFjdGlvbkNhbm5vdEZpbmRGaWxlVG9VcGxvYWRFcnJvciBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChmaWxlUGF0aHMsIHNjYW5uZWRGaWxlUGF0aHMpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLmFjdGlvbkNhbm5vdEZpbmRGaWxlVG9VcGxvYWRFcnJvcik7XG5cbiAgICAgICAgdGhpcy5maWxlUGF0aHMgICAgICAgID0gZmlsZVBhdGhzO1xuICAgICAgICB0aGlzLnNjYW5uZWRGaWxlUGF0aHMgPSBzY2FubmVkRmlsZVBhdGhzO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFjdGlvbkVsZW1lbnRJc05vdEZpbGVJbnB1dEVycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuYWN0aW9uRWxlbWVudElzTm90RmlsZUlucHV0RXJyb3IpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFjdGlvbkludmFsaWRTY3JvbGxUYXJnZXRFcnJvciBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChzY3JvbGxUYXJnZXRYVmFsaWQsIHNjcm9sbFRhcmdldFlWYWxpZCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuYWN0aW9uSW52YWxpZFNjcm9sbFRhcmdldEVycm9yKTtcblxuICAgICAgICBpZiAoIXNjcm9sbFRhcmdldFhWYWxpZCkge1xuICAgICAgICAgICAgaWYgKCFzY3JvbGxUYXJnZXRZVmFsaWQpXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gJ3Njcm9sbFRhcmdldFggYW5kIHNjcm9sbFRhcmdldFkgcHJvcGVydGllcyc7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gJ3Njcm9sbFRhcmdldFggcHJvcGVydHknO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoaXMucHJvcGVydGllcyA9ICdzY3JvbGxUYXJnZXRZIHByb3BlcnR5JztcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkRWxlbWVudFNjcmVlbnNob3REaW1lbnNpb25zRXJyb3IgZXh0ZW5kcyBUZXN0UnVuRXJyb3JCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAod2lkdGgsIGhlaWdodCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuaW52YWxpZEVsZW1lbnRTY3JlZW5zaG90RGltZW5zaW9uc0Vycm9yKTtcblxuICAgICAgICBjb25zdCB3aWR0aElzSW52YWxpZCAgPSB3aWR0aCA8PSAwO1xuICAgICAgICBjb25zdCBoZWlnaHRJc0ludmFsaWQgPSBoZWlnaHQgPD0gMDtcblxuICAgICAgICBpZiAod2lkdGhJc0ludmFsaWQpIHtcbiAgICAgICAgICAgIGlmIChoZWlnaHRJc0ludmFsaWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZlcmIgICAgICAgPSAnYXJlJztcbiAgICAgICAgICAgICAgICB0aGlzLmRpbWVuc2lvbnMgPSAnd2lkdGggYW5kIGhlaWdodCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZlcmIgICAgICAgPSAnaXMnO1xuICAgICAgICAgICAgICAgIHRoaXMuZGltZW5zaW9ucyA9ICd3aWR0aCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnZlcmIgICAgICAgPSAnaXMnO1xuICAgICAgICAgICAgdGhpcy5kaW1lbnNpb25zID0gJ2hlaWdodCc7XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuLy8gSWZyYW1lIGVycm9yc1xuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZXhwb3J0IGNsYXNzIEFjdGlvbkVsZW1lbnROb3RJZnJhbWVFcnJvciBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLmFjdGlvbkVsZW1lbnROb3RJZnJhbWVFcnJvcik7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQWN0aW9uSWZyYW1lSXNOb3RMb2FkZWRFcnJvciBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLmFjdGlvbklmcmFtZUlzTm90TG9hZGVkRXJyb3IpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEN1cnJlbnRJZnJhbWVJc05vdExvYWRlZEVycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuY3VycmVudElmcmFtZUlzTm90TG9hZGVkRXJyb3IpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENoaWxkV2luZG93Tm90Rm91bmRFcnJvciBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLmNoaWxkV2luZG93Tm90Rm91bmRFcnJvcik7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2hpbGRXaW5kb3dJc05vdExvYWRlZEVycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuY2hpbGRXaW5kb3dJc05vdExvYWRlZEVycm9yKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDYW5ub3RTd2l0Y2hUb1dpbmRvd0Vycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuY2Fubm90U3dpdGNoVG9XaW5kb3dFcnJvcik7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2xvc2VDaGlsZFdpbmRvd0Vycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuY2xvc2VDaGlsZFdpbmRvd0Vycm9yKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDYW5ub3RDbG9zZVdpbmRvd1dpdGhDaGlsZHJlbkVycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuY2Fubm90Q2xvc2VXaW5kb3dXaXRoQ2hpbGRyZW5FcnJvcik7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2Fubm90Q2xvc2VXaW5kb3dXaXRob3V0UGFyZW50RXJyb3IgZXh0ZW5kcyBUZXN0UnVuRXJyb3JCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy5jYW5ub3RDbG9zZVdpbmRvd1dpdGhvdXRQYXJlbnQpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN3aXRjaFRvV2luZG93UHJlZGljYXRlRXJyb3IgZXh0ZW5kcyBUZXN0UnVuRXJyb3JCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAoZXJyTXNnKSB7XG4gICAgICAgIHN1cGVyKFRFU1RfUlVOX0VSUk9SUy5zd2l0Y2hUb1dpbmRvd1ByZWRpY2F0ZUVycm9yKTtcblxuICAgICAgICB0aGlzLmVyck1zZyA9IGVyck1zZztcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBXaW5kb3dOb3RGb3VuZEVycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMudGFyZ2V0V2luZG93Tm90Rm91bmRFcnJvcik7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGFyZW50V2luZG93Tm90Rm91bmRFcnJvciBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLnBhcmVudFdpbmRvd05vdEZvdW5kRXJyb3IpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFByZXZpb3VzV2luZG93Tm90Rm91bmRFcnJvciBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLnByZXZpb3VzV2luZG93Tm90Rm91bmRFcnJvcik7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2hpbGRXaW5kb3dDbG9zZWRCZWZvcmVTd2l0Y2hpbmdFcnJvciBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLmNoaWxkV2luZG93Q2xvc2VkQmVmb3JlU3dpdGNoaW5nRXJyb3IpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENhbm5vdFJlc3RvcmVDaGlsZFdpbmRvd0Vycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuY2Fubm90UmVzdG9yZUNoaWxkV2luZG93RXJyb3IpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEN1cnJlbnRJZnJhbWVOb3RGb3VuZEVycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuY3VycmVudElmcmFtZU5vdEZvdW5kRXJyb3IpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEN1cnJlbnRJZnJhbWVJc0ludmlzaWJsZUVycm9yIGV4dGVuZHMgVGVzdFJ1bkVycm9yQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihURVNUX1JVTl9FUlJPUlMuY3VycmVudElmcmFtZUlzSW52aXNpYmxlRXJyb3IpO1xuICAgIH1cbn1cblxuXG4vLyBOYXRpdmUgZGlhbG9nIGVycm9yc1xuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZXhwb3J0IGNsYXNzIE5hdGl2ZURpYWxvZ05vdEhhbmRsZWRFcnJvciBleHRlbmRzIFRlc3RSdW5FcnJvckJhc2Uge1xuICAgIGNvbnN0cnVjdG9yIChkaWFsb2dUeXBlLCB1cmwpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLm5hdGl2ZURpYWxvZ05vdEhhbmRsZWRFcnJvcik7XG5cbiAgICAgICAgdGhpcy5kaWFsb2dUeXBlID0gZGlhbG9nVHlwZTtcbiAgICAgICAgdGhpcy5wYWdlVXJsICAgID0gdXJsO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVuY2F1Z2h0RXJyb3JJbk5hdGl2ZURpYWxvZ0hhbmRsZXIgZXh0ZW5kcyBUZXN0UnVuRXJyb3JCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAoZGlhbG9nVHlwZSwgZXJyTXNnLCB1cmwpIHtcbiAgICAgICAgc3VwZXIoVEVTVF9SVU5fRVJST1JTLnVuY2F1Z2h0RXJyb3JJbk5hdGl2ZURpYWxvZ0hhbmRsZXIpO1xuXG4gICAgICAgIHRoaXMuZGlhbG9nVHlwZSA9IGRpYWxvZ1R5cGU7XG4gICAgICAgIHRoaXMuZXJyTXNnICAgICA9IGVyck1zZztcbiAgICAgICAgdGhpcy5wYWdlVXJsICAgID0gdXJsO1xuICAgIH1cbn1cbiJdfQ==
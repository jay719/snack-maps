"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const runtime_info_1 = __importDefault(require("../chrome/runtime-info"));
const promisified_functions_1 = require("../../../../../utils/promisified-functions");
class EdgeRuntimeInfo extends runtime_info_1.default {
    async createTempProfile(proxyHostName, disableMultipleWindows) {
        const tempDir = await super.createTempProfile(proxyHostName, disableMultipleWindows);
        // NOTE: prevents Edge from automatically logging under system credentials
        // and showing the welcome screen
        const preferences = {
            'fre': {
                'has_user_seen_fre': true
            },
            'profiles': {
                'edge_implicitly_signed_in': [{
                        'edge_account_type': 3,
                        'id': ''
                    }]
            }
        };
        await promisified_functions_1.writeFile(path_1.default.join(tempDir.path, 'Local State'), JSON.stringify(preferences));
        return tempDir;
    }
}
exports.default = EdgeRuntimeInfo;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVudGltZS1pbmZvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Jyb3dzZXIvcHJvdmlkZXIvYnVpbHQtaW4vZGVkaWNhdGVkL2VkZ2UvcnVudGltZS1pbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDBFQUF1RDtBQUV2RCxzRkFBdUU7QUFFdkUsTUFBcUIsZUFBZ0IsU0FBUSxzQkFBaUI7SUFDaEQsS0FBSyxDQUFDLGlCQUFpQixDQUFFLGFBQXFCLEVBQUUsc0JBQStCO1FBQ3JGLE1BQU0sT0FBTyxHQUFHLE1BQU0sS0FBSyxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO1FBRXJGLDBFQUEwRTtRQUMxRSxpQ0FBaUM7UUFDakMsTUFBTSxXQUFXLEdBQUc7WUFDaEIsS0FBSyxFQUFFO2dCQUNILG1CQUFtQixFQUFFLElBQUk7YUFDNUI7WUFDRCxVQUFVLEVBQUU7Z0JBQ1IsMkJBQTJCLEVBQUUsQ0FBQzt3QkFDMUIsbUJBQW1CLEVBQUUsQ0FBQzt3QkFDdEIsSUFBSSxFQUFpQixFQUFFO3FCQUMxQixDQUFDO2FBQ0w7U0FDSixDQUFDO1FBRUYsTUFBTSxpQ0FBUyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFFckYsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQztDQUNKO0FBdEJELGtDQXNCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IENocm9tZVJ1bnRpbWVJbmZvIGZyb20gJy4uL2Nocm9tZS9ydW50aW1lLWluZm8nO1xuaW1wb3J0IFRlbXBEaXJlY3RvcnkgZnJvbSAnLi4vLi4vLi4vLi4vLi4vdXRpbHMvdGVtcC1kaXJlY3RvcnknO1xuaW1wb3J0IHsgd3JpdGVGaWxlIH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vdXRpbHMvcHJvbWlzaWZpZWQtZnVuY3Rpb25zJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRWRnZVJ1bnRpbWVJbmZvIGV4dGVuZHMgQ2hyb21lUnVudGltZUluZm8ge1xuICAgIHByb3RlY3RlZCBhc3luYyBjcmVhdGVUZW1wUHJvZmlsZSAocHJveHlIb3N0TmFtZTogc3RyaW5nLCBkaXNhYmxlTXVsdGlwbGVXaW5kb3dzOiBib29sZWFuKTogUHJvbWlzZTxUZW1wRGlyZWN0b3J5PiB7XG4gICAgICAgIGNvbnN0IHRlbXBEaXIgPSBhd2FpdCBzdXBlci5jcmVhdGVUZW1wUHJvZmlsZShwcm94eUhvc3ROYW1lLCBkaXNhYmxlTXVsdGlwbGVXaW5kb3dzKTtcblxuICAgICAgICAvLyBOT1RFOiBwcmV2ZW50cyBFZGdlIGZyb20gYXV0b21hdGljYWxseSBsb2dnaW5nIHVuZGVyIHN5c3RlbSBjcmVkZW50aWFsc1xuICAgICAgICAvLyBhbmQgc2hvd2luZyB0aGUgd2VsY29tZSBzY3JlZW5cbiAgICAgICAgY29uc3QgcHJlZmVyZW5jZXMgPSB7XG4gICAgICAgICAgICAnZnJlJzoge1xuICAgICAgICAgICAgICAgICdoYXNfdXNlcl9zZWVuX2ZyZSc6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAncHJvZmlsZXMnOiB7XG4gICAgICAgICAgICAgICAgJ2VkZ2VfaW1wbGljaXRseV9zaWduZWRfaW4nOiBbe1xuICAgICAgICAgICAgICAgICAgICAnZWRnZV9hY2NvdW50X3R5cGUnOiAzLFxuICAgICAgICAgICAgICAgICAgICAnaWQnOiAgICAgICAgICAgICAgICAnJ1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgYXdhaXQgd3JpdGVGaWxlKHBhdGguam9pbih0ZW1wRGlyLnBhdGgsICdMb2NhbCBTdGF0ZScpLCBKU09OLnN0cmluZ2lmeShwcmVmZXJlbmNlcykpO1xuXG4gICAgICAgIHJldHVybiB0ZW1wRGlyO1xuICAgIH1cbn1cbiJdfQ==
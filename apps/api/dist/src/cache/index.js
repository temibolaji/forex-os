"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.redis = {
    get: async (key) => null,
    set: async (key, value, mode, duration) => 'OK',
    del: async (key) => 1,
    on: (event, callback) => { },
};

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const dotenv = __importStar(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const journal_1 = __importDefault(require("./routes/journal"));
const positionSize_1 = __importDefault(require("./routes/positionSize"));
const checklist_1 = __importDefault(require("./routes/checklist"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const pipCalc_1 = __importDefault(require("./routes/pipCalc"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const coach_1 = __importDefault(require("./routes/coach"));
dotenv.config();
const server = (0, fastify_1.default)({
    logger: true,
}).withTypeProvider();
// Register Plugins
server.register(cookie_1.default, {
    secret: process.env.COOKIE_SECRET || 'supersecretcookie',
});
server.register(jwt_1.default, {
    secret: process.env.JWT_SECRET || 'supersecret',
});
server.decorate('authenticate', async function (request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.send(err);
    }
});
// Register Routes
server.register(auth_1.default);
server.register(journal_1.default);
server.register(positionSize_1.default);
server.register(checklist_1.default);
server.register(calendar_1.default);
server.register(sessions_1.default);
server.register(pipCalc_1.default);
server.register(analytics_1.default);
server.register(coach_1.default);
// Health check route
server.get('/health', async () => {
    return { status: 'ok' };
});
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3005', 10);
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening at http://localhost:${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();

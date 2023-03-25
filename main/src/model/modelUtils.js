"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const productsEntity_1 = require("../entity/productsEntity");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log(process.env.DATABASE, process.env.HOST, process.env.PORT);
const myDataSource = new typeorm_1.DataSource({
    type: "mongodb",
    host: process.env.HOST,
    port: Number(process.env.PORT),
    database: process.env.DATABASE,
    synchronize: true,
    logging: ["query", "error"],
    entities: [productsEntity_1.Product],
});
exports.default = myDataSource;

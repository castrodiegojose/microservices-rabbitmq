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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productEntity_1 = require("./entity/productEntity");
const cors_1 = __importDefault(require("cors"));
const modelUtils_1 = __importDefault(require("./model/modelUtils"));
const amqp = __importStar(require("amqplib/callback_api"));
console.log(process.env.HOST);
modelUtils_1.default.initialize().then(db => {
    const productsRepository = db.getRepository(productEntity_1.Product);
    amqp.connect(`amqps://${process.env.RABBIT_URL}`, (error0, connection) => {
        if (error0) {
            throw error0;
        }
        connection.createChannel((error1, channel) => {
            if (error1) {
                throw error1;
            }
            const app = (0, express_1.default)();
            app.use((0, cors_1.default)({
                origin: ['https://localhost:3000', 'https://localhost:8000', 'https://localhost:4200']
            }));
            app.use(express_1.default.json());
            app.get('/api/products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
                const products = yield productsRepository.find();
                res.json(products);
            }));
            app.post('/api/products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
                const product = productsRepository.create(req.body);
                const result = yield productsRepository.save(product);
                channel.sendToQueue("product_created", Buffer.from(JSON.stringify(result)));
                return res.status(200).send(result);
            }));
            app.get('/api/products/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
                const product = yield productsRepository.findOne({
                    where: { id: Number(req.params.id) }
                });
                return res.status(200).send(product);
            }));
            app.put('/api/products/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
                const product = (yield productsRepository.findOne({
                    where: { id: Number(req.params.id) }
                }));
                const result = productsRepository.merge(product, req.body);
                yield productsRepository.save(product);
                channel.sendToQueue("product_updated", Buffer.from(JSON.stringify(result)));
                return res.status(200).send(result);
            }));
            app.delete('/api/products/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
                const result = yield productsRepository.delete({
                    id: Number(req.params.id)
                });
                channel.sendToQueue("product_deleted", Buffer.from(req.params.id));
                return res.status(200).send(result);
            }));
            app.post('/api/products/:id/like', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
                const product = (yield productsRepository.findOne({
                    where: { id: Number(req.params.id) }
                }));
                if (!product) {
                    return res.status(404).send({ "error": "Product not found" });
                }
                if (product.likes !== undefined)
                    product.likes++;
                const result = yield productsRepository.save(product);
                return res.status(200).send(result);
            }));
            app.listen(8000, () => {
                console.log(`listening on port 8000 🚀`);
            });
            process.on('BeforeExit', () => {
                console.log(`clossing`);
                connection.close();
            });
        });
    });
});

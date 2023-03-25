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
const cors_1 = __importDefault(require("cors"));
const modelUtils_1 = __importDefault(require("./model/modelUtils"));
const amqp = __importStar(require("amqplib/callback_api"));
const productsEntity_1 = require("./entity/productsEntity");
const axios_1 = __importDefault(require("axios"));
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
modelUtils_1.default.initialize().then(db => {
    const productRepository = db.getMongoRepository(productsEntity_1.Product);
    amqp.connect("amqps://pqbqlbnl:xVx9Y9wOrXB2EEXfXMZU-F318t1wS5dd@jackal.rmq.cloudamqp.com/pqbqlbnl", (error0, connection) => {
        if (error0) {
            throw error0;
        }
        connection.createChannel((error1, channel) => {
            if (error1) {
                throw error1;
            }
            channel.assertQueue("product_created", { durable: false });
            channel.assertQueue("product_updated", { durable: false });
            channel.assertQueue("product_deleted", { durable: false });
            const app = (0, express_1.default)();
            app.use((0, cors_1.default)({
                origin: ['https://localhost:3000', 'https://localhost:8000', 'https://localhost:4200']
            }));
            app.use(express_1.default.json());
            channel.consume("product_created", (msg) => __awaiter(void 0, void 0, void 0, function* () {
                if (!msg)
                    throw new Error;
                const eventProduct = JSON.parse(msg.content.toString());
                const product = new productsEntity_1.Product();
                if (!eventProduct.id)
                    throw new Error;
                product.admin_id = parseInt(eventProduct.id);
                product.title = eventProduct.title;
                product.image = eventProduct.image;
                product.likes = eventProduct.likes;
                yield productRepository.save(product);
                console.log("Product created successfully");
            }), { noAck: true });
            channel.consume("product_updated", (msg) => __awaiter(void 0, void 0, void 0, function* () {
                if (!msg)
                    throw new Error;
                const eventProduct = JSON.parse(msg.content.toString());
                const product = yield productRepository.findOneBy({
                    admin_id: eventProduct._id
                });
                if (!product)
                    throw new Error;
                productRepository.merge(product, {
                    title: eventProduct.title,
                    image: eventProduct.image,
                    likes: eventProduct.likes
                });
                yield productRepository.save(product);
                console.log("Product updated successfully");
            }), { noAck: true });
            channel.consume("product_deleted", (msg) => __awaiter(void 0, void 0, void 0, function* () {
                if (!msg)
                    throw new Error;
                const admin_id = parseInt(msg.content.toString());
                yield productRepository.deleteOne({ admin_id });
                console.log("Product deleted successfully");
            }), { noAck: true });
            app.get('/api/products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
                const products = yield productRepository.find();
                res.status(200).send(products);
            }));
            app.get('/api/products/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
                const productId = new mongodb_1.ObjectId(req.params.id);
                console.log(`ObjectId('${productId}')`);
                const product = yield productRepository.findOneBy({
                    _id: productId,
                });
                res.status(200).send(product);
            }));
            app.post('/api/products/:id/like', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
                const productId = new mongodb_1.ObjectId(req.params.id);
                const product = (yield productRepository.findOneBy({
                    _id: productId,
                }));
                yield axios_1.default.post(`http://localhost:8000/api/products/${product.admin_id}/like`, {});
                let newLike = product.likes;
                if ((product === null || product === void 0 ? void 0 : product.likes) !== undefined)
                    newLike++;
                const response = yield productRepository.update({ admin_id: product.admin_id }, { likes: newLike });
                res.status(200).send(response);
            }));
            app.listen(8001, () => {
                console.log(`listening on port 8001 🚀`);
            });
            process.on('BeforeExit', () => {
                console.log(`clossing`);
                connection.close();
            });
        });
    });
})
    .catch(error => console.log(error));

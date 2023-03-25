import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import myDataSource from "./model/modelUtils";
import * as amqp from 'amqplib/callback_api';
import { Product } from "./entity/productsEntity";
import { Message } from "amqplib/callback_api";
import axios from "axios";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config()

myDataSource.initialize().then(db=>{
    const productRepository = db.getMongoRepository(Product);
    amqp.connect("amqps://pqbqlbnl:xVx9Y9wOrXB2EEXfXMZU-F318t1wS5dd@jackal.rmq.cloudamqp.com/pqbqlbnl", (error0, connection)=>{
        if(error0) {
            throw error0;
        }

        connection.createChannel((error1, channel)=>{
            if(error1) {
                throw error1;
            }

            channel.assertQueue("product_created", {durable: false});
            channel.assertQueue("product_updated", {durable: false});
            channel.assertQueue("product_deleted", {durable: false});

            const app = express();

            app.use(cors({
                origin: ['https://localhost:3000', 'https://localhost:8000', 'https://localhost:4200']
            }));

            app.use(express.json());

            channel.consume("product_created", async (msg: Message | null)=>{
                if(!msg) throw new Error;
                const eventProduct = JSON.parse(msg.content.toString());
                const product = new Product();
                if(!eventProduct.id) throw new Error;
                product.admin_id = parseInt(eventProduct.id)
                product.title = eventProduct.title;
                product.image = eventProduct.image;
                product.likes = eventProduct.likes;
                await productRepository.save(product);
                console.log("Product created successfully");
            },{noAck: true});

            channel.consume("product_updated", async (msg: Message | null) => {
                if(!msg) throw new Error;
                const eventProduct: Product = JSON.parse(msg.content.toString())
                const product = await productRepository.findOneBy({
                    admin_id: eventProduct._id
                });
                if(!product) throw new Error;
                productRepository.merge(product, {
                    title: eventProduct.title,
                    image: eventProduct.image,
                    likes: eventProduct.likes
                })
                await productRepository.save(product);
                console.log("Product updated successfully");
            },{noAck: true});
            
            channel.consume("product_deleted", async (msg: Message | null) => {
                if(!msg) throw new Error;
                const admin_id = parseInt(msg.content.toString())
                await productRepository.deleteOne({admin_id});
                console.log("Product deleted successfully");
            },{noAck: true});

            app.get('/api/products', async (req: Request, res: Response) => {
                const products = await productRepository.find();
                res.status(200).send(products);
            })

            app.get('/api/products/:id', async (req: Request, res: Response) => {
                const productId = new ObjectId(req.params.id)
                console.log(`ObjectId('${productId}')`);
                const product = await productRepository.findOneBy({
                    _id: productId,
                });
                res.status(200).send(product);
            })

            app.post('/api/products/:id/like', async (req: Request, res: Response) => {
                const productId = new ObjectId(req.params.id);                
                const product = (await productRepository.findOneBy({
                    _id: productId,
                })) as Product;
                
                await axios.post(`http://localhost:8000/api/products/${product.admin_id}/like`, {});
                let newLike = product.likes
                if(product?.likes !== undefined) newLike ++
                const response = await productRepository.update({ admin_id: product.admin_id}, {likes: newLike})
                res.status(200).send(response);
            })

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
.catch(
    error => console.log(error)
);
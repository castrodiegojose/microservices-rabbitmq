import express from "express";
import { Product } from "./entity/productEntity";
import { Request, Response } from "express";
import cors from "cors";
import AppDataSource from "./model/modelUtils";
import * as amqp from 'amqplib/callback_api';


console.log(process.env.HOST);

AppDataSource.initialize().then(db=>{
    const productsRepository = db.getRepository(Product);
    amqp.connect("amqps://pqbqlbnl:xVx9Y9wOrXB2EEXfXMZU-F318t1wS5dd@jackal.rmq.cloudamqp.com/pqbqlbnl", (error0, connection)=>{
        if(error0) {
            throw error0;
        }

        connection.createChannel((error1, channel)=>{
            if(error1) {
                throw error1;
            }

            const app = express();

            app.use(cors({
                origin: ['https://localhost:3000', 'https://localhost:8000', 'https://localhost:4200']
            }));

            app.use(express.json());

            app.get('/api/products', async (req: Request, res: Response)=>{
                const products = await productsRepository.find();
                res.json(products);
            })
            
            app.post('/api/products', async (req: Request, res: Response)=>{
                const product = productsRepository.create(req.body);
                const result = await productsRepository.save(product);
                channel.sendToQueue("product_created", Buffer.from(JSON.stringify(result)))
                return res.status(200).send(result);
            })
            
            app.get('/api/products/:id', async (req: Request, res: Response)=>{
                const product = await productsRepository.findOne({
                    where: { id: Number(req.params.id)}
                });
                return res.status(200).send(product);
            })

            app.put('/api/products/:id', async (req: Request, res: Response)=>{
                const product = (await productsRepository.findOne({
                    where: { id: Number(req.params.id)}
                })) as Product;
                
                const result = productsRepository.merge(product, req.body)
                await productsRepository.save(product);
                channel.sendToQueue("product_updated", Buffer.from(JSON.stringify(result)))
                return res.status(200).send(result);
            })

            app.delete('/api/products/:id', async (req: Request, res: Response)=>{
                const result = await productsRepository.delete({
                    id: Number(req.params.id)
                })

                channel.sendToQueue("product_deleted", Buffer.from(req.params.id));
            
                return res.status(200).send(result);
            })

            app.post('/api/products/:id/like', async (req: Request, res: Response)=>{
                const product = (await productsRepository.findOne({
                    where: { id: Number(req.params.id)}
                })) as Product;
                if(!product) {
                    return res.status(404).send({"error": "Product not found"});
                }
                if(product.likes !== undefined) product.likes ++
                const result = await productsRepository.save(product);
                
                return res.status(200).send(result);
            })


            app.listen(8000, () => {
                console.log(`listening on port 8000 🚀`)
            });
            process.on('BeforeExit', () => {
                console.log(`clossing`)
                connection.close();
            });
        })
    })
})
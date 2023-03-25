import { DataSource } from "typeorm"
import { Product } from "../entity/productsEntity";
import dotenv from "dotenv";
dotenv.config()
console.log(process.env.DATABASE, process.env.HOST, process.env.PORT);

const myDataSource = new DataSource({
    type: "mongodb",
    host: process.env.HOST,
    port: Number(process.env.PORT),
    database: process.env.DATABASE,
    synchronize: true,
    logging: ["query", "error"],
    entities: [Product],
})


export default myDataSource
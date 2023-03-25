import "reflect-metadata"
import { DataSource } from "typeorm"
import { Product } from "../entity/productEntity"
import dotenv from "dotenv";
dotenv.config()

const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.HOST,
    port: Number(process.env.PORT),
    username: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    entities: [Product],
    synchronize: true,
    logging: false,
})

export default AppDataSource;

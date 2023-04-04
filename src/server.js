import Express from "express"
import listEndpoints from "express-list-endpoints"
import cors from "cors"
import mongoose from "mongoose"
import { forbiddenErrorHandler, genericErroHandler, notFoundErrorHandler, unauthorizedErrorHandler } from "./errorHandlers.js"
import blogpostsRouter from "./blogposts/index.js"
import authorsRouter from "./authors/index.js"

const server = Express()
const port = process.env.PORT || 3001

//Middlewares

const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL]
server.use(cors(
    {
        origin: (currentOrigin, corsNext) => {
            if (!currentOrigin || whitelist.indexOf(currentOrigin) !== -1) {
                corsNext(null, true)
            } else {
                corsNext(createHttpError(400, `Origin ${currentOrigin} is not in the whitelist!`))
            }
        }
    }
))
server.use(Express.json())

//Endpoints

server.use("/blogposts", blogpostsRouter)
server.use("/authors", authorsRouter)

//Error Handlers
server.use(unauthorizedErrorHandler)
server.use(forbiddenErrorHandler)
server.use(notFoundErrorHandler)
server.use(genericErroHandler)

mongoose.connect(process.env.MONGO_URL)

mongoose.connection.on("connected", () => {
    console.log("Connection established to Mongo!")
    server.listen(port, () => {
        console.table(listEndpoints(server))
        console.log(`Server is running on port ${port}`)
    })
})
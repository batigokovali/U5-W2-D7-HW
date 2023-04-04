import createHttpError from "http-errors"
import atob from "atob"
import authorsModel from "../../authors/model.js"

export const basicAuthMiddleware = async (req, res, next) => {

    if (!req.headers.authorization) {
        next(createHttpError(401, "Please provide credentials in Authorization header"))
    } else {

        const encodedCredentials = req.headers.authorization.replace("Basic ", "") // Alternatively you could use .split()
        const credentials = atob(encodedCredentials)
        const [email, password] = credentials.split(":")
        const author = await authorsModel.checkCredentials(email, password)

        if (author) {
            req.author = author
            next()
        } else {
            next(createHttpError(401, "Credentials are not ok!"))
        }
    }
}

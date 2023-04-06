import express from "express"
import createHttpError from "http-errors"
import createError from "http-errors"
import q2m from "query-to-mongo"
import passport from "passport"
import { JWTAuthMiddleware } from "../lib/auth/jwt.js"
import { adminOnlyMiddleware } from "../lib/auth/admin.js"
import { createTokens, verifyTokensAndCreateNewTokens } from "../lib/auth/tools.js"
import AuthorsModel from "./model.js"

const authorsRouter = express.Router()

authorsRouter.get("/googleLogin", passport.authenticate("google", { scope: ["profile", "email"] }))

authorsRouter.get("/googleRedirect", passport.authenticate("google", { session: false }), (req, res, next) => {
    try {
        res.redirect(`${process.env.FE_URL}?accessToken=${req.user.accessToken}`)
    } catch (error) {
        next(error)
    }
})

authorsRouter.post("/", async (req, res, next) => {
    try {
        const newAuthor = new AuthorsModel(req.body)
        const { _id } = await newAuthor.save()
        res.status(201).send({ _id })
    } catch (error) {
        next(error)
    }
})

authorsRouter.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body
        const author = await AuthorsModel.checkCredentials(email, password)
        if (author) {
            const { accessToken, refreshToken } = await createTokens(author)
            res.send({ accessToken, refreshToken })
        } else {
            next(createError(401, "Credentials are not ok!"))
        }
    } catch (error) {
        next(error)
    }
})

authorsRouter.post("/refreshTokens", async (req, res, next) => {
    try {
        const { currentRefreshToken } = req.body
        const { accessToken, refreshToken } = await verifyTokensAndCreateNewTokens(currentRefreshToken)
        res.send({ accessToken, refreshToken })
    } catch (error) {
        next(error)
    }
})

authorsRouter.get("/", JWTAuthMiddleware, adminOnlyMiddleware, async (req, res, next) => {
    try {
        console.log("req.query:", req.query)
        console.log("q2m:", q2m(req.query))
        const mongoQuery = q2m(req.query)
        const authors = await AuthorsModel.find(mongoQuery.criteria, mongoQuery.options.fields)
            .limit(mongoQuery.options.limit)
            .skip(mongoQuery.options.skip)
            .sort(mongoQuery.options.sort)
        const total = await AuthorsModel.countDocuments(mongoQuery.criteria)
        console.log(req.url)
        res.send({
            links: mongoQuery.links("http://localhost:3001/authors", total),
            total,
            numberOfPages: Math.ceil(total / mongoQuery.options.limit),
            authors
        })
    } catch (error) {
        next(error)
    }
})

authorsRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
    try {
        const author = await AuthorsModel.findById(req.author._id)
        res.send(author)
    } catch (error) {
        next(error)
    }
})

authorsRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
    try {
        const updatedAuthor = await AuthorsModel.findByIdAndUpdate(req.author._id, req.body, { new: true, runValidators: true })
        res.send(updatedAuthor)
    } catch (error) {
        next(error)
    }
})

authorsRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
    try {
        await AuthorsModel.findOneAndDelete(req.author._id)
        res.status(204).send()
    } catch (error) {
        next(error)
    }
})

authorsRouter.get("/:authorID", JWTAuthMiddleware, async (req, res, next) => {
    try {
        const author = await AuthorsModel.findById(req.params.authorID)
        if (author) {
            res.send(author)
        } else {
            next(createHttpError(404, `Author with id ${req.params.authorID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

authorsRouter.put("/:authorID", JWTAuthMiddleware, adminOnlyMiddleware, async (req, res, next) => {
    try {
        const updatedAuthor = await AuthorsModel.findByIdAndUpdate(
            req.params.authorID,
            req.body,
            { new: true, runValidators: true }
        )
        if (updatedAuthor) {
            res.send(updatedAuthor)
        } else {
            next(createHttpError(404, `Author with id ${req.params.authorID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

authorsRouter.delete("/:authorID", JWTAuthMiddleware, adminOnlyMiddleware, async (req, res, next) => {
    try {
        const deletedAuthor = await AuthorsModel.findByIdAndDelete(req.params.authorID)
        if (deletedAuthor) {
            res.status(204).send()
        } else {
            next(createHttpError(404, `Author with id ${req.params.authorID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

export default authorsRouter
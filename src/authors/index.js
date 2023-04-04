import express from "express"
import createHttpError from "http-errors"
import AuthorsModel from "./model.js"
import q2m from "query-to-mongo"

const authorsRouter = express.Router()

authorsRouter.post("/", async (req, res, next) => {
    try {
        const newAuthor = new AuthorsModel(req.body)
        const { _id } = await newAuthor.save()
        res.status(201).send({ _id })
    } catch (error) {
        next(error)
    }
})

authorsRouter.get("/", async (req, res, next) => {
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

authorsRouter.get("/:authorID", async (req, res, next) => {
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

authorsRouter.put("/:authorID", async (req, res, next) => {
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

authorsRouter.delete("/:authorID", async (req, res, next) => {
    try {
        const deletedAuthor = await AuthorsModel.findByIdAndDelete(req.params.authorID)
        if (deletedAuthor) {
            res.status(204).semd()
        } else {
            next(createHttpError(404, `Author with id ${req.params.authorID} not found!`))
        }
    } catch (error) {
        next(error)
    }
})

export default authorsRouter